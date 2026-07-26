"""LLM Client protocol and factory — abstracts provider-specific clients."""

from typing import Any, Optional, Protocol, runtime_checkable

from pydantic import BaseModel


class TokenUsageInfo(BaseModel):
    """Token usage information."""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0


@runtime_checkable
class LLMClient(Protocol):
    """Protocol for LLM client implementations (Groq, OpenAI, etc.)."""

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
        json_response: bool = False,
        **kwargs: Any,
    ) -> tuple[str, TokenUsageInfo]: ...

    async def generate_with_retry(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_retries: Optional[int] = None,
        **kwargs: Any,
    ) -> tuple[str, TokenUsageInfo]: ...

    async def close(self) -> None: ...


_client_instance: Optional[LLMClient] = None


def get_llm_client(provider: str = "groq") -> LLMClient:
    """Get a singleton LLM client instance based on the configured provider."""
    global _client_instance
    if _client_instance is None:
        if provider == "groq":
            from llm.groq_client import GroqClient
            _client_instance = GroqClient()
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}. Use 'groq'.")
    return _client_instance


async def close_llm_client() -> None:
    """Close the LLM client."""
    global _client_instance
    if _client_instance:
        await _client_instance.close()
        _client_instance = None
