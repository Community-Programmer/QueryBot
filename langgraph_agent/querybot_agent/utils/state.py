"""
Workflow state schemas.

LangGraph only persists keys declared here. Any key a node returns that is
absent from ``OverallState`` is discarded, so several fields the routing logic
depended on - ``is_relevant`` in particular - never actually reached the state
and silently defaulted on every run.
"""
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict


class InputState(TypedDict, total=False):
    """What callers provide when starting a run."""

    question: str
    uuid: str
    # Prior turns, so follow-up questions can be resolved against earlier context.
    history: Optional[List[Dict[str, Any]]]


class OutputState(TypedDict, total=False):
    """What callers receive when a run completes."""

    answer: str
    sql_query: Optional[str]
    visualization: str
    visualization_reason: str
    chart_image_base64: Optional[str]
    chart_generation_error: Optional[str]
    insights: Optional[str]
    formatted_table: Optional[str]
    data_narrative: Optional[str]
    insights_error: Optional[str]
    results: Optional[List[Any]]
    result_columns: Optional[List[str]]
    error: Optional[str]
    # Questions the user is likely to ask next, derived from this result.
    suggested_questions: Optional[List[str]]
    # Caveats about the data that affect how the answer should be read.
    data_quality_notes: Optional[List[str]]


class OverallState(InputState, OutputState, total=False):
    """Every key the workflow reads or writes, including intermediates."""

    # Question analysis
    parsed_question: Optional[Dict[str, Any]]
    unique_nouns: Optional[List[str]]

    # SQL lifecycle
    sql_valid: Optional[bool]
    sql_issues: Optional[str]

    # Execution-guided self-correction. A query that fails is retried with the
    # database's own error message as feedback, which recovers the large class of
    # failures caused by a wrong column name or a type mismatch that the model
    # cannot see from the schema alone.
    sql_attempts: Optional[int]
    sql_error_history: Optional[List[str]]
    sql_repaired: Optional[bool]

    # Classification. These were previously returned by classify_question but
    # missing from the schema, so is_relevant always fell back to its default
    # and irrelevant questions were routed by question_type alone.
    question_type: Optional[str]
    requires_visualization: Optional[bool]
    requires_table: Optional[bool]
    is_relevant: Optional[bool]
    classification_confidence: Optional[float]
    classification_reasoning: Optional[str]

    # Visualization hints produced by choose_visualization and consumed by the
    # chart generator. Also previously dropped.
    seaborn_function: Optional[str]
    matplotlib_styling: Optional[str]
