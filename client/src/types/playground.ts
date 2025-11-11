// Graph state types for the playground streaming functionality

export interface GraphState {
  question: string;
  uuid: string;
  parsed_question?: { [key: string]: any };
  unique_nouns?: string[];
  sql_query?: string;
  sql_valid?: boolean;
  sql_issues?: string;
  results?: any[];
  answer?: string;
  error?: string;
  visualization?: string;
  visualization_reason?: string;
  formatted_data_for_visualization?: { [key: string]: any };
  
  // Stream-specific properties
  run_id?: string;
  attempt?: number;
  parse_question?: any;
  get_unique_nouns?: any;
  generate_sql?: any;
  validate_and_fix_sql?: any;
  execute_sql?: any;
  format_results?: any;
  choose_visualization?: any;
  format_data_for_visualization?: any;
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