from langgraph.graph import StateGraph, END
from querybot_agent.utils.state import InputState, OutputState, OverallState
from querybot_agent.sql_agent import SQLAgent
from querybot_agent.data_formatter import DataFormatter

class WorkflowManager:
    """Manages the entire QueryBot workflow using LangGraph."""
    
    def __init__(self):
        self.sql_agent = SQLAgent()
        self.data_formatter = DataFormatter()

    def create_workflow(self) -> StateGraph:
        """Create and configure the workflow graph."""
        # Use the proper LangGraph pattern with input/output schemas
        workflow = StateGraph(
            state_schema=OverallState, 
            input_schema=InputState, 
            output_schema=OutputState
        )

        # Add nodes to the graph
        workflow.add_node("parse_question", self.sql_agent.parse_question)
        workflow.add_node("get_unique_nouns", self.sql_agent.get_unique_nouns)
        workflow.add_node("generate_sql", self.sql_agent.generate_sql)
        workflow.add_node("validate_and_fix_sql", self.sql_agent.validate_and_fix_sql)
        workflow.add_node("execute_sql", self.sql_agent.execute_sql)
        workflow.add_node("format_results", self.sql_agent.format_results)
        workflow.add_node("choose_visualization", self.sql_agent.choose_visualization)
        workflow.add_node("format_data_for_visualization", self.data_formatter.format_data_for_visualization)
        
        # Define edges - sequential flow
        workflow.add_edge("parse_question", "get_unique_nouns")
        workflow.add_edge("get_unique_nouns", "generate_sql")
        workflow.add_edge("generate_sql", "validate_and_fix_sql")
        workflow.add_edge("validate_and_fix_sql", "execute_sql")
        workflow.add_edge("execute_sql", "format_results")
        workflow.add_edge("format_results", "choose_visualization")
        workflow.add_edge("choose_visualization", "format_data_for_visualization")
        workflow.add_edge("format_data_for_visualization", END)
        
        # Set the entry point
        workflow.set_entry_point("parse_question")

        return workflow
    
    def compile_graph(self):
        """Compile and return the workflow graph."""
        return self.create_workflow().compile()

    def run_sql_agent(self, question: str, uuid: str) -> dict:
        """Run the SQL agent workflow and return the formatted answer and visualization recommendation."""
        app = self.compile_graph()
        result = app.invoke({"question": question, "uuid": uuid})
        return {
            "answer": result.get('answer', 'No answer generated'),
            "visualization": result.get('visualization', 'none'),
            "visualization_reason": result.get('visualization_reason', 'No reason provided'),
            "formatted_data_for_visualization": result.get('formatted_data_for_visualization')
        }