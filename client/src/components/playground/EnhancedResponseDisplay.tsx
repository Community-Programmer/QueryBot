import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Base64ImageDisplay from '@/components/graphs/Base64ImageDisplay';
import ProcessingLoader from '@/components/ui/ProcessingLoader';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { BarChart3, FileText, Lightbulb, Table, AlertCircle } from 'lucide-react';
import type { GraphState } from '@/types/playground';

interface EnhancedResponseDisplayProps {
  graphState: GraphState;
  isRunning?: boolean;
  currentStep?: string;
}

const EnhancedResponseDisplay: React.FC<EnhancedResponseDisplayProps> = ({ 
  graphState, 
  isRunning = false, 
  currentStep = 'Processing' 
}) => {
  const hasChart = !!graphState.chart_image_base64;
  const hasTable = !!graphState.formatted_table;
  const hasInsights = !!graphState.insights && !graphState.insights.includes('No insights available');
  const hasAnswer = !!graphState.answer;
  
  // Check if this is an irrelevant question response
  const isIrrelevantQuestion = graphState.handle_irrelevant || 
    (graphState.question_type === 'irrelevant') ||
    (graphState.answer && graphState.answer.includes("I'm a database query assistant"));
  
  // Check if question is not data-related
  const isNotDataRelated = graphState.data_narrative === "Question is not related to data analysis" ||
    (graphState.insights && graphState.insights.includes('No insights available - question not data-related'));

  // Show processing loader when running - continue until all steps are complete
  if (isRunning && !isIrrelevantQuestion) {
    const stepMessages = {
      'classify_question': 'Analyzing your question type and requirements...',
      'parse_question': 'Breaking down your question into components...',
      'generate_sql': 'Creating SQL query from your question...',
      'execute_sql': 'Running query against your database...',
      'format_results': 'Formatting the results for display...',
      'choose_visualization': 'Selecting the best visualization type...',
      'generate_chart': 'Creating your chart visualization...',
      'generate_insights': 'Analyzing data for key insights...',
      'finalize_response': 'Finalizing your complete response...'
    };
    
    const message = stepMessages[currentStep as keyof typeof stepMessages] || 'Processing your request...';
    
    return <ProcessingLoader currentStep={currentStep} message={message} />;
  }

  // If no data processed yet (empty state)
  if (!hasAnswer && !hasChart && !hasTable && !hasInsights && !isIrrelevantQuestion) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-[#333A3F] opacity-40">
        <FileText className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">No data processed yet</p>
        <p className="text-sm mt-2">Upload a file and ask a question to get started</p>
      </div>
    );
  }

  // Handle irrelevant questions with special UI
  if (isIrrelevantQuestion || isNotDataRelated) {
    return (
      <div className="flex-1 p-7 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-semibold text-amber-800">Question Not Data-Related</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <MarkdownRenderer 
                content={graphState.answer || "This question doesn't appear to be related to database queries or data analysis."}
                className="text-amber-700"
              />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Try asking about:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Data trends and patterns in your dataset</li>
              <li>• Creating charts and visualizations</li>
              <li>• Statistical analysis and insights</li>
              <li>• Data relationships and correlations</li>
              <li>• Summary statistics and aggregations</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const tabsAvailable = [];
  
  if (hasAnswer) {
    tabsAvailable.push({ id: 'answer', label: 'Answer', icon: <FileText className="w-4 h-4" /> });
  }
  
  if (hasChart) {
    tabsAvailable.push({ id: 'chart', label: 'Visualization', icon: <BarChart3 className="w-4 h-4" /> });
  }
  
  if (hasTable) {
    tabsAvailable.push({ id: 'table', label: 'Table', icon: <Table className="w-4 h-4" /> });
  }
  
  if (hasInsights) {
    tabsAvailable.push({ id: 'insights', label: 'Insights', icon: <Lightbulb className="w-4 h-4" /> });
  }

  // Single view if only one type of content
  if (tabsAvailable.length === 1) {
    return (
      <div className="flex-1 p-7 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {hasAnswer && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-[#333A3F]">Response</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <MarkdownRenderer content={graphState.answer || ''} />
            </div>
          </div>
        )}
        
        {hasChart && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Visualization</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm" style={{ minHeight: '400px', maxHeight: '60vh' }}>
              <Base64ImageDisplay 
                base64Data={graphState.chart_image_base64!}
                error={graphState.chart_generation_error}
                className="w-full h-full"
              />
            </div>
            {graphState.visualization_reason && (
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-700">Visualization Type:</span>
                    <span className="ml-2 text-gray-600">{graphState.visualization}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Reason:</span>
                    <div className="mt-1 text-gray-600">{graphState.visualization_reason}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {hasTable && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Data Table</h3>
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
              <div className="min-w-max">
                <pre className="whitespace-pre-wrap text-sm">{graphState.formatted_table}</pre>
              </div>
            </div>
          </div>
        )}
        
        {hasInsights && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-[#333A3F]">Insights</h3>
            <div className="bg-blue-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <MarkdownRenderer content={graphState.insights || ''} />
            </div>
            {graphState.insights_error && (
              <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Insights Generation Error</span>
                </div>
                <div className="text-red-500 text-sm mt-1">{graphState.insights_error}</div>
              </div>
            )}
          </div>
        )}

        {graphState.data_narrative && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-[#333A3F]">Summary</h3>
            <div className="bg-green-50 p-4 rounded-lg max-h-48 overflow-y-auto">
              <MarkdownRenderer content={graphState.data_narrative} />
            </div>
          </div>
        )}

        {graphState.error && (
          <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <div className="text-red-500 text-sm mt-1">{graphState.error}</div>
          </div>
        )}
      </div>
    );
  }

  // Multi-tab view if multiple types of content
  return (
    <div className="flex-1 flex flex-col">
      <Tabs defaultValue={tabsAvailable[0]?.id} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            {tabsAvailable.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 text-sm"
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {hasAnswer && (
            <TabsContent value="answer" className="p-6 mt-0 h-full overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-[#333A3F]">Response</h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <MarkdownRenderer content={graphState.answer || ''} />
                </div>
                
                {graphState.data_narrative && (
                  <div>
                    <h4 className="font-medium mb-2 text-[#333A3F]">Summary</h4>
                    <div className="bg-green-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                      <MarkdownRenderer content={graphState.data_narrative} />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {hasChart && (
            <TabsContent value="chart" className="p-6 mt-0 h-full overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-[#333A3F]">Visualization</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm" style={{ minHeight: '400px', maxHeight: '70vh' }}>
                  <Base64ImageDisplay 
                    base64Data={graphState.chart_image_base64!}
                    error={graphState.chart_generation_error}
                    className="w-full h-full"
                  />
                </div>
                {graphState.visualization_reason && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-gray-700">Visualization Type:</span>
                        <div className="mt-1 text-gray-600">{graphState.visualization}</div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Reason:</span>
                        <div className="mt-1">
                          <MarkdownRenderer content={graphState.visualization_reason} className="text-gray-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {hasTable && (
            <TabsContent value="table" className="p-6 mt-0 h-full overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-[#333A3F]">Data Table</h3>
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 border scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                  <div className="min-w-max">
                    <MarkdownRenderer content={`\`\`\`\n${graphState.formatted_table || ''}\n\`\`\``} />
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {hasInsights && (
            <TabsContent value="insights" className="p-6 mt-0 h-full overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-[#333A3F]">AI Insights</h3>
                <div className="bg-blue-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <MarkdownRenderer content={graphState.insights || ''} />
                </div>
                {graphState.insights_error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Insights Generation Error</span>
                    </div>
                    <MarkdownRenderer content={graphState.insights_error} className="text-red-500 text-sm" />
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>

      {graphState.error && (
        <div className="p-6 pt-0">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Error</span>
            </div>
            <div className="text-red-500 text-sm mt-1">{graphState.error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedResponseDisplay;