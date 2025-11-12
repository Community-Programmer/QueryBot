from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from querybot_agent.database_manager import DatabaseManager
from querybot_agent.llm_manager import LLMManager

class SQLAgent:
    """Handles all SQL-related operations for the QueryBot agent."""
    
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.llm_manager = LLMManager()

    def parse_question(self, state: dict) -> dict:
        """Parse user question and identify relevant tables and columns."""
        question = state['question']
        schema = self.db_manager.get_schema(state['uuid'])

        prompt = ChatPromptTemplate.from_messages([
            ("system", '''You are a data analyst that can help summarize SQL tables and parse user questions about a database. 
Given the question and database schema, identify the relevant tables and columns. 
If the question is not relevant to the database or if there is not enough information to answer the question, set is_relevant to false.

Your response should be in the following JSON format:
{{
    "is_relevant": boolean,
    "relevant_tables": [
        {{
            "table_name": string,
            "columns": [string],
            "noun_columns": [string]
        }}
    ]
}}

The "noun_columns" field should contain only the columns that are relevant to the question and contain nouns or names, for example, the column "Artist name" contains nouns relevant to the question "What are the top selling artists?", but the column "Artist ID" is not relevant because it does not contain a noun. Do not include columns that contain numbers.
'''),
            ("human", "===Database schema:\n{schema}\n\n===User question:\n{question}\n\nIdentify relevant tables and columns:")
        ])

        output_parser = JsonOutputParser()
        
        response = self.llm_manager.invoke(prompt, schema=schema, question=question)
        parsed_response = output_parser.parse(response)
        return {"parsed_question": parsed_response}

    def get_unique_nouns(self, state: dict) -> dict:
        """Find unique nouns in relevant tables and columns."""
        parsed_question = state['parsed_question']
        
        if not parsed_question['is_relevant']:
            return {"unique_nouns": []}

        unique_nouns = set()
        for table_info in parsed_question['relevant_tables']:
            table_name = table_info['table_name']
            for noun_col in table_info.get('noun_columns', []):
                try:
                    # Get unique values from the noun column
                    query = f"SELECT DISTINCT `{noun_col}` FROM `{table_name}` WHERE `{noun_col}` IS NOT NULL AND `{noun_col}` != '' AND `{noun_col}` != 'N/A' LIMIT 50"
                    results = self.db_manager.execute_query(state['uuid'], query)
                    for result in results:
                        if result[0]:  # If not None/empty
                            unique_nouns.add(str(result[0]))
                except Exception:
                    # Skip if column doesn't exist or other error
                    continue

        return {"unique_nouns": list(unique_nouns)}

    def generate_sql(self, state: dict) -> dict:
        """Generate SQL query based on parsed question and unique nouns."""
        question = state['question']
        parsed_question = state['parsed_question']
        unique_nouns = state['unique_nouns']

        if not parsed_question['is_relevant']:
            return {"sql_query": "NOT_RELEVANT"}
    
        schema = self.db_manager.get_schema(state['uuid'])

        prompt = ChatPromptTemplate.from_messages([
            ("system", '''
You are an AI assistant that generates SQL queries based on user questions, database schema, and unique nouns found in the relevant tables. Generate a valid SQL query to answer the user's question.

IMPORTANT SQL STYLE GUIDELINES (follow these exactly):
- Use backticks (`) around all table and column identifiers when they contain spaces or special characters. Examples: `product name`, `supermarket_sales - Sheet1`.
- Use single quotes (') for all string literals. Examples: 'N/A', '' (empty string), 'Health and beauty'.
- Never use double quotes (") for string literals. In SQLite, double quotes are interpreted as identifiers which will cause errors like "no such column: \"\"".
- Use IS NULL / IS NOT NULL for null checks (e.g., `col` IS NOT NULL).
- Do not quote numeric literals (e.g., use 100, not '100').
- Escape single quotes inside string literals by doubling them (e.g., 'O''Reilly').

If there is not enough information to write a SQL query, respond with exactly: NOT_ENOUGH_INFO

Corrected examples (SQLite-compatible):
1) Top selling product:
   SELECT `product_name`, SUM(quantity) AS total_quantity
   FROM `sales`
   WHERE `product_name` IS NOT NULL
     AND quantity IS NOT NULL
     AND `product_name` != ''
     AND quantity != 'N/A'
   GROUP BY `product_name`
   ORDER BY total_quantity DESC
   LIMIT 1

2) Total revenue for each product:
   SELECT `product name`, SUM(quantity * price) AS total_revenue
   FROM `sales`
   WHERE `product name` IS NOT NULL
     AND quantity IS NOT NULL
     AND price IS NOT NULL
     AND `product name` != ''
     AND quantity != 'N/A'
     AND price != 'N/A'
   GROUP BY `product name`
   ORDER BY total_revenue DESC

3) Distribution (example):
   SELECT income, COUNT(*) AS count
   FROM `users`
   WHERE income IS NOT NULL
     AND income != ''
     AND income != 'N/A'
   GROUP BY income

OUTPUT REQUIREMENTS:
- The response MUST be only the SQL query string (no markdown, no backticks around the whole query, no explanation).
- The result should contain only two or three columns as appropriate: [[x, y]] or [[label, x, y]].
- Skip all rows where any column is NULL or equals 'N/A' or the empty string ''.

Make sure to use the exact nouns provided in the `unique_nouns` list when constructing WHERE clauses or filters, and ensure all identifiers are wrapped with backticks when necessary. Use single quotes for all string literals.
'''),
            ("human", '''===Database schema:
{schema}

===User question:
{question}

===Relevant tables and columns:
{parsed_question}

===Unique nouns in relevant tables:
{unique_nouns}

Generate SQL query string'''),
        ])

        response = self.llm_manager.invoke(prompt, schema=schema, question=question, parsed_question=parsed_question, unique_nouns=unique_nouns)
        
        if response.strip() == "NOT_ENOUGH_INFO":
            return {"sql_query": "NOT_ENOUGH_INFO"}
        else:
            return {"sql_query": response.strip()}

    def validate_and_fix_sql(self, state: dict) -> dict:
        """Validate and fix the generated SQL query."""
        sql_query = state['sql_query']

        if sql_query == "NOT_RELEVANT":
            return {"sql_query": sql_query, "sql_valid": False, "sql_issues": "Question not relevant to database"}
        
        schema = self.db_manager.get_schema(state['uuid'])

        prompt = ChatPromptTemplate.from_messages([
            ("system", '''
You are an AI assistant that validates and fixes SQL queries. Your task is to:
1. Check if the SQL query is valid.
2. Ensure all table and column names are correctly spelled and exist in the schema. All the table and column names should be enclosed in backticks.
3. If there are any issues, fix them and provide the corrected SQL query.
4. If no issues are found, return the original query.

Respond in JSON format with the following structure. Only respond with the JSON:
{{
    "valid": boolean,
    "issues": string or null,
    "corrected_query": string
}}
'''),
            ("human", '''===Database schema:
{schema}

===Generated SQL query:
{sql_query}

Respond in JSON format with the following structure. Only respond with the JSON:
{{
    "valid": boolean,
    "issues": string or null,
    "corrected_query": string
}}

For example:
1. {{
    "valid": true,
    "issues": null,
    "corrected_query": "None"
}}
             
2. {{
    "valid": false,
    "issues": "Column USERS does not exist",
    "corrected_query": "SELECT * FROM `users` WHERE age > 25"
}}

3. {{
    "valid": false,
    "issues": "Column names and table names should be enclosed in backticks if they contain spaces or special characters",
    "corrected_query": "SELECT * FROM `gross income` WHERE `age` > 25"
}}
             
'''),
        ])

        output_parser = JsonOutputParser()
        response = self.llm_manager.invoke(prompt, schema=schema, sql_query=sql_query)
        result = output_parser.parse(response)

        if result["valid"] and result["issues"] is None:
            return {"sql_query": sql_query, "sql_valid": True, "sql_issues": None}
        else:
            return {"sql_query": result["corrected_query"], "sql_valid": False, "sql_issues": result["issues"]}

    def execute_sql(self, state: dict) -> dict:
        """Execute SQL query and return results."""
        query = state['sql_query']
        
        if query in ["NOT_RELEVANT", "NOT_ENOUGH_INFO"]:
            return {"results": [], "error": f"Cannot execute query: {query}"}
        
        try:
            results = self.db_manager.execute_query(state['uuid'], query)
            return {"results": results, "error": None}
        except Exception as e:
            return {"results": [], "error": str(e)}

    def format_results(self, state: dict) -> dict:
        """Format the results into a human-readable answer."""
        results = state.get('results', [])
        question = state['question']
        
        if not results:
            return {"answer": "I couldn't find any relevant data to answer your question."}
        
        # Create a simple formatted answer
        if len(results) == 1:
            answer = f"Based on your question '{question}', here's what I found: {results[0]}"
        else:
            answer = f"Based on your question '{question}', I found {len(results)} results. Here are the first few: {results[:5]}"
        
        return {"answer": answer}

    def choose_visualization(self, state: dict) -> dict:
        """
        Choose the best visualization type based on intelligent data analysis.
        Analyzes data structure, patterns, and question context to recommend optimal charts.
        """
        results = state.get('results', [])
        question = state['question']
        
        if not results:
            return {"visualization": "none", "visualization_reason": "No data to visualize"}
        
        # Analyze data structure and patterns
        data_analysis = self._analyze_data_for_visualization(results, question)
        
        # Enhanced prompt with data analysis insights
        prompt = ChatPromptTemplate.from_messages([
            ("system", '''You are a data visualization expert specializing in matplotlib, seaborn, and pandas visualizations. 
Based on the question, SQL results, and data analysis, choose the most appropriate visualization type.

Available visualization types and their optimal use cases:

📊 CATEGORICAL DATA:
- "bar": Vertical bars for comparing categories (good for <10 categories)
- "horizontal_bar": Horizontal bars for long category names or many categories
- "pie": For showing parts of a whole (best with 2-7 categories, avoid if many small slices)

📈 CONTINUOUS/TIME DATA:
- "line": Time series, trends, continuous progression
- "area": Similar to line but emphasizes magnitude over time

🔍 RELATIONSHIP DATA:
- "scatter": Two continuous variables, correlation analysis
- "bubble": Three variables (x, y, size)

📋 DISTRIBUTION DATA:
- "histogram": Distribution of single continuous variable
- "box": Distribution comparison across categories
- "violin": Distribution shape comparison

🔥 SPECIALIZED:
- "heatmap": Correlation matrices, pivot table data
- "pair_plot": Multiple variable relationships
- "count_plot": Frequency of categorical values

DECISION CRITERIA:
1. Data structure (categorical vs continuous)
2. Number of variables (1, 2, 3+)
3. Data size (few vs many points)
4. Question intent (comparison, trend, distribution, relationship)
5. Readability and clarity

Respond in JSON format:
{{
    "visualization": "chart_type",
    "reason": "detailed explanation of why this chart type is optimal",
    "seaborn_function": "sns.function_name (e.g., sns.barplot, sns.lineplot)",
    "matplotlib_needed": "additional matplotlib styling needed"
}}'''),
            ("human", '''Question: {question}

SQL Results (first 10 rows): {results}

Data Analysis:
- Data shape: {data_shape}
- Column types: {column_types}
- Numeric columns: {numeric_columns}
- Categorical columns: {categorical_columns}
- Temporal indicators: {temporal_indicators}
- Value ranges: {value_ranges}
- Question keywords: {question_keywords}
- Recommended focus: {focus_recommendation}

Choose the optimal visualization type for this data:'''),
        ])
        
        try:
            output_parser = JsonOutputParser()
            response = self.llm_manager.invoke(
                prompt, 
                question=question, 
                results=str(results[:10]),
                **data_analysis
            )
            result = output_parser.parse(response)
            
            return {
                "visualization": result.get("visualization", "none"),
                "visualization_reason": result.get("reason", "Chart type selected based on data analysis"),
                "seaborn_function": result.get("seaborn_function", "sns.barplot"),
                "matplotlib_styling": result.get("matplotlib_needed", "Standard styling")
            }
            
        except Exception as e:
            # Fallback to simple rule-based selection
            fallback_viz = self._fallback_visualization_selection(results, question)
            return fallback_viz
    
    def _analyze_data_for_visualization(self, results: list, question: str) -> dict:
        """
        Analyze data structure and patterns to inform visualization choice.
        
        Args:
            results: SQL query results
            question: User question
            
        Returns:
            Dict with data analysis insights
        """
        if not results:
            return {"data_shape": "empty", "column_types": [], "numeric_columns": 0, 
                   "categorical_columns": 0, "temporal_indicators": [], "value_ranges": {},
                   "question_keywords": [], "focus_recommendation": "none"}
        
        try:
            # Basic data shape analysis
            num_rows = len(results)
            num_cols = len(results[0]) if results else 0
            
            # Analyze column types and patterns
            column_analysis = self._analyze_columns(results)
            
            # Analyze question for visualization hints
            question_analysis = self._analyze_question_intent(question)
            
            return {
                "data_shape": f"{num_rows} rows × {num_cols} columns",
                "column_types": column_analysis["types"],
                "numeric_columns": column_analysis["numeric_count"],
                "categorical_columns": column_analysis["categorical_count"],
                "temporal_indicators": column_analysis["temporal_hints"],
                "value_ranges": column_analysis["ranges"],
                "question_keywords": question_analysis["keywords"],
                "focus_recommendation": question_analysis["focus"]
            }
            
        except Exception:
            return {"data_shape": "analysis_failed", "column_types": [], "numeric_columns": 0,
                   "categorical_columns": 0, "temporal_indicators": [], "value_ranges": {},
                   "question_keywords": [], "focus_recommendation": "basic"}
    
    def _analyze_columns(self, results: list) -> dict:
        """Analyze column characteristics for visualization selection."""
        if not results:
            return {"types": [], "numeric_count": 0, "categorical_count": 0, 
                   "temporal_hints": [], "ranges": {}}
        
        try:
            column_info = {"types": [], "numeric_count": 0, "categorical_count": 0,
                          "temporal_hints": [], "ranges": {}}
            
            # Analyze each column
            for col_idx in range(len(results[0])):
                values = [row[col_idx] for row in results[:20] if row[col_idx] is not None]  # Sample first 20
                
                if not values:
                    continue
                
                # Try to determine if numeric
                try:
                    numeric_values = [float(v) for v in values if str(v).replace('.', '').replace('-', '').isdigit()]
                    if len(numeric_values) / len(values) > 0.7:  # 70% numeric
                        column_info["types"].append("numeric")
                        column_info["numeric_count"] += 1
                        if numeric_values:
                            column_info["ranges"][f"col_{col_idx}"] = f"{min(numeric_values):.2f} - {max(numeric_values):.2f}"
                    else:
                        column_info["types"].append("categorical")
                        column_info["categorical_count"] += 1
                        unique_count = len(set(str(v) for v in values))
                        column_info["ranges"][f"col_{col_idx}"] = f"{unique_count} unique values"
                except:
                    column_info["types"].append("categorical")
                    column_info["categorical_count"] += 1
                
                # Check for temporal hints
                sample_str = str(values[0]).lower()
                if any(hint in sample_str for hint in ['date', 'time', 'month', 'year', '2024', '2023']):
                    column_info["temporal_hints"].append(f"col_{col_idx}")
            
            return column_info
            
        except Exception:
            return {"types": ["unknown"], "numeric_count": 0, "categorical_count": 0,
                   "temporal_hints": [], "ranges": {}}
    
    def _analyze_question_intent(self, question: str) -> dict:
        """Analyze question to understand visualization intent."""
        question_lower = question.lower()
        
        # Chart type keywords
        chart_keywords = []
        focus = "comparison"
        
        if any(word in question_lower for word in ['trend', 'over time', 'timeline', 'progression']):
            chart_keywords.append("temporal")
            focus = "trend_analysis"
        elif any(word in question_lower for word in ['correlation', 'relationship', 'vs', 'compared to']):
            chart_keywords.append("relationship")
            focus = "correlation_analysis"
        elif any(word in question_lower for word in ['distribution', 'spread', 'frequency']):
            chart_keywords.append("distribution")
            focus = "distribution_analysis"
        elif any(word in question_lower for word in ['top', 'bottom', 'highest', 'lowest', 'ranking']):
            chart_keywords.append("ranking")
            focus = "ranking_comparison"
        elif any(word in question_lower for word in ['total', 'sum', 'percentage', 'proportion']):
            chart_keywords.append("aggregation")
            focus = "part_to_whole"
        
        return {"keywords": chart_keywords, "focus": focus}
    
    def _fallback_visualization_selection(self, results: list, question: str) -> dict:
        """Fallback rule-based visualization selection when AI analysis fails."""
        if not results:
            return {"visualization": "none", "visualization_reason": "No data available"}
        
        num_cols = len(results[0])
        num_rows = len(results)
        
        # Simple rule-based logic
        if num_cols == 2:
            # Two columns - likely x,y data
            if num_rows <= 10:
                return {
                    "visualization": "bar",
                    "visualization_reason": "Two-column data with few rows - bar chart for comparison",
                    "seaborn_function": "sns.barplot",
                    "matplotlib_styling": "Standard bar styling"
                }
            else:
                return {
                    "visualization": "line", 
                    "visualization_reason": "Two-column data with many rows - line chart for trend",
                    "seaborn_function": "sns.lineplot",
                    "matplotlib_styling": "Standard line styling"
                }
        else:
            return {
                "visualization": "bar",
                "visualization_reason": "Default bar chart for multi-column categorical data",
                "seaborn_function": "sns.barplot", 
                "matplotlib_styling": "Standard styling"
            }