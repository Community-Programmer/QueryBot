"""
QueryBot Agent - A LangGraph-based SQL query and data visualization agent.

This agent can:
1. Parse natural language questions about databases
2. Generate and execute SQL queries
3. Format results into human-readable answers
4. Recommend appropriate visualizations
5. Format data for visualization libraries
"""

from querybot_agent.workflow_manager import WorkflowManager
from typing import Dict, Any, Optional


class QueryBotAgent:
    """Main interface for the QueryBot agent."""
    
    def __init__(self):
        """Initialize the QueryBot agent with a workflow manager."""
        self.workflow_manager = WorkflowManager()
    
    def query(self, question: str, database_uuid: str) -> Dict[str, Any]:
        """
        Process a natural language question about a database.
        
        Args:
            question (str): The natural language question to answer
            database_uuid (str): UUID of the database to query
            
        Returns:
            Dict containing:
            - answer: Human-readable answer to the question
            - visualization: Recommended visualization type
            - visualization_reason: Explanation for the visualization choice
            - formatted_data_for_visualization: Data formatted for visualization
        """
        try:
            result = self.workflow_manager.run_sql_agent(question, database_uuid)
            return result
        except Exception as e:
            return {
                "answer": f"I encountered an error while processing your question: {str(e)}",
                "visualization": "none",
                "visualization_reason": "Error occurred during processing",
                "formatted_data_for_visualization": None
            }
    
    def get_workflow_graph(self):
        """Get the compiled workflow graph for deployment or inspection."""
        return self.workflow_manager.compile_graph()


# Convenience function for direct usage
def ask_question(question: str, database_uuid: str) -> Dict[str, Any]:
    """
    Convenience function to ask a question directly.
    
    Args:
        question (str): The natural language question
        database_uuid (str): UUID of the database
        
    Returns:
        Dict with answer and visualization information
    """
    agent = QueryBotAgent()
    return agent.query(question, database_uuid)