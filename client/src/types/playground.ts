// Core application state for processed data
export interface CoreGraphState {
  question: string;
  uuid: string;
  
  // Final outputs
  answer?: string;
  chart_image_base64?: string;
  chart_generation_error?: string;
  insights?: string;
  formatted_table?: string;
  data_narrative?: string;
  insights_error?: string;
  
  // Visualization info
  visualization?: string;
  visualization_reason?: string;
  
  // Question classification
  question_type?: string;
  requires_visualization?: boolean;
  requires_table?: boolean;
  
  // Processing state
  parsed_question?: { [key: string]: any };
  unique_nouns?: string[];
  sql_query?: string;
  sql_valid?: boolean;
  sql_issues?: string;
  results?: any[];
  error?: string;
}

// Extended state for streaming and debugging
export interface GraphState extends CoreGraphState {
  // Stream-specific properties for workflow tracking
  run_id?: string;
  attempt?: number;
  
  // Node execution results (for debugging/workflow tracking)
  classify_question?: any;
  parse_question?: any;
  get_unique_nouns?: any;
  generate_sql?: any;
  validate_and_fix_sql?: any;
  execute_sql?: any;
  format_results?: any;
  choose_visualization?: any;
  generate_chart?: any;
  format_table?: any;
  generate_insights?: any;
  finalize_response?: any;
  handle_irrelevant?: any;
  
  // Deprecated - kept for backward compatibility
  formatted_data_for_visualization?: { [key: string]: any };
}

export interface UploadResponse {
  uuid: string;
}

export interface QueryExecutionResponse {
  results: any[];
}

export interface SchemaResponse {
  schema: string;
}

// Sample questions for the playground
export const sampleQuestions = [
  'Relation b/w income and rating in men and women',
  'Avg unit price in sports vs food',
  'What is the market share of products?',
  'Spending across categories and gender',
  'Best performing cities over time?',
];

// Visualization types supported by the system
export type VisualizationType = 
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'scatter_plot'
  | 'horizontal_bar_chart'
  | 'none';