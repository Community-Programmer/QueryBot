from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
class LLMManager:
    """Manages LLM interactions for the QueryBot agent."""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

    def invoke(self, prompt: ChatPromptTemplate, **kwargs) -> str:
        """Invoke the LLM with a prompt and return the response content."""
        messages = prompt.format_messages(**kwargs)
        response = self.llm.invoke(messages)
        return response.content