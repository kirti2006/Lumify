"""Base agent class for LangGraph nodes."""

import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from config.logging import get_logger
from llm.llm_client import LLMClient, TokenUsageInfo

logger = get_logger(__name__)


class BaseAgent(ABC):
    """Abstract base class for AI agents used in LangGraph nodes."""

    def __init__(
        self,
        name: str,
        llm_client: LLMClient,
        system_prompt: Optional[str] = None,
    ):
        """Initialize the base agent.

        Args:
            name: Agent name for logging and tracking
            llm_client: LLM client instance (Groq by default)
            system_prompt: Default system prompt for this agent
        """
        self.name = name
        self.llm_client = llm_client
        self.system_prompt = system_prompt

    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's core logic.

        Args:
            input_data: Input data from the LangGraph state

        Returns:
            Dictionary of updates to apply to the state
        """
        ...

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the agent with logging and error handling.

        Args:
            input_data: Input data from the LangGraph state

        Returns:
            Dictionary of updates to apply to the state
        """
        start_time = time.time()
        logger.info(f"Agent [{self.name}] starting execution")

        try:
            result = await self.execute(input_data)
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.info(
                f"Agent [{self.name}] completed in {elapsed_ms}ms",
                extra={"agent": self.name, "elapsed_ms": elapsed_ms},
            )
            return result

        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.error(
                f"Agent [{self.name}] failed after {elapsed_ms}ms: {str(e)}",
                extra={"agent": self.name, "elapsed_ms": elapsed_ms, "error": str(e)},
            )
            raise

    async def call_llm(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_response: bool = False,
        **kwargs,
    ) -> tuple[str, TokenUsageInfo]:
        """Convenience method to call the LLM with this agent's defaults."""
        return await self.llm_client.generate(
            prompt=prompt,
            system_prompt=system_prompt or self.system_prompt,
            json_response=json_response,
            **kwargs,
        )
