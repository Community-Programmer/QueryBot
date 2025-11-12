from typing import List, Any, Annotated, Dict, Optional
from typing_extensions import TypedDict
import operator

class InputState(TypedDict):
    """Input state for the QueryBot agent workflow."""
    question: str
    uuid: str

class OutputState(TypedDict):
    """Output state for the QueryBot agent workflow."""
    answer: str
    visualization: str
    visualization_reason: str
    chart_image_path: Optional[str]
    chart_generation_error: Optional[str]
    insights: Optional[str]
    formatted_table: Optional[str]
    data_narrative: Optional[str]
    insights_error: Optional[str]

class OverallState(InputState, OutputState):
    """Complete state that includes all intermediate states."""
    parsed_question: Optional[Dict[str, Any]]
    unique_nouns: Optional[List[str]]
    sql_query: Optional[str]
    sql_valid: Optional[bool]
    sql_issues: Optional[str]
    results: Optional[List[Any]]
    error: Optional[str]
    question_type: Optional[str]  # chart, table, or general
    requires_visualization: Optional[bool]
    requires_table: Optional[bool]