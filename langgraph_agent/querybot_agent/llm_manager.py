"""
LLM access.

Wraps the chat model with shared configuration, retries and JSON parsing that
tolerates the fenced-code output models frequently return.
"""
import json
import logging
import re
from typing import Any, Optional

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from querybot_agent.config import settings

logger = logging.getLogger(__name__)


class LLMManager:
    """Single entry point for model calls."""

    # The client is stateless and thread-safe; one instance is shared across the
    # many manager objects the workflow creates, instead of opening a new client
    # per node on every run.
    _shared_client: Optional[ChatGroq] = None

    def __init__(self) -> None:
        if LLMManager._shared_client is None:
            LLMManager._shared_client = ChatGroq(
                model=settings.groq_model,
                temperature=settings.temperature,
                max_retries=settings.max_retries,
            )
        self.llm = LLMManager._shared_client

    def invoke(self, prompt: ChatPromptTemplate, **kwargs: Any) -> str:
        """Render the prompt, call the model, and return the text response."""
        messages = prompt.format_messages(**kwargs)
        response = self.llm.invoke(messages)

        content = response.content
        # Some providers return content as a list of parts rather than a string.
        if isinstance(content, list):
            content = ''.join(
                part.get('text', '') if isinstance(part, dict) else str(part) for part in content
            )
        return str(content)

    def invoke_json(self, prompt: ChatPromptTemplate, **kwargs: Any) -> Any:
        """
        Call the model and parse the response as JSON.

        Models routinely wrap JSON in a ```json fence or add a sentence of
        commentary. Rather than letting the strict parser fail the whole run, the
        outermost JSON object is extracted as a fallback.
        """
        raw = self.invoke(prompt, **kwargs)

        try:
            return JsonOutputParser().parse(raw)
        except Exception:  # noqa: BLE001 - fall through to lenient extraction
            logger.debug('Strict JSON parse failed, attempting extraction')

        cleaned = re.sub(r'^\s*```(?:json)?|```\s*$', '', raw.strip(), flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        raise ValueError(f'The model did not return valid JSON: {raw[:200]}')
