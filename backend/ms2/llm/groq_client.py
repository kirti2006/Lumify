"""Groq client wrapper for GPT OSS 120B and other Groq models."""

import json
import time
from typing import Any, AsyncGenerator, Optional, TypeVar

from groq import APIError, APITimeoutError, AsyncGroq, RateLimitError
from pydantic import BaseModel

from config.logging import get_logger
from config.settings import get_settings
from llm.llm_client import TokenUsageInfo

settings = get_settings()
logger = get_logger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMError(Exception):
    """Custom LLM error."""

    def __init__(self, message: str, code: str = "llm_error"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class GroqClient:
    """Wrapper for Groq client — GPT OSS 120B (openai/gpt-oss-120b)."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: str | None = None,
        default_temperature: float | None = None,
        default_timeout: int | None = None,
        max_retries: int | None = None,
    ):
        """Initialize Groq client."""
        self.api_key = api_key or settings.groq_api_key
        self.default_model = default_model or settings.groq_default_model
        self.default_temperature = default_temperature if default_temperature is not None else settings.groq_default_temperature
        self.default_timeout = default_timeout or settings.groq_default_timeout
        self.max_retries = max_retries if max_retries is not None else settings.groq_max_retries

        self._client = AsyncGroq(
            api_key=self.api_key,
            timeout=self.default_timeout,
            max_retries=self.max_retries,
        )

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
        json_response: bool = False,
        **kwargs,
    ) -> tuple[str, TokenUsageInfo]:
        """Generate text completion via Groq."""
        start_time = time.time()
        model = model or self.default_model
        temperature = temperature if temperature is not None else self.default_temperature

        messages = []
        if system_prompt:
            # Groq/OpenAI requires 'json' in the messages when using json_response
            sp = system_prompt
            if json_response and "json" not in sp.lower():
                sp += " Respond with valid JSON."
            messages.append({"role": "system", "content": sp})
        elif json_response:
            messages.append({"role": "system", "content": "Respond with valid JSON."})
        messages.append({"role": "user", "content": prompt})

        create_kwargs: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            create_kwargs["max_tokens"] = max_tokens
        if json_response:
            create_kwargs["response_format"] = {"type": "json_object"}

        try:
            response = await self._client.chat.completions.create(**create_kwargs)

            latency_ms = int((time.time() - start_time) * 1000)

            usage = response.usage
            token_usage = TokenUsageInfo(
                prompt_tokens=usage.prompt_tokens if usage else 0,
                completion_tokens=usage.completion_tokens if usage else 0,
                total_tokens=usage.total_tokens if usage else 0,
                latency_ms=latency_ms,
            )

            content = response.choices[0].message.content or ""
            if json_response:
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

            logger.info(
                "Groq generate completed",
                extra={
                    "model": model,
                    "prompt_tokens": token_usage.prompt_tokens,
                    "completion_tokens": token_usage.completion_tokens,
                    "latency_ms": latency_ms,
                },
            )

            return content, token_usage

        except APITimeoutError as e:
            logger.error(f"Groq API timeout: {e}")
            raise LLMError(f"API timeout: {str(e)}", code="timeout")
        except RateLimitError as e:
            logger.error(f"Groq API rate limit: {e}")
            raise LLMError(f"Rate limit exceeded: {str(e)}", code="rate_limit")
        except APIError as e:
            logger.error(f"Groq API error: {e}")
            raise LLMError(f"API error: {str(e)}", code="api_error")
        except Exception as e:
            logger.error(f"Unexpected error in Groq generate: {e}")
            raise LLMError(f"Unexpected error: {str(e)}", code="unexpected")

    async def generate_structured(
        self,
        prompt: str,
        response_model: type[T],
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        **kwargs,
    ) -> tuple[T, TokenUsageInfo]:
        """Generate structured JSON response using Pydantic model."""
        start_time = time.time()
        model = model or self.default_model
        temperature = temperature if temperature is not None else self.default_temperature

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append(
            {
                "role": "user",
                "content": f"{prompt}\n\nYou must respond with valid JSON only, matching this schema: {response_model.model_json_schema()}",
            }
        )

        try:
            response = await self._client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"},
            )

            latency_ms = int((time.time() - start_time) * 1000)

            usage = response.usage
            token_usage = TokenUsageInfo(
                prompt_tokens=usage.prompt_tokens if usage else 0,
                completion_tokens=usage.completion_tokens if usage else 0,
                total_tokens=usage.total_tokens if usage else 0,
                latency_ms=latency_ms,
            )

            content = (response.choices[0].message.content or "").strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            json_data = json.loads(content)
            parsed = response_model.model_validate(json_data)

            logger.info(
                "Groq structured generate completed",
                extra={
                    "model": model,
                    "response_model": response_model.__name__,
                    "latency_ms": latency_ms,
                },
            )

            return parsed, token_usage

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise LLMError(f"Failed to parse JSON response: {str(e)}", code="parse_error")
        except Exception as e:
            logger.error(f"Error in structured generation: {e}")
            raise LLMError(f"Error in structured generation: {str(e)}", code="generation_error")

    async def generate_stream(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        system_prompt: Optional[str] = None,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        """Generate streaming text completion."""
        model = model or self.default_model
        temperature = temperature if temperature is not None else self.default_temperature

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await self._client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except APITimeoutError as e:
            logger.error(f"Groq API timeout in stream: {e}")
            raise LLMError(f"Stream timeout: {str(e)}", code="timeout")
        except Exception as e:
            logger.error(f"Error in streaming: {e}")
            raise LLMError(f"Stream error: {str(e)}", code="stream_error")

    async def generate_with_retry(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_retries: Optional[int] = None,
        **kwargs,
    ) -> tuple[str, TokenUsageInfo]:
        """Generate with automatic retry on failure."""
        max_retries = max_retries or self.max_retries
        last_error = None

        for attempt in range(max_retries):
            try:
                return await self.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    model=model,
                    temperature=temperature,
                    **kwargs,
                )
            except LLMError as e:
                last_error = e
                if e.code in ["timeout", "rate_limit"]:
                    wait_time = 2**attempt
                    logger.warning(
                        f"Groq attempt {attempt + 1} failed, retrying in {wait_time}s",
                        extra={"error": str(e), "retry_count": attempt},
                    )
                    await self._async_sleep(wait_time)
                    continue
                raise

        raise last_error or LLMError("All retries exhausted", code="max_retries_exceeded")

    async def _async_sleep(self, seconds: float) -> None:
        """Async sleep helper."""
        import asyncio
        await asyncio.sleep(seconds)

    @property
    def client(self) -> AsyncGroq:
        """Get the underlying Groq client."""
        return self._client

    async def close(self) -> None:
        """Close the client connection."""
        await self._client.close()


_client_instance: Optional[GroqClient] = None


def get_groq_client() -> GroqClient:
    """Get the singleton Groq client instance."""
    global _client_instance
    if _client_instance is None:
        _client_instance = GroqClient()
    return _client_instance


async def close_groq_client() -> None:
    """Close the Groq client."""
    global _client_instance
    if _client_instance:
        await _client_instance.close()
        _client_instance = None
