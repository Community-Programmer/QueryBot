# QueryBot LangGraph Agent

A sophisticated SQL query and data visualization agent built with LangGraph and LangChain. This agent can understand natural language questions about databases, generate and execute SQL queries, and recommend appropriate visualizations with formatted data.

## Features

- **Natural Language Processing**: Understands and parses user questions about databases
- **Smart SQL Generation**: Generates optimized SQL queries based on database schema and user questions
- **Query Validation**: Validates and fixes SQL queries automatically
- **Data Visualization**: Recommends appropriate visualization types (bar, line, pie, scatter plots)
- **Data Formatting**: Formats query results for various visualization libraries
- **Error Handling**: Robust error handling and user-friendly error messages

## Architecture

The agent is built using LangGraph for workflow orchestration and consists of several key components:

### Core Components

- **WorkflowManager**: Orchestrates the entire workflow using LangGraph StateGraph
- **SQLAgent**: Handles all SQL-related operations (parsing, generation, validation, execution)
- **DataFormatter**: Formats data for different visualization types
- **DatabaseManager**: Manages database connections and query execution
- **LLMManager**: Handles interactions with OpenAI's GPT models

### Workflow

1. **Parse Question**: Analyzes the user question and identifies relevant database tables/columns
2. **Get Unique Nouns**: Extracts unique values from relevant columns to improve SQL accuracy
3. **Generate SQL**: Creates SQL queries based on the parsed question and schema
4. **Validate & Fix SQL**: Validates and corrects any issues in the generated SQL
5. **Execute SQL**: Runs the query against the database
6. **Format Results**: Converts raw results into human-readable answers
7. **Choose Visualization**: Recommends the best visualization type for the data
8. **Format Data**: Formats the data for the chosen visualization

## Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   pip install -e .
   ```

3. Copy the environment file and configure it:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your configuration:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   DB_ENDPOINT_URL=your_database_endpoint_url_here
   ```

## Usage

### Basic Usage

```python
from querybot_agent.agent import QueryBotAgent

# Initialize the agent
agent = QueryBotAgent()

# Ask a question
result = agent.query(
    question="What are the top 5 selling products?",
    database_uuid="your-database-uuid"
)

print(result)
# Output:
# {
#     "answer": "Based on your question...",
#     "visualization": "bar",
#     "visualization_reason": "Bar chart is ideal for comparing quantities...",
#     "formatted_data_for_visualization": {...}
# }
```

### Using the Convenience Function

```python
from querybot_agent.agent import ask_question

result = ask_question(
    "Show me sales trends over the last 6 months",
    "your-database-uuid"
)
```

### LangGraph Cloud Deployment

The `main.py` file exposes a `graph` object that can be deployed directly to LangGraph Cloud:

```python
from main import graph

# The graph is ready for LangGraph Cloud deployment
```

## Supported Visualizations

The agent can recommend and format data for the following visualization types:

- **Bar Charts**: For categorical comparisons
- **Horizontal Bar Charts**: For categorical comparisons with long labels
- **Line Charts**: For trends over time or continuous data
- **Pie Charts**: For showing parts of a whole
- **Scatter Plots**: For showing relationships between variables

## Data Format Examples

### Bar Chart
```json
{
  "labels": ["Product A", "Product B", "Product C"],
  "values": [{"data": [100, 150, 200], "label": "Sales"}]
}
```

### Line Chart
```json
{
  "xValues": ["Jan", "Feb", "Mar"],
  "yValues": [{"data": [100, 120, 140], "label": "Revenue"}]
}
```

### Scatter Plot
```json
{
  "series": [{
    "data": [{"x": 10, "y": 20, "id": 1}, {"x": 15, "y": 25, "id": 2}],
    "label": "Data Points"
  }]
}
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for GPT model access
- `DB_ENDPOINT_URL`: The base URL for your database API endpoint

### Database API Requirements

The agent expects a database API with the following endpoints:

- `GET /get-schema/{uuid}`: Returns database schema
- `POST /execute-query`: Executes SQL queries

Expected request/response format:
```json
// POST /execute-query
{
  "uuid": "database-uuid",
  "query": "SELECT * FROM products"
}

// Response
{
  "results": [["Product A", 100], ["Product B", 150]]
}
```

## Development

### Project Structure

```
querybot_agent/
├── __init__.py
├── agent.py              # Main agent interface
├── workflow_manager.py   # LangGraph workflow orchestration
├── sql_agent.py         # SQL operations
├── data_formatter.py    # Data formatting for visualizations
├── llm_manager.py       # LLM interactions
├── database_manager.py  # Database operations
├── graph_instructions.py # Visualization format templates
└── utils/
    ├── __init__.py
    ├── state.py         # State definitions
    └── nodes.py         # Additional node functions (if needed)
```

### Adding New Visualization Types

1. Add the new visualization instructions to `graph_instructions.py`
2. Update the `_format_other_visualizations` method in `data_formatter.py`
3. Update the visualization selection logic in `sql_agent.py`

## Error Handling

The agent includes comprehensive error handling:

- Database connection errors
- SQL syntax errors
- API timeout errors
- Invalid question formats
- Missing environment variables

All errors are gracefully handled and return user-friendly error messages.

## License

This project is part of the QueryBot system for natural language database querying and visualization.