"""Tests for LLM wrapper."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from llm.openai_client import LLMError, OpenAIClient, TokenUsageInfo


class TestOpenAIClient:
    """Tests for OpenAIClient."""

    @pytest.fixture
    def mock_openai_client(self):
        """Create a mock OpenAI client."""
        with patch("llm.openai_client.AsyncOpenAI") as mock_class:
            mock_instance = MagicMock()
            mock_class.return_value = mock_instance
            client = OpenAIClient(api_key="test_key")
            client._client = mock_instance
            yield client, mock_instance

    def test_client_initialization(self):
        """Test client initialization."""
        client = OpenAIClient(api_key="test_key")
        assert client.api_key == "test_key"
        assert client.default_model == "gpt-4o"

    def test_client_initialization_with_custom_settings(self):
        """Test client with custom settings."""
        client = OpenAIClient(
            api_key="test_key",
            default_model="gpt-5",
            default_temperature=0.5,
            max_retries=5,
        )
        assert client.default_model == "gpt-5"
        assert client.default_temperature == 0.5
        assert client.max_retries == 5

    @pytest.mark.asyncio
    async def test_generate_success(self, mock_openai_client):
        """Test successful text generation."""
        client, mock_instance = mock_openai_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Test response"))]

        mock_usage = MagicMock()
        mock_usage.prompt_tokens = 100
        mock_usage.completion_tokens = 50
        mock_usage.total_tokens = 150
        mock_response.usage = mock_usage

        mock_instance.chat.completions.create = AsyncMock(return_value=mock_response)

        response, token_info = await client.generate(
            prompt="Test prompt",
            system_prompt="You are a helpful assistant",
        )

        assert response == "Test response"
        assert token_info.prompt_tokens == 100
        assert token_info.completion_tokens == 50
        assert token_info.total_tokens == 150

    @pytest.mark.asyncio
    async def test_generate_with_json_response(self, mock_openai_client):
        """Test generation with JSON response."""
        client, mock_instance = mock_openai_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content='{"key": "value"}'))]
        mock_usage = MagicMock()
        mock_usage.prompt_tokens = 50
        mock_usage.completion_tokens = 25
        mock_usage.total_tokens = 75
        mock_response.usage = mock_usage

        mock_instance.chat.completions.create = AsyncMock(return_value=mock_response)

        response, token_info = await client.generate(
            prompt="Generate JSON",
            json_response=True,
        )

        assert response == '{"key": "value"}'

    @pytest.mark.asyncio
    async def test_generate_stream(self, mock_openai_client):
        """Test streaming generation."""
        client, mock_instance = mock_openai_client

        async def mock_stream():
            chunks = ["Hello", " World", "!"]
            for chunk in chunks:
                yield MagicMock(
                    choices=[MagicMock(delta=MagicMock(content=chunk))]
                )

        mock_instance.chat.completions.create = AsyncMock(return_value=mock_stream())

        result_chunks = []
        async for chunk in client.generate_stream(prompt="Say hello"):
            result_chunks.append(chunk)

        assert result_chunks == ["Hello", " World", "!"]

    def test_token_usage_info_model(self):
        """Test TokenUsageInfo model."""
        usage = TokenUsageInfo(
            prompt_tokens=100,
            completion_tokens=50,
            total_tokens=150,
            latency_ms=500,
        )
        assert usage.prompt_tokens == 100
        assert usage.completion_tokens == 50
        assert usage.total_tokens == 150
        assert usage.latency_ms == 500


class TestLLMError:
    """Tests for LLMError exception."""

    def test_llm_error_creation(self):
        """Test LLMError creation."""
        error = LLMError("Test error", code="test_code")
        assert error.message == "Test error"
        assert error.code == "test_code"

    def test_llm_error_default_code(self):
        """Test LLMError with default code."""
        error = LLMError("Test error")
        assert error.code == "llm_error"
