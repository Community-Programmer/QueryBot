from querybot_agent.workflow_manager import WorkflowManager
from querybot_agent.agent import QueryBotAgent
from dotenv import load_dotenv

load_dotenv('.env')

# For deployment on LangGraph Cloud
graph = WorkflowManager().compile_graph()

def main():
    """Main entry point for the Enhanced QueryBot agent."""
    print("🚀 Enhanced QueryBot LangGraph Agent is ready!")
    print("=" * 50)
    print("✨ Features:")
    print("  • Smart question classification and routing")
    print("  • Automatic insights and narrative generation")
    print("  • Professional chart creation with seaborn/matplotlib")
    print("  • Intelligent table formatting")
    print("  • Polite handling of irrelevant questions")
    print("  • Complex conditional workflow with LangGraph")
    print("\n📋 Usage options:")
    print("1. Import and use QueryBotAgent class (Recommended)")
    print("2. Use WorkflowManager directly (Advanced)")
    print("3. Deploy to LangGraph Cloud")
    
    print("\n💡 Example usage:")
    print("```python")
    print("from querybot_agent.agent import QueryBotAgent")
    print("agent = QueryBotAgent()")
    print('result = agent.query("Show me sales trends", "your-db-uuid")')
    print("```")
    
    print("\n📤 Enhanced Response includes:")
    print("  • answer: Comprehensive response with insights")
    print("  • insights: Key data insights with emojis")
    print("  • data_narrative: Story-like explanations")
    print("  • formatted_table: Clean table presentation")
    print("  • chart_image_path: Professional chart location")


if __name__ == "__main__":
    main()
