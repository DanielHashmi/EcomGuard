"""OpenAI-compatible model provider for the OpenAI Agents SDK.

Supports Groq (primary — GPT-OSS-120B per spec) and Gemini as a
fallback, both via OpenAI-compatible Chat Completions endpoints.
"""

from __future__ import annotations

from openai import AsyncOpenAI
from agents import (
    OpenAIChatCompletionsModel,
    set_default_openai_api,
    set_tracing_disabled,
)

from backend.config import settings

# The SDK defaults to the Responses API and tries to export traces to the
# OpenAI platform. Neither works with third-party providers and the trace
# exporter stalls without an OPENAI_API_KEY — disable both up front.
set_default_openai_api("chat_completions")
set_tracing_disabled(True)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if settings.active_provider == "gemini":
            api_key = settings.gemini_api_key
            base_url = settings.gemini_base_url
            key_name = "GEMINI_API_KEY"
        else:
            api_key = settings.groq_api_key
            base_url = settings.groq_base_url
            key_name = "GROQ_API_KEY"

        if not api_key:
            raise ValueError(f"{key_name} environment variable is required")

        _client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    return _client


def create_chat_model(model_name: str | None = None) -> OpenAIChatCompletionsModel:
    """Create an OpenAI Agents SDK model from the configured provider."""
    return OpenAIChatCompletionsModel(
        model=model_name or settings.active_model,
        openai_client=_get_client(),
    )
