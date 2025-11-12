import { config } from '@/config/env';
import type { GraphState } from '@/types/playground';

// SQLite Server API (port 3001)
const SQLITE_SERVER_URL = config.SQLITE_API_BASE_URL;

// Flask Server API (port 5000) - using config
const FLASK_SERVER_URL = config.API_BASE_URL;

/**
 * Upload a file to the SQLite server
 */
export const uploadDatabase = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${SQLITE_SERVER_URL}/upload-file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const responseData = await response.json();
    
    // Handle the server response structure: { success: true, data: { uuid: "..." } }
    if (responseData.success && responseData.data && responseData.data.uuid) {
      return responseData.data.uuid;
    }
    
    // Fallback for older response format: { uuid: "..." }
    if (responseData.uuid) {
      return responseData.uuid;
    }
    
    throw new Error('Invalid response format: missing UUID');
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(error instanceof Error ? error.message : 'Upload failed');
  }
};

/**
 * Run a query through the Flask server with streaming response
 */
export const runQuery = async (
  question: string, 
  onUpdate: (data: GraphState) => void,
  databaseUuid?: string | null
): Promise<void> => {
  // Ensure we have a valid database UUID from an uploaded file
  if (!databaseUuid || databaseUuid.trim() === '') {
    throw new Error('No database uploaded. Please upload a CSV or SQLite file first.');
  }

  try {
    const response = await fetch(`${FLASK_SERVER_URL}/langgraph/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question, 
        databaseUuid: databaseUuid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Query failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    const decoder = new TextDecoder();

    // Buffer to hold partial chunks between reads so we only try to parse complete SSE events
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // SSE events are separated by a blank line (\n\n). Split into complete events.
        const parts = buffer.split('\n\n');

        // The last part may be incomplete, keep it in the buffer for the next read
        buffer = parts.pop() || '';

        for (const part of parts) {
          // Each part may contain multiple lines starting with 'data: '
          const lines = part.split('\n');

          // Collect all data: lines for this event (they may be split across multiple data: lines)
          const dataLines = lines
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).trim());

          if (dataLines.length === 0) continue;

          const dataStr = dataLines.join('\n');

          // Some streams send a sentinel like [DONE]
          if (dataStr.trim() === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);

            // Handle different data formats from the stream
            let updateData: Partial<GraphState> = {};

            if (data.answer || data.chart_image_base64 || data.insights || data.formatted_table) {
              updateData = data;
            } else if (data.node && data.data) {
              (updateData as any)[data.node] = data.data;
            } else if (Object.keys(data).length === 1) {
              const key = Object.keys(data)[0];
              updateData[key as keyof GraphState] = data[key];
            } else {
              updateData = data;
            }

            onUpdate(updateData as GraphState);
          } catch (parseError) {
            // Log the problematic event for debugging but continue; keep buffer logic to avoid
            // trying to parse partial JSON.
            console.error('Error parsing SSE data:', parseError, 'Event chunk:', dataStr.slice(0, 200));
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Error in runQuery:', error);
    throw new Error(error instanceof Error ? error.message : 'Query execution failed');
  }
};
