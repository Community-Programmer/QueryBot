import { config } from '@/config/env';
import type { GraphState, UploadResponse } from '@/types/playground';

// SQLite Server API (port 3001)
const SQLITE_SERVER_URL = 'http://localhost:3001';

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

    const data: UploadResponse = await response.json();
    return data.uuid;
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
  const defaultDatabaseUuid = '921c838c-541d-4361-8c96-70cb23abd9f5';

  try {
    const response = await fetch(`${FLASK_SERVER_URL}/langgraph/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question, 
        databaseUuid: databaseUuid || defaultDatabaseUuid 
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

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle different data formats from the stream
              // The data might be nested in different structures depending on the streaming mode
              let updateData: Partial<GraphState> = {};
              
              // Direct data from finalize_response or other nodes
              if (data.answer || data.chart_image_base64 || data.insights || data.formatted_table) {
                updateData = data;
              }
              // Node-specific data (like from generate_chart, format_table, etc.)
              else if (data.node && data.data) {
                (updateData as any)[data.node] = data.data;
              }
              // If data has a specific node key, use that
              else if (Object.keys(data).length === 1) {
                const key = Object.keys(data)[0];
                updateData[key as keyof GraphState] = data[key];
              }
              // Otherwise, spread the data as is
              else {
                updateData = data;
              }
              
              onUpdate(updateData as GraphState);
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError, 'Raw line:', line);
              // Continue processing other lines instead of failing completely
            }
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

/**
 * Get database schema for a given UUID
 */
export const getDatabaseSchema = async (uuid: string): Promise<string> => {
  try {
    const response = await fetch(`${SQLITE_SERVER_URL}/get-schema/${uuid}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get schema with status ${response.status}`);
    }

    const data = await response.json();
    return data.schema;
  } catch (error) {
    console.error('Error getting database schema:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get database schema');
  }
};

/**
 * Execute a raw SQL query on the database
 */
export const executeQuery = async (uuid: string, query: string): Promise<any[]> => {
  try {
    const response = await fetch(`${SQLITE_SERVER_URL}/execute-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uuid, query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Query execution failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw new Error(error instanceof Error ? error.message : 'Query execution failed');
  }
};