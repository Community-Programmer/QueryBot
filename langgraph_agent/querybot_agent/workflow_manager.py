from langgraph.graph import StateGraph, END, START
from querybot_agent.utils.state import InputState, OutputState, OverallState
from querybot_agent.sql_agent import SQLAgent
from querybot_agent.chart_generator import chart_generation_node
from querybot_agent.insights_generator import generate_insights_node, format_table_node
from querybot_agent.question_classifier import (
    classify_question_node, 
    should_generate_chart, 
    should_generate_table,
    should_generate_insights,
    is_question_relevant
)
from querybot_agent.response_finalizer import (
    finalize_response_node,
    handle_irrelevant_node, 
    skip_chart_node,
    skip_table_node
)

class WorkflowManager:
    """Manages the entire QueryBot workflow using LangGraph with complex conditional routing."""
    
    def __init__(self):
        self.sql_agent = SQLAgent()

    def create_workflow(self) -> StateGraph:
        """Create and configure the complex workflow graph with conditional routing."""
        # Use the proper LangGraph pattern with input/output schemas
        workflow = StateGraph(
            state_schema=OverallState, 
            input_schema=InputState, 
            output_schema=OutputState
        )

        # Add nodes to the graph
        workflow.add_node("classify_question", classify_question_node)
        workflow.add_node("handle_irrelevant", handle_irrelevant_node)
        workflow.add_node("parse_question", self.sql_agent.parse_question)
        workflow.add_node("get_unique_nouns", self.sql_agent.get_unique_nouns)
        workflow.add_node("generate_sql", self.sql_agent.generate_sql)
        workflow.add_node("validate_and_fix_sql", self.sql_agent.validate_and_fix_sql)
        workflow.add_node("execute_sql", self.sql_agent.execute_sql)
        workflow.add_node("format_results", self.sql_agent.format_results)
        workflow.add_node("choose_visualization", self.sql_agent.choose_visualization)
        workflow.add_node("generate_chart", chart_generation_node)
        workflow.add_node("skip_chart", skip_chart_node)
        workflow.add_node("format_table", format_table_node)
        workflow.add_node("skip_table", skip_table_node)
        workflow.add_node("generate_insights", generate_insights_node)
        workflow.add_node("finalize_response", finalize_response_node)
        
        # Define the workflow edges with conditional routing
        # Start with question classification
        workflow.add_edge(START, "classify_question")
        
        # Route based on question relevance
        workflow.add_conditional_edges(
            "classify_question",
            is_question_relevant,
            {
                "process_question": "parse_question",
                "handle_irrelevant": "handle_irrelevant"
            }
        )
        
        # Irrelevant questions go directly to end
        workflow.add_edge("handle_irrelevant", END)
        
        # Standard SQL processing flow for relevant questions
        workflow.add_edge("parse_question", "get_unique_nouns")
        workflow.add_edge("get_unique_nouns", "generate_sql")
        workflow.add_edge("generate_sql", "validate_and_fix_sql")
        workflow.add_edge("validate_and_fix_sql", "execute_sql")
        workflow.add_edge("execute_sql", "format_results")
        workflow.add_edge("format_results", "choose_visualization")
        
        # Conditional routing for chart generation
        workflow.add_conditional_edges(
            "choose_visualization",
            should_generate_chart,
            {
                "generate_chart": "generate_chart",
                "skip_chart": "skip_chart"
            }
        )
        
        # Both chart paths lead to table decision
        workflow.add_conditional_edges(
            "generate_chart",
            should_generate_table,
            {
                "format_table": "format_table",
                "skip_table": "skip_table"
            }
        )
        
        workflow.add_conditional_edges(
            "skip_chart",
            should_generate_table,
            {
                "format_table": "format_table", 
                "skip_table": "skip_table"
            }
        )
        
        # Both table paths lead to insights generation
        workflow.add_conditional_edges(
            "format_table",
            should_generate_insights,
            {
                "generate_insights": "generate_insights",
                "finalize": "finalize_response"
            }
        )
        
        workflow.add_conditional_edges(
            "skip_table", 
            should_generate_insights,
            {
                "generate_insights": "generate_insights",
                "finalize": "finalize_response"
            }
        )
        
        # Insights lead to finalization
        workflow.add_edge("generate_insights", "finalize_response")
        
        # Finalize response leads to end
        workflow.add_edge("finalize_response", END)

        return workflow
    
    def compile_graph(self):
        """Compile and return the workflow graph."""
        return self.create_workflow().compile()

    def run_sql_agent(self, question: str, uuid: str) -> dict:
        """Run the enhanced SQL agent workflow and return comprehensive results."""
        app = self.compile_graph()
        result = app.invoke({"question": question, "uuid": uuid})
        return {
            "answer": result.get('answer', 'No answer generated'),
            "visualization": result.get('visualization', 'none'),
            "visualization_reason": result.get('visualization_reason', 'No reason provided'),
            "chart_image_path": result.get('chart_image_path'),
            "chart_generation_error": result.get('chart_generation_error'),
            "insights": result.get('insights'),
            "formatted_table": result.get('formatted_table'),
            "data_narrative": result.get('data_narrative'),
            "insights_error": result.get('insights_error')
        }