from querybot_agent.workflow_manager import WorkflowManager
from dotenv import load_dotenv

load_dotenv('.env')

# For deployment on LangGraph Cloud
graph = WorkflowManager().compile_graph()

def main():
    """Main entry point for the QueryBot agent."""
    print("QueryBot LangGraph Agent is ready!")
    print("Available options:")
    print("1. Import and use QueryBotAgent class")
    print("2. Use WorkflowManager directly")
    print("3. Deploy to LangGraph Cloud")
    print("\nExample usage:")
    print("from querybot_agent import QueryBotAgent")
    print("agent = QueryBotAgent()")
    print('result = agent.query("What are the top products?", "your-db-uuid")')
    
    #Uncomment to test locally (requires valid DB_ENDPOINT_URL and OPENAI_API_KEY):
    workflow_manager = WorkflowManager()
    result = workflow_manager.run_sql_agent(
        question="Show me the customer types?",
        uuid="921c838c-541d-4361-8c96-70cb23abd9f5"
    )
    print(result)


if __name__ == "__main__":
    main()
