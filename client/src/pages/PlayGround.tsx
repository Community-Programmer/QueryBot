import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Send, FileText, BarChart3, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import { Sidebar } from '@/components/playground/Sidebar';
import EnhancedResponseDisplay from '@/components/playground/EnhancedResponseDisplay';
import { uploadDatabase, runQuery } from '@/services/playgroundAPI';
import type { GraphState } from '@/types/playground';

const PlayGround: React.FC = () => {
  const [fileName, setFileName] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [graphState, setGraphState] = useState<GraphState | null>(null);
  const [databaseUuid, setDatabaseUuid] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileName(file.name);

    try {
      const uuid = await uploadDatabase(file);
      setDatabaseUuid(uuid);
      setChatMessages([{ type: 'system', text: `File "${file.name}" uploaded successfully!` }]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      setChatMessages([{ type: 'error', text: `Failed to upload file: ${message}` }]);
    } finally {
      setIsUploading(false);
    }
  };

  // Run query
  const run = useCallback(
    async (question: string) => {
      setIsRunning(true);
      setGraphState({ question, uuid: databaseUuid || '' });

      try {
        await runQuery(
          question,
          (streamData) => {
            setGraphState((prev) => {
              const newState = { ...(prev || {}), ...streamData };

              // Handle all streaming data - merge directly for simplicity
              Object.keys(streamData).forEach(key => {
                const value = (streamData as any)[key];
                
                if (key === 'classify_question' && typeof value === 'object' && value) {
                  newState.classify_question = value;
                  if (value.question_type) newState.question_type = value.question_type;
                  if (value.requires_visualization !== undefined) newState.requires_visualization = value.requires_visualization;
                  if (value.requires_table !== undefined) newState.requires_table = value.requires_table;
                } 
                else if (key === 'handle_irrelevant' && typeof value === 'object' && value) {
                  newState.handle_irrelevant = value;
                  // Handle irrelevant question response
                  if (value.answer) newState.answer = value.answer;
                  if (value.visualization) newState.visualization = value.visualization;
                  if (value.visualization_reason) newState.visualization_reason = value.visualization_reason;
                  if (value.chart_image_base64 !== undefined) newState.chart_image_base64 = value.chart_image_base64;
                  if (value.insights) newState.insights = value.insights;
                  if (value.formatted_table !== undefined) newState.formatted_table = value.formatted_table;
                  if (value.data_narrative) newState.data_narrative = value.data_narrative;
                }
                else if (key === 'validate_and_fix_sql' && typeof value === 'object' && value) {
                  newState.validate_and_fix_sql = value;
                  if (value.valid !== undefined) newState.sql_valid = value.valid;
                  if (value.issues) newState.sql_issues = value.issues;
                }
                else if (key === 'format_results') {
                  newState.format_results = value;
                  if (typeof value === 'object' && value?.answer) {
                    newState.answer = value.answer;
                  } else if (typeof value === 'string') {
                    newState.answer = value;
                  }
                }
                else if (key === 'choose_visualization' && typeof value === 'object' && value) {
                  newState.choose_visualization = value;
                  if (value.visualization) newState.visualization = value.visualization;
                  if (value.reason) newState.visualization_reason = value.reason;
                }
                else if (key === 'generate_chart' && typeof value === 'object' && value) {
                  newState.generate_chart = value;
                  if (value.chart_image_base64 !== undefined) newState.chart_image_base64 = value.chart_image_base64;
                  if (value.chart_generation_error !== undefined) newState.chart_generation_error = value.chart_generation_error;
                }
                else if (key === 'format_table' && typeof value === 'object' && value) {
                  newState.format_table = value;
                  if (value.formatted_table) newState.formatted_table = value.formatted_table;
                }
                else if (key === 'generate_insights' && typeof value === 'object' && value) {
                  newState.generate_insights = value;
                  if (value.insights) newState.insights = value.insights;
                  if (value.insights_error) newState.insights_error = value.insights_error;
                }
                else if (key === 'finalize_response' && typeof value === 'object' && value) {
                  newState.finalize_response = value;
                  if (value.data_narrative) newState.data_narrative = value.data_narrative;
                  if (value.chart_image_base64) newState.chart_image_base64 = value.chart_image_base64;
                  if (value.insights) newState.insights = value.insights;
                  if (value.formatted_table) newState.formatted_table = value.formatted_table;
                }
                else {
                  // Direct assignment for simple values
                  newState[key as keyof GraphState] = value;
                }
              });

              return newState;
            });
          },
          databaseUuid
        );
      } catch (error) {
        setGraphState((prev) => ({
          ...prev!,
          error: error instanceof Error ? error.message : 'Query execution failed',
        }));
      } finally {
        setIsRunning(false);
      }
    },
    [databaseUuid]
  );

  // Quick actions
  const handleGetOverview = async () => {
    if (!databaseUuid && !fileName)
      return setChatMessages([...chatMessages, { type: 'error', text: 'Please upload a file first.' }]);
    const question = 'Give me an overview of this dataset';
    setChatMessages([...chatMessages, { type: 'user', text: question }]);
    await run(question);
  };

  const handleAnalyzeData = async () => {
    if (!databaseUuid && !fileName)
      return setChatMessages([...chatMessages, { type: 'error', text: 'Please upload a file first.' }]);
    const question = 'Analyze this data and show me the key insights';
    setChatMessages([...chatMessages, { type: 'user', text: question }]);
    await run(question);
  };

  const handleAskQuestion = async () => {
    if (!chatInput.trim()) return;
    const userMessage = { type: 'user', text: chatInput };
    const currentInput = chatInput;
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    await run(currentInput);
  };

  // Styles for chat messages
  const getMessageStyles = (type: string) => {
    const base = 'p-3.5 px-[18px] mb-3 rounded-xl shadow-sm animate-[slideIn_0.3s_ease]';
    switch (type) {
      case 'user':
        return `${base} bg-[#B4F0A7] text-[#333A3F] ml-5`;
      case 'ai':
        return `${base} bg-[#DDF7E3] text-[#333A3F] mr-5`;
      case 'system':
        return `${base} bg-[#009B72] text-white`;
      case 'error':
        return `${base} bg-[#ff6b6b] text-white`;
      default:
        return base;
    }
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  // Determine current processing step
  const getCurrentStep = (state: GraphState): string => {
    if (state.finalize_response) return 'finalize_response';
    if (state.generate_insights) return 'generate_insights';
    if (state.format_table) return 'format_table';
    if (state.generate_chart) return 'generate_chart';
    if (state.choose_visualization) return 'choose_visualization';
    if (state.format_results) return 'format_results';
    if (state.execute_sql) return 'execute_sql';
    if (state.validate_and_fix_sql) return 'validate_and_fix_sql';
    if (state.generate_sql) return 'generate_sql';
    if (state.get_unique_nouns) return 'get_unique_nouns';
    if (state.parse_question) return 'parse_question';
    if (state.classify_question) return 'classify_question';
    return 'Processing';
  };

  const handleDownload = () => {
    if (!graphState) return;

    const downloadData = {
      question: graphState.question,
      answer: graphState.answer,
      visualization: graphState.visualization,
      results: graphState.results,
      insights: graphState.insights,
      formatted_table: graphState.formatted_table,
      data_narrative: graphState.data_narrative,
      chart_available: !!graphState.chart_image_base64,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(downloadData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `querybot_results_${Date.now()}.json`);
    link.click();
  };

  // Sidebar outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) setShowSidebar(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  return (
    <div className="flex gap-6 p-6 min-h-screen bg-[#FAF9F6] max-w-[1920px] mx-auto flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="flex flex-col gap-5 w-full lg:w-[420px] flex-shrink-0">
        {/* Upload */}
        <Card className="p-0 bg-white border-2 border-dashed border-[#DDF7E3] rounded-2xl overflow-hidden hover:border-[#009B72] hover:shadow-lg transition-all duration-300">
          <label
            htmlFor="csv-upload"
            className="flex items-center justify-center gap-3 p-7 cursor-pointer hover:bg-[#DDF7E3] transition-colors"
          >
            <Upload className="w-6 h-6 text-[#009B72]" />
            <span className="text-lg font-semibold text-[#333A3F]">
              {isUploading ? 'Uploading...' : fileName || 'Upload CSV/SQLite'}
            </span>
          </label>
          <input id="csv-upload" type="file" accept=".csv,.sqlite" onChange={handleFileUpload} className="hidden" />
        </Card>

        {/* Actions */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <Button
            onClick={handleGetOverview}
            disabled={isRunning}
            className="flex-1 h-14 bg-white border border-[#DDF7E3] text-[#333A3F] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#009B72] hover:text-white transition-all"
          >
            <FileText className="w-5 h-5" />
            Get Dataset Overview
          </Button>
          <Button
            onClick={handleAnalyzeData}
            disabled={isRunning}
            className="flex-1 h-14 bg-white border border-[#DDF7E3] text-[#333A3F] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#009B72] hover:text-white transition-all"
          >
            <TrendingUp className="w-5 h-5" />
            Analyze Data
          </Button>
        </div>

        {/* Chat */}
        <Card className="flex-1 flex flex-col bg-white border border-[#DDF7E3] rounded-2xl overflow-hidden shadow-sm">
          <div
            ref={chatContainerRef}
            className="flex-1 p-5 h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#DDF7E3]"
          >
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#333A3F] opacity-40">
                <BarChart3 className="w-12 h-12 mb-3" />
                <p>Upload a file and ask questions about your data</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={getMessageStyles(msg.type)}>
                    {msg.text}
                  </div>
                ))}
                {isRunning && <div className={getMessageStyles('ai')}>Processing your query...</div>}
                <div ref={chatMessagesEndRef} />
              </div>
            )}
          </div>
          <div className="flex gap-3 p-5 border-t border-[#DDF7E3] bg-[#FAF9F6]">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Ask a question about your data..."
              className="flex-1 h-12 border border-[#DDF7E3] rounded-xl px-4 focus:border-[#009B72]"
            />
            <Button
              onClick={handleAskQuestion}
              disabled={!chatInput.trim() || isRunning}
              className="h-12 px-7 bg-[#009B72] text-white rounded-xl hover:bg-[#007d5c] transition-all"
            >
              <Send className="w-[18px] h-[18px]" />
              {isRunning ? 'Running...' : 'Ask'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0">
        <Card className="h-[600px] lg:h-[calc(100vh-48px)] bg-white border border-[#DDF7E3] rounded-2xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-[#DDF7E3]">
            <h2 className="text-2xl font-bold text-[#333A3F]">Data Output</h2>
            <div className="flex gap-2">
              {graphState && (
                <Button
                  onClick={toggleSidebar}
                  variant="ghost"
                  size="icon"
                  className="w-11 h-11 border border-[#DDF7E3] rounded-xl hover:bg-[#009B72]"
                >
                  <Eye className="w-5 h-5 text-[#333A3F]" />
                </Button>
              )}
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="icon"
                className="w-11 h-11 border border-[#DDF7E3] rounded-xl hover:bg-[#009B72]"
                disabled={!graphState || (!graphState.answer && !graphState.results && !graphState.insights && !graphState.formatted_table)}
              >
                <Download className="w-5 h-5 text-[#333A3F]" />
              </Button>
            </div>
          </div>

          {!graphState || (!graphState.answer && !graphState.chart_image_base64 && !graphState.formatted_table && !graphState.insights && !graphState.handle_irrelevant && !isRunning) ? (
            <EnhancedResponseDisplay 
              graphState={graphState || {} as GraphState} 
              isRunning={false} 
            />
          ) : (graphState.answer || graphState.chart_image_base64 || graphState.formatted_table || graphState.insights || graphState.handle_irrelevant) ? (
            <EnhancedResponseDisplay 
              graphState={graphState} 
              isRunning={false} 
            />
          ) : (
            <EnhancedResponseDisplay 
              graphState={graphState} 
              isRunning={isRunning}
              currentStep={getCurrentStep(graphState)}
            />
          )}
        </Card>
      </div>

      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
          <Sidebar onClose={toggleSidebar} graphState={graphState!} />
        </div>
      )}
    </div>
  );
};

export default PlayGround;
