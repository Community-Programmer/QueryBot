"""
Question Classifier Module - Classifies user questions and determines routing.

This module analyzes user questions to determine:
1. Whether the question is relevant to the database
2. What type of output is expected (chart, table, general)
3. Route questions to appropriate processing paths
"""

from typing import Dict, Any, Literal
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from querybot_agent.llm_manager import LLMManager

class QuestionClassifier:
    """Classifies questions and determines processing routes."""
    
    def __init__(self):
        self.llm_manager = LLMManager()
    
    def classify_question(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify the user question to determine how to process it.
        
        Args:
            state: The current graph state containing question
            
        Returns:
            Dict containing classification results
        """
        question = state['question']
        schema = None
        
        # Get database schema if available
        try:
            from querybot_agent.database_manager import DatabaseManager
            db_manager = DatabaseManager()
            schema = db_manager.get_schema(state['uuid'])
        except Exception:
            schema = "Schema unavailable"
        
        classification_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an AI assistant that classifies user questions about databases.

Your task is to analyze the question and determine:
1. Is it relevant to the database/data?
2. What type of output does the user expect?
3. Does it require data visualization?
4. Does it require tabular data presentation?

Classification Categories:
- "chart": User wants a visual representation (graph, chart, plot)
- "table": User wants to see data in tabular format, lists, or detailed records  
- "general": User wants a summary, answer, or general information
- "irrelevant": Question is not related to data/database

Question Patterns:
CHART indicators: "show me a graph", "plot", "chart", "visualize", "trend", "distribution", "compare visually"
TABLE indicators: "show me the data", "list all", "display records", "what are the", "give me details", "show entries"
GENERAL indicators: "how many", "what is", "tell me about", "explain", "summarize"
IRRELEVANT indicators: Questions about weather, general knowledge, unrelated topics

Respond in JSON format:
{{
    "is_relevant": boolean,
    "question_type": "chart" | "table" | "general" | "irrelevant", 
    "requires_visualization": boolean,
    "requires_table": boolean,
    "confidence": float,
    "reasoning": string
}}"""),
            
            ("human", """Database Schema:
{schema}

User Question: {question}

Classify this question:""")
        ])
        
        try:
            output_parser = JsonOutputParser()
            response = self.llm_manager.invoke(
                classification_prompt,
                schema=schema,
                question=question
            )
            result = output_parser.parse(response)
            
            return {
                "question_type": result.get("question_type", "general"),
                "requires_visualization": result.get("requires_visualization", False),
                "requires_table": result.get("requires_table", False),
                "is_relevant": result.get("is_relevant", True),
                "classification_confidence": result.get("confidence", 0.8),
                "classification_reasoning": result.get("reasoning", "Standard classification")
            }
            
        except Exception as e:
            # Fallback classification
            question_lower = question.lower()
            
            if any(word in question_lower for word in ['weather', 'hello', 'hi', 'thank you']):
                question_type = "irrelevant"
                is_relevant = False
            elif any(word in question_lower for word in ['chart', 'graph', 'plot', 'visualize', 'trend', 'distribution']):
                question_type = "chart"
                is_relevant = True
            elif any(word in question_lower for word in ['list', 'show me', 'display', 'all records', 'entries']):
                question_type = "table" 
                is_relevant = True
            else:
                question_type = "general"
                is_relevant = True
            
            return {
                "question_type": question_type,
                "requires_visualization": question_type == "chart",
                "requires_table": question_type == "table",
                "is_relevant": is_relevant,
                "classification_confidence": 0.6,
                "classification_reasoning": f"Fallback classification due to error: {str(e)}"
            }


def classify_question_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node function for question classification.
    This is the function that will be added to the LangGraph workflow.
    """
    classifier = QuestionClassifier()
    return classifier.classify_question(state)


def should_generate_chart(state: Dict[str, Any]) -> Literal["generate_chart", "skip_chart"]:
    """
    Conditional edge function to determine if chart generation is needed.
    
    Args:
        state: The current graph state
        
    Returns:
        Next node name based on visualization requirements
    """
    # Check if visualization is required and we have data
    requires_viz = state.get('requires_visualization', False)
    has_data = bool(state.get('results', []))
    question_type = state.get('question_type', 'general')
    
    if (requires_viz or question_type == "chart") and has_data:
        return "generate_chart"
    else:
        return "skip_chart"


def should_generate_table(state: Dict[str, Any]) -> Literal["format_table", "skip_table"]:
    """
    Conditional edge function to determine if table formatting is needed.
    
    Args:
        state: The current graph state
        
    Returns:
        Next node name based on table requirements
    """
    requires_table = state.get('requires_table', False)
    has_data = bool(state.get('results', []))
    question_type = state.get('question_type', 'general')
    
    if (requires_table or question_type == "table") and has_data:
        return "format_table"
    else:
        return "skip_table"


def should_generate_insights(state: Dict[str, Any]) -> Literal["generate_insights", "finalize"]:
    """
    Conditional edge function to determine if insights generation is needed.
    
    Args:
        state: The current graph state
        
    Returns:
        Next node name based on insights requirements
    """
    has_data = bool(state.get('results', []))
    is_relevant = state.get('is_relevant', True)
    question_type = state.get('question_type', 'general')
    
    # Generate insights for all relevant questions with data except pure irrelevant ones
    if has_data and is_relevant and question_type != "irrelevant":
        return "generate_insights"
    else:
        return "finalize"


def is_question_relevant(state: Dict[str, Any]) -> Literal["process_question", "handle_irrelevant"]:
    """
    Conditional edge function to check if question is relevant to database.
    
    Args:
        state: The current graph state
        
    Returns:
        Next node name based on question relevance
    """
    is_relevant = state.get('is_relevant', True)
    question_type = state.get('question_type', 'general')
    
    if is_relevant and question_type != "irrelevant":
        return "process_question"
    else:
        return "handle_irrelevant"