"""
Insights Generator Module - Analyzes data and generates insights, narratives, and formatted tables.

This module contains functionality for:
1. Analyzing SQL query results to generate data insights
2. Creating narrative explanations of data patterns
3. Formatting data into readable tables
4. Detecting anomalies and trends
"""

from typing import Dict, Any, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from querybot_agent.llm_manager import LLMManager
import pandas as pd
import statistics

class InsightsGenerator:
    """Generates insights, narratives, and formatted tables from SQL query results."""
    
    def __init__(self):
        self.llm_manager = LLMManager()
    
    def generate_insights_and_narrative(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate data insights and narrative explanation from SQL results.
        
        Args:
            state: The current graph state containing results and question
            
        Returns:
            Dict containing insights, narrative, and any errors
        """
        try:
            results = state.get('results', [])
            question = state['question']
            sql_query = state.get('sql_query', '')
            
            if not results:
                return {
                    "insights": "📊 No data available for analysis.",
                    "data_narrative": "No data was found to generate insights for your question.",
                    "insights_error": None
                }
            
            # Perform statistical analysis
            stats_analysis = self._perform_statistical_analysis(results)
            
            # Generate insights using LLM
            insights_prompt = ChatPromptTemplate.from_messages([
                ("system", """You are a data analyst expert. Analyze the SQL query results and generate actionable insights.

Your task is to:
1. Identify key patterns, trends, and anomalies in the data
2. Provide statistical insights (percentages, comparisons, rankings)
3. Highlight the most important findings
4. Format insights in a clear, bulleted list with emoji indicators

Format your response as:
📊 Key Insights:
• [Insight 1 with specific numbers/percentages]
• [Insight 2 with trend analysis] 
• [Insight 3 with anomaly detection]
• [Additional insights as relevant]

Keep insights concise, actionable, and data-driven. Always include specific numbers when possible."""),
                
                ("human", """Question: {question}
SQL Query: {sql_query}
Results: {results}
Statistical Analysis: {stats}

Generate key insights from this data:""")
            ])
            
            narrative_prompt = ChatPromptTemplate.from_messages([
                ("system", """You are a data storytelling expert. Create a narrative explanation of the data that tells a story.

Your task is to:
1. Explain what the data shows in plain language
2. Provide context and implications 
3. Suggest potential reasons for patterns
4. Make it engaging and easy to understand

Write in a conversational tone as if explaining to a business stakeholder. Keep it concise but informative (2-3 sentences)."""),
                
                ("human", """Question: {question}
Results: {results}
Statistical Analysis: {stats}

Create a narrative explanation:""")
            ])
            
            # Generate insights
            insights_response = self.llm_manager.invoke(
                insights_prompt,
                question=question,
                sql_query=sql_query,
                results=str(results[:10]),  # First 10 results for analysis
                stats=stats_analysis
            )
            
            # Generate narrative
            narrative_response = self.llm_manager.invoke(
                narrative_prompt,
                question=question,
                results=str(results[:10]),
                stats=stats_analysis
            )
            
            return {
                "insights": insights_response.strip(),
                "data_narrative": narrative_response.strip(),
                "insights_error": None
            }
            
        except Exception as e:
            return {
                "insights": "📊 Error generating insights.",
                "data_narrative": "Unable to generate narrative due to processing error.",
                "insights_error": str(e)
            }
    
    def format_data_table(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format SQL results into a readable table.
        
        Args:
            state: The current graph state containing results
            
        Returns:
            Dict containing formatted table and any errors
        """
        try:
            results = state.get('results', [])
            
            if not results:
                return {
                    "formatted_table": "No data available to display.",
                }
            
            # Convert results to DataFrame for better formatting
            if isinstance(results[0], (list, tuple)):
                # If results are tuples/lists, create generic column names
                num_cols = len(results[0])
                columns = [f"Column_{i+1}" for i in range(num_cols)]
                df = pd.DataFrame(results, columns=columns)
            else:
                # If results are dicts or other format
                df = pd.DataFrame(results)
            
            # Limit to first 50 rows for display
            df_display = df.head(50)
            
            # Format as a nice table
            table_str = self._format_table_string(df_display)
            
            return {
                "formatted_table": table_str
            }
            
        except Exception as e:
            return {
                "formatted_table": f"Error formatting table: {str(e)}"
            }
    
    def _perform_statistical_analysis(self, results: List[Any]) -> str:
        """
        Perform basic statistical analysis on the results.
        
        Args:
            results: List of query results
            
        Returns:
            String containing statistical summary
        """
        try:
            if not results:
                return "No data for statistical analysis."
            
            analysis_parts = []
            
            # Basic info
            analysis_parts.append(f"Total records: {len(results)}")
            
            # If results are tuples/lists with numeric data
            if isinstance(results[0], (list, tuple)) and len(results[0]) >= 2:
                # Try to analyze second column if it's numeric
                try:
                    values = [float(row[1]) for row in results if row[1] is not None]
                    if values:
                        analysis_parts.append(f"Numeric values range: {min(values):.2f} - {max(values):.2f}")
                        analysis_parts.append(f"Average: {statistics.mean(values):.2f}")
                        if len(values) > 1:
                            analysis_parts.append(f"Standard deviation: {statistics.stdev(values):.2f}")
                except (ValueError, TypeError):
                    pass
            
            # Check for patterns in first column (categories)
            if len(results) > 0:
                first_col_values = [row[0] for row in results if row[0] is not None]
                unique_count = len(set(first_col_values))
                analysis_parts.append(f"Unique categories: {unique_count}")
            
            return " | ".join(analysis_parts)
            
        except Exception:
            return "Statistical analysis unavailable."
    
    def _format_table_string(self, df: pd.DataFrame) -> str:
        """
        Format DataFrame as a readable table string.
        
        Args:
            df: Pandas DataFrame
            
        Returns:
            Formatted table string
        """
        try:
            # Create a simple table format
            table_lines = []
            
            # Header
            headers = list(df.columns)
            header_line = " | ".join(f"{header:<15}" for header in headers)
            table_lines.append(header_line)
            table_lines.append("-" * len(header_line))
            
            # Rows
            for _, row in df.iterrows():
                row_line = " | ".join(f"{str(val):<15}" for val in row.values)
                table_lines.append(row_line)
            
            # Add summary line
            table_lines.append("-" * len(header_line))
            table_lines.append(f"Showing {len(df)} rows")
            
            return "\n".join(table_lines)
            
        except Exception:
            return str(df.to_string(index=False, max_rows=50))


def generate_insights_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for generating insights and narrative.
    This is the function that will be added to the LangGraph workflow.
    """
    generator = InsightsGenerator()
    return generator.generate_insights_and_narrative(state)


def format_table_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for formatting data tables.
    This is the function that will be added to the LangGraph workflow.
    """
    generator = InsightsGenerator()
    return generator.format_data_table(state)