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
        """Choose the best visualization type for the data."""
        results = state.get('results', [])
        question = state['question']
        
        if not results:
            return {"visualization": "none", "visualization_reason": "No data to visualize"}
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", '''You are a data visualization expert. Based on the question and the SQL results, choose the most appropriate visualization type from: bar, horizontal_bar, line, pie, scatter, none.

Consider the following:
- bar/horizontal_bar: For categorical data comparisons
- line: For trends over time or continuous data
- pie: For showing parts of a whole (percentages/proportions)
- scatter: For showing relationships between two continuous variables
- none: If the data is not suitable for visualization

Respond in JSON format:
{{
    "visualization": "type",
    "reason": "explanation"
}}'''),
            ("human", '''Question: {question}
Results (first 5 rows): {results}

Choose the best visualization type.'''),
        ])
        
        output_parser = JsonOutputParser()
        response = self.llm_manager.invoke(prompt, question=question, results=str(results[:5]))
        result = output_parser.parse(response)
        
        return {
            "visualization": result.get("visualization", "none"),
            "visualization_reason": result.get("reason", "No specific reason provided")
        }