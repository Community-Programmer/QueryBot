import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Code, Database, BarChart3, FileText, Brain, Sparkles } from 'lucide-react';
import type { GraphState } from '@/types/playground';

interface WorkflowStatesProps {
  graphState: GraphState;
}

const WorkflowStates: React.FC<WorkflowStatesProps> = ({ graphState }) => {
  const getStateIcon = (completed: boolean, hasError?: boolean, isSkipped?: boolean) => {
    if (hasError) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isSkipped) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    if (completed) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStateColor = (completed: boolean, hasError?: boolean, isSkipped?: boolean) => {
    if (hasError) return 'bg-red-50 border-red-200';
    if (isSkipped) return 'bg-yellow-50 border-yellow-200';
    if (completed) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  // Check if this was an irrelevant question that skipped normal workflow
  const isIrrelevantQuestion = !!graphState.handle_irrelevant;

  const states = [
    {
      name: 'Question Classification',
      key: 'classify_question',
      icon: <Brain className="w-5 h-5" />,
      completed: !!graphState.question_type || !!graphState.classify_question || isIrrelevantQuestion,
      data: graphState.question_type || (isIrrelevantQuestion ? 'irrelevant' : undefined),
      description: 'Analyzing question type and requirements'
    },
    {
      name: 'Question Parsing',
      key: 'parse_question',
      icon: <FileText className="w-5 h-5" />,
      completed: !!graphState.parsed_question || !!graphState.parse_question,
      isSkipped: isIrrelevantQuestion,
      data: isIrrelevantQuestion ? 'Skipped - irrelevant question' : graphState.parsed_question,
      description: 'Breaking down question into components'
    },
    {
      name: 'Noun Extraction',
      key: 'get_unique_nouns',
      icon: <Code className="w-5 h-5" />,
      completed: !!graphState.unique_nouns || !!graphState.get_unique_nouns,
      isSkipped: isIrrelevantQuestion,
      data: isIrrelevantQuestion ? 'Skipped - irrelevant question' : graphState.unique_nouns,
      description: 'Identifying key entities and terms'
    },
    {
      name: 'SQL Generation',
      key: 'generate_sql',
      icon: <Database className="w-5 h-5" />,
      completed: !!graphState.sql_query || !!graphState.generate_sql,
      isSkipped: isIrrelevantQuestion,
      data: isIrrelevantQuestion ? 'Skipped - irrelevant question' : graphState.sql_query,
      description: 'Creating SQL query from parsed question'
    },
    {
      name: 'SQL Validation',
      key: 'validate_and_fix_sql',
      icon: <CheckCircle className="w-5 h-5" />,
      completed: graphState.sql_valid !== undefined || !!graphState.validate_and_fix_sql,
      hasError: !isIrrelevantQuestion && graphState.sql_valid === false,
      isSkipped: isIrrelevantQuestion,
      data: isIrrelevantQuestion ? 'Skipped - irrelevant question' : graphState.sql_issues,
      description: 'Validating and fixing SQL syntax'
    },
    {
      name: 'Query Execution',
      key: 'execute_sql',
      icon: <Database className="w-5 h-5" />,
      completed: !!graphState.results || !!graphState.execute_sql,
      hasError: !isIrrelevantQuestion && !!graphState.error,
      isSkipped: isIrrelevantQuestion,
      data: isIrrelevantQuestion ? 'Skipped - irrelevant question' : graphState.results,
      description: 'Running SQL query against database'
    },
    {
      name: 'Result Formatting',
      key: 'format_results',
      icon: <FileText className="w-5 h-5" />,
      completed: !!graphState.answer || !!graphState.format_results || !!graphState.handle_irrelevant,
      data: graphState.answer,
      description: 'Formatting query results into readable text'
    },
    {
      name: 'Visualization Selection',
      key: 'choose_visualization',
      icon: <BarChart3 className="w-5 h-5" />,
      completed: !!graphState.visualization || !!graphState.choose_visualization || !!graphState.handle_irrelevant,
      data: graphState.visualization || (isIrrelevantQuestion ? 'none - not data-related' : undefined),
      description: 'Choosing appropriate visualization type'
    },
    {
      name: 'Chart Generation',
      key: 'generate_chart',
      icon: <BarChart3 className="w-5 h-5" />,
      completed: !!graphState.chart_image_base64 || !!graphState.generate_chart || (isIrrelevantQuestion && graphState.visualization === 'none'),
      hasError: !isIrrelevantQuestion && !!graphState.chart_generation_error,
      isSkipped: isIrrelevantQuestion || graphState.visualization === 'none',
      data: isIrrelevantQuestion ? 'Skipped - no visualization needed' : (graphState.chart_image_base64 ? 'Base64 image generated' : graphState.chart_generation_error),
      description: 'Creating chart visualization from data'
    },
    {
      name: 'Table Formatting',
      key: 'format_table',
      icon: <FileText className="w-5 h-5" />,
      completed: !!graphState.formatted_table || !!graphState.format_table || (isIrrelevantQuestion && !graphState.formatted_table),
      isSkipped: isIrrelevantQuestion && !graphState.formatted_table,
      data: isIrrelevantQuestion && !graphState.formatted_table ? 'Skipped - no table needed' : graphState.formatted_table,
      description: 'Formatting data into structured table'
    },
    {
      name: 'Insights Generation',
      key: 'generate_insights',
      icon: <Sparkles className="w-5 h-5" />,
      completed: !!graphState.insights || !!graphState.generate_insights,
      hasError: !!graphState.insights_error,
      data: graphState.insights || graphState.insights_error,
      description: 'Generating analytical insights from results'
    },
    {
      name: 'Response Finalization',
      key: 'finalize_response',
      icon: <CheckCircle className="w-5 h-5" />,
      completed: !!graphState.data_narrative || !!graphState.finalize_response || !!graphState.handle_irrelevant,
      data: graphState.data_narrative,
      description: 'Finalizing complete response'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-[#333A3F] mb-4">Workflow Progress</h3>
      
      {states.map((state) => (
        <Card 
          key={state.key} 
          className={`p-3 border transition-all duration-200 ${getStateColor(state.completed, state.hasError, (state as any).isSkipped)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getStateIcon(state.completed, state.hasError, (state as any).isSkipped)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {state.icon}
                <span className="font-medium text-[#333A3F]">{state.name}</span>
                <Badge 
                  variant={state.hasError ? 'destructive' : (state as any).isSkipped ? 'outline' : state.completed ? 'default' : 'secondary'}
                  className="ml-auto"
                >
                  {state.hasError ? 'Error' : (state as any).isSkipped ? 'Skipped' : state.completed ? 'Complete' : 'Pending'}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{state.description}</p>
              
              {state.data && (
                <div className="bg-white rounded p-2 text-xs">
                  {typeof state.data === 'string' ? (
                    <div className="text-gray-700 break-words">{state.data}</div>
                  ) : Array.isArray(state.data) ? (
                    <div className="text-gray-700">
                      {state.data.length > 0 ? (
                        <div>
                          <div className="font-medium mb-1">Items ({state.data.length}):</div>
                          <div className="space-y-1">
                            {state.data.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="text-xs">
                                {typeof item === 'string' ? item : JSON.stringify(item)}
                              </div>
                            ))}
                            {state.data.length > 3 && (
                              <div className="text-gray-500">...and {state.data.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        'Empty array'
                      )}
                    </div>
                  ) : (
                    <pre className="text-gray-700 whitespace-pre-wrap break-words">
                      {JSON.stringify(state.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default WorkflowStates;