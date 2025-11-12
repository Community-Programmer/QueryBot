"""
Response Finalizer Module - Combines all outputs into final response.

This module handles:
1. Combining insights, charts, tables, and answers
2. Handling irrelevant questions
3. Creating comprehensive final responses
4. Error handling and fallbacks
"""

from typing import Dict, Any

class ResponseFinalizer:
    """Combines all workflow outputs into final user response."""
    
    def __init__(self):
        pass
    
    def finalize_response(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine all workflow outputs into final response.
        
        Args:
            state: The current graph state with all processing results
            
        Returns:
            Dict containing finalized response components
        """
        # Get all components
        answer = state.get('answer', '')
        insights = state.get('insights', '')
        data_narrative = state.get('data_narrative', '')
        formatted_table = state.get('formatted_table', '')
        chart_image_path = state.get('chart_image_path')
        visualization = state.get('visualization', 'none')
        visualization_reason = state.get('visualization_reason', '')
        
        # Check for errors
        error = state.get('error')
        insights_error = state.get('insights_error')
        chart_generation_error = state.get('chart_generation_error')
        
        # Build comprehensive answer
        final_answer_parts = []
        
        # Add main answer
        if answer:
            final_answer_parts.append(answer)
        
        # Add data narrative if available
        if data_narrative:
            final_answer_parts.append(f"\n📖 Analysis: {data_narrative}")
        
        # Add insights if available
        if insights and not insights_error:
            final_answer_parts.append(f"\n{insights}")
        
        # Add table information if available
        if formatted_table and formatted_table != "No data available to display.":
            final_answer_parts.append(f"\n📋 Data Table:\n{formatted_table}")
        
        # Add chart information
        if chart_image_path:
            final_answer_parts.append(f"\n📊 Chart generated successfully: {chart_image_path}")
        elif visualization != 'none' and chart_generation_error:
            final_answer_parts.append(f"\n⚠️ Chart generation failed: {chart_generation_error}")
        
        # Combine all parts
        final_answer = "\n".join(final_answer_parts) if final_answer_parts else "Unable to process your request."
        
        return {
            "answer": final_answer.strip(),
            "visualization": visualization,
            "visualization_reason": visualization_reason,
            "chart_image_path": chart_image_path,
            "chart_generation_error": chart_generation_error,
            "insights": insights,
            "formatted_table": formatted_table,
            "data_narrative": data_narrative,
            "insights_error": insights_error
        }
    
    def handle_irrelevant_question(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle questions that are not relevant to the database.
        
        Args:
            state: The current graph state
            
        Returns:
            Dict containing appropriate response for irrelevant questions
        """
        question = state.get('question', '')
        
        # Provide helpful response for irrelevant questions
        irrelevant_response = (
            f"I'm a database query assistant designed to help you analyze and visualize data. "
            f"Your question '{question}' doesn't appear to be related to database queries or data analysis. "
            f"\n\n💡 I can help you with:\n"
            f"• Analyzing data trends and patterns\n"
            f"• Creating charts and visualizations\n"
            f"• Generating data insights and summaries\n"
            f"• Displaying data in table format\n"
            f"• Answering questions about your database\n\n"
            f"Please ask a question related to your data!"
        )
        
        return {
            "answer": irrelevant_response,
            "visualization": "none",
            "visualization_reason": "Question not related to data visualization",
            "chart_image_path": None,
            "chart_generation_error": None,
            "insights": "❌ No insights available - question not data-related",
            "formatted_table": None,
            "data_narrative": "Question is not related to data analysis",
            "insights_error": None
        }
    
    def create_skip_response(self, state: Dict[str, Any], skip_type: str) -> Dict[str, Any]:
        """
        Create response for skipped processing steps.
        
        Args:
            state: The current graph state
            skip_type: Type of skip ('chart', 'table', 'insights')
            
        Returns:
            Dict containing skip response
        """
        if skip_type == "chart":
            return {
                "visualization": "none",
                "visualization_reason": "Chart generation not required for this question type",
                "chart_image_path": None,
                "chart_generation_error": None
            }
        elif skip_type == "table":
            return {
                "formatted_table": None
            }
        elif skip_type == "insights":
            return {
                "insights": "📊 Basic answer provided - detailed insights not required",
                "data_narrative": "Simple query response",
                "insights_error": None
            }
        
        return {}


def finalize_response_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for finalizing response.
    This is the function that will be added to the LangGraph workflow.
    """
    finalizer = ResponseFinalizer()
    return finalizer.finalize_response(state)


def handle_irrelevant_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for handling irrelevant questions.
    This is the function that will be added to the LangGraph workflow.
    """
    finalizer = ResponseFinalizer()
    return finalizer.handle_irrelevant_question(state)


def skip_chart_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for skipping chart generation.
    """
    finalizer = ResponseFinalizer()
    return finalizer.create_skip_response(state, "chart")


def skip_table_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for skipping table formatting.
    """
    finalizer = ResponseFinalizer()
    return finalizer.create_skip_response(state, "table")


def skip_insights_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for skipping insights generation.
    """
    finalizer = ResponseFinalizer()
    return finalizer.create_skip_response(state, "insights")