from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

class LLMManager:
    """Manages LLM interactions for the QueryBot agent."""
    
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0)

    def invoke(self, prompt: ChatPromptTemplate, **kwargs) -> str:
        """Invoke the LLM with a prompt and return the response content."""
        messages = prompt.format_messages(**kwargs)
        response = self.llm.invoke(messages)
        return response.content