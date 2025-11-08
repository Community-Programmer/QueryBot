import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Send, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PlayGround: React.FC = () => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // TODO: Implement actual CSV parsing logic
      setChatMessages([{ type: 'system', text: `CSV file "${file.name}" uploaded successfully!` }]);
    }
  };

  const handleGetOverview = () => {
    if (csvData.length === 0) {
      setChatMessages([...chatMessages, { type: 'error', text: 'Please upload a CSV file first.' }]);
      return;
    }
    // TODO: Implement actual overview generation logic
    setChatMessages([...chatMessages, {
      type: 'system',
      text: 'Dataset overview will be generated here.'
    }]);
  };

  const handleAnalyzeData = () => {
    if (csvData.length === 0) {
      setChatMessages([...chatMessages, { type: 'error', text: 'Please upload a CSV file first.' }]);
      return;
    }
    // TODO: Implement actual data analysis logic
    setChatMessages([...chatMessages, {
      type: 'system',
      text: 'Data analysis will be performed here.'
    }]);
  };

  const handleAskQuestion = () => {
    if (!chatInput.trim()) return;
    if (csvData.length === 0) {
      setChatMessages([...chatMessages, { type: 'error', text: 'Please upload a CSV file first.' }]);
      setChatInput('');
      return;
    }

    const userMessage = { type: 'user', text: chatInput };
    const aiResponse = { type: 'ai', text: 'AI response will be generated here.' };
    
    setChatMessages([...chatMessages, userMessage, aiResponse]);
    setChatInput('');
  };

  const handleDownload = () => {
    if (csvData.length === 0) return;
    
    // TODO: Implement actual CSV download logic
    console.log('Download functionality will be implemented here');
  };

  const getMessageStyles = (type: string) => {
    const baseStyles = "p-3.5 px-[18px] mb-3 rounded-xl shadow-sm animate-[slideIn_0.3s_ease]";
    
    switch(type) {
      case 'user':
        return `${baseStyles} bg-[#B4F0A7] text-[#333A3F] ml-5`;
      case 'ai':
        return `${baseStyles} bg-[#DDF7E3] text-[#333A3F] mr-5`;
      case 'system':
        return `${baseStyles} bg-[#009B72] text-white`;
      case 'error':
        return `${baseStyles} bg-[#ff6b6b] text-white`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className="flex gap-6 p-6 min-h-screen bg-[#FAF9F6] max-w-[1920px] mx-auto flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="flex flex-col gap-5 w-full lg:w-[420px] flex-shrink-0">
        {/* Upload Section */}
        <Card className="p-0 bg-white border-2 border-dashed border-[#DDF7E3] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#009B72] hover:shadow-lg hover:shadow-[#009B72]/15 hover:-translate-y-0.5">
          <label htmlFor="csv-upload" className="flex items-center justify-center gap-3 p-7 cursor-pointer transition-colors duration-300 hover:bg-[#DDF7E3]">
            <Upload className="w-6 h-6 text-[#009B72]" />
            <span className="text-lg font-semibold text-[#333A3F]">{fileName || 'Upload CSV'}</span>
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <Button 
            onClick={handleGetOverview}
            className="flex-1 h-14 bg-white border border-[#DDF7E3] text-[#333A3F] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#009B72] hover:border-[#009B72] hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#009B72]/20 shadow-sm shadow-[#009B72]/5"
            variant="outline"
          >
            <FileText className="w-5 h-5" />
            Get Dataset Overview
          </Button>
          <Button 
            onClick={handleAnalyzeData}
            className="flex-1 h-14 bg-white border border-[#DDF7E3] text-[#333A3F] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#009B72] hover:border-[#009B72] hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#009B72]/20 shadow-sm shadow-[#009B72]/5"
            variant="outline"
          >
            <TrendingUp className="w-5 h-5" />
            Analyze Data
          </Button>
        </div>

        {/* Chat Section */}
        <Card className="flex-1 flex flex-col bg-white border border-[#DDF7E3] rounded-2xl overflow-hidden max-h-[600px] lg:max-h-none shadow-sm shadow-[#009B72]/8">
          <div 
            ref={chatContainerRef}
            className="flex-1 p-5 h-[400px] max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#DDF7E3] hover:scrollbar-thumb-[#B4F0A7] scrollbar-track-[#FAF9F6] scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
          >
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#333A3F] opacity-40">
                <BarChart3 className="w-12 h-12 mb-3" />
                <p>Upload a CSV and ask questions about your data</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={getMessageStyles(msg.type)}>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="flex gap-3 p-5 border-t border-[#DDF7E3] bg-[#FAF9F6]">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Ask a question about your data..."
              className="flex-1 h-12 border border-[#DDF7E3] rounded-xl px-4 text-sm transition-all duration-300 focus:border-[#009B72] focus:ring-2 focus:ring-[#009B72]/10 bg-white"
            />
            <Button 
              onClick={handleAskQuestion}
              className="h-12 px-7 bg-[#009B72] text-white border-none rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 hover:bg-[#007d5c] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#009B72]/30 shadow-sm shadow-[#009B72]/20"
            >
              <Send className="w-[18px] h-[18px]" />
              Ask
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Panel */}
      <div className="flex-1 min-w-0">
        <Card className="h-[600px] lg:h-[calc(100vh-48px)] bg-white border border-[#DDF7E3] rounded-2xl flex flex-col overflow-hidden shadow-sm shadow-[#009B72]/8">
          <div className="flex justify-between items-center p-6 px-7 border-b border-[#DDF7E3]">
            <h2 className="text-2xl font-bold text-[#333A3F] m-0">Data Output</h2>
            <Button
              onClick={handleDownload}
              variant="ghost"
              size="icon"
              className="w-11 h-11 border border-[#DDF7E3] rounded-xl transition-all duration-300 hover:bg-[#009B72] hover:border-[#009B72] hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#009B72]/20 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
              disabled={csvData.length === 0}
            >
              <Download className={`w-5 h-5 transition-colors duration-300 ${csvData.length === 0 ? 'text-[#333A3F]' : 'text-[#333A3F] group-hover:text-white'}`} />
            </Button>
          </div>

          {csvData.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[#333A3F] opacity-40">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-base">No data loaded yet</p>
              <p className="text-sm mt-2">Upload a CSV file to get started</p>
            </div>
          ) : (
            <Tabs defaultValue="table" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-7 mt-5 bg-[#DDF7E3] p-1 rounded-xl">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="chart">Chart View</TabsTrigger>
              </TabsList>
              <TabsContent value="table" className="flex-1 p-7 overflow-hidden">
                <div className="flex items-center justify-center h-full text-[#333A3F] opacity-40">
                  <p>Table view will be displayed here</p>
                </div>
              </TabsContent>
              <TabsContent value="chart" className="flex-1 p-7 overflow-hidden">
                <div className="flex items-center justify-center h-full text-[#333A3F] opacity-40">
                  <p>Chart view will be displayed here</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PlayGround;
