from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

class LLMManager:
    """Manages LLM interactions for the QueryBot agent."""
    
    def __init__(self):
        self.llm = ChatGroq(model="moonshotai/kimi-k2-instruct-0905", temperature=0)

    def invoke(self, prompt: ChatPromptTemplate, **kwargs) -> str:
        """Invoke the LLM with a prompt and return the response content."""
        messages = prompt.format_messages(**kwargs)
        response = self.llm.invoke(messages)
        return response.content