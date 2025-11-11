import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Send, FileText, BarChart3, TrendingUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import { Stream } from '@/components/playground/Stream';
import { Sidebar } from '@/components/playground/Sidebar';
import { uploadDatabase, runQuery } from '@/services/playgroundAPI';
import type { GraphState } from '@/types/playground';

// Chart components
import PieChart from '@/components/graphs/PieChart';
import BarGraph from '@/components/graphs/BarGraph';
import LineGraph from '@/components/graphs/LineGraph';
import ScatterPlot from '@/components/graphs/ScatterPlot';
import HorizontalBarGraph from '@/components/graphs/HorizontalBarGraph';

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

              if (streamData.parse_question) newState.parsed_question = streamData.parse_question;
              if (streamData.get_unique_nouns) newState.unique_nouns = streamData.get_unique_nouns;
              if (streamData.generate_sql) newState.sql_query = streamData.generate_sql;

              if (streamData.validate_and_fix_sql) {
                newState.sql_valid = streamData.validate_and_fix_sql.valid;
                newState.sql_issues = streamData.validate_and_fix_sql.issues;
              }

              if (streamData.execute_sql) newState.results = streamData.execute_sql;

              if (streamData.format_results) {
                newState.answer =
                  typeof streamData.format_results === 'object' && streamData.format_results?.answer
                    ? streamData.format_results.answer
                    : streamData.format_results;
              }

              if (streamData.choose_visualization) {
                newState.visualization = streamData.choose_visualization.visualization;
                newState.visualization_reason = streamData.choose_visualization.reason;
              }

              if (streamData.format_data_for_visualization) {
                newState.formatted_data_for_visualization =
                  streamData.format_data_for_visualization.formatted_data_for_visualization;
              }

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

  const handleDownload = () => {
    if (!graphState?.results) return;
    const dataStr = JSON.stringify(graphState.results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `query_results_${Date.now()}.json`);
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

  // Chart renderer
  const renderChart = (vizType?: string, chartData?: any) => {
    if (!vizType) return null;
    const type = vizType.toLowerCase();

    switch (type) {
      case 'pie':
      case 'pie_chart':
        return <PieChart data={Array.isArray(chartData) ? chartData : []} />;
      case 'bar':
      case 'bar_chart':
        return <BarGraph data={chartData} />;
      case 'line':
      case 'line_chart':
        return <LineGraph data={chartData} />;
      case 'scatter':
      case 'scatter_plot':
        return <ScatterPlot data={chartData} />;
      case 'horizontal_bar':
      case 'horizontal_bar_chart':
        return <HorizontalBarGraph data={chartData} />;
      default:
        return <div className="text-red-500 p-4 text-center">Unknown visualization: {vizType}</div>;
    }
  };

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
                disabled={!graphState?.results}
              >
                <Download className="w-5 h-5 text-[#333A3F]" />
              </Button>
            </div>
          </div>

          {!graphState ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[#333A3F] opacity-40">
              <FileText className="w-16 h-16 mb-4" />
              <p>No data processed yet</p>
              <p className="text-sm mt-2">Upload a file and ask a question to get started</p>
            </div>
          ) : graphState.formatted_data_for_visualization ? (
            <div className="flex-1 p-7 overflow-hidden">
              {graphState.answer && <div className="text-lg mb-4">{graphState.answer}</div>}
              <div className="flex-1 flex items-center justify-center">
                {renderChart(graphState.visualization, graphState.formatted_data_for_visualization)}
              </div>
            </div>
          ) : graphState.answer ? (
            <div className="flex-1 p-7 overflow-auto">
              <div>{graphState.answer}</div>
              {graphState.visualization_reason && (
                <div className="text-sm mt-4 text-gray-500">
                  <strong>Note:</strong> {graphState.visualization_reason}
                </div>
              )}
              {graphState.error && (
                <div className="text-sm mt-4 text-red-500">
                  <strong>Error:</strong> {graphState.error}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Stream graphState={graphState} />
            </div>
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
