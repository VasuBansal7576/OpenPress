import os
import time
from dataclasses import dataclass

from litellm import completion


@dataclass(frozen=True)
class ModelConfig:
    model: str
    required_env: str


class LLMProviderError(Exception):
    def __init__(self, public_message: str):
        super().__init__(public_message)
        self.public_message = public_message


# LiteLLM reads these automatically from env:
# GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY
MODELS = [
    ModelConfig("openrouter/auto", "OPENROUTER_API_KEY"),
    ModelConfig("openrouter/free", "OPENROUTER_API_KEY"),
    ModelConfig("groq/llama-3.1-8b-instant", "GROQ_API_KEY"),
    ModelConfig("gemini/gemini-2.0-flash", "GEMINI_API_KEY"),
    ModelConfig("groq/llama-3.3-70b-versatile", "GROQ_API_KEY"),
]


def _has_provider_key(env_name: str) -> bool:
    return bool(os.environ.get(env_name))


def _is_rate_limited(error_str: str) -> bool:
    lowered = error_str.lower()
    signals = [
        "rate limit",
        "429",
        "per minute",
        "quota",
        "resource has been exhausted",
        "too many requests",
    ]
    return any(signal in lowered for signal in signals)


def _summarize_model_error(model: str, error_str: str) -> str:
    provider = model.split("/", 1)[0].title()
    lowered = error_str.lower()

    if "no endpoints found" in lowered:
        return f"{provider} has no available endpoint for {model}."
    if "insufficient" in lowered and "credit" in lowered:
        return f"{provider} has no available credit for {model}."
    if "invalid api key" in lowered or "incorrect api key" in lowered or "unauthorized" in lowered:
        return f"{provider} rejected the API key for {model}."
    if _is_rate_limited(error_str):
        return f"{provider} is rate-limited right now."
    return f"{provider} failed for {model}."


def _collapse_errors(model_errors: list[tuple[str, str]]) -> str:
    if not model_errors:
        return "No configured LLM providers were available."

    unique_messages = []
    seen = set()
    for _, message in model_errors:
        if message in seen:
            continue
        seen.add(message)
        unique_messages.append(message)

    if all("rate-limited" in message for message in unique_messages):
        return "All configured LLM providers are rate-limited right now. Try again in a minute."

    summary = "; ".join(unique_messages[:3])
    return f"All configured LLM providers failed. {summary}"


def call_llm(messages: list, json_mode: bool = False) -> str:
    """Single unified LLM call with provider-aware fallbacks."""

    kwargs = {
        "messages": messages,
        "timeout": 15,
        "temperature": 0.2,
    }

    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    available_models = [config for config in MODELS if _has_provider_key(config.required_env)]
    if not available_models:
        raise LLMProviderError(
            "No LLM provider keys configured. Set OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY."
        )

    model_errors: list[tuple[str, str]] = []

    for index, config in enumerate(available_models):
        model = config.model
        try:
            response = completion(model=model, **kwargs)
            return response.choices[0].message.content
        except Exception as error:
            error_str = str(error)
            public_error = _summarize_model_error(model, error_str)
            model_errors.append((model, public_error))

            if _is_rate_limited(error_str) and index == len(available_models) - 1:
                print(f"[LiteLLM] {model} hit a rate limit on the final fallback. Waiting 4s before giving up.")
                time.sleep(4)

            print(f"[LiteLLM] {model} failed: {error_str[:180]}")

    print("[LiteLLM] All models exhausted.")
    raise LLMProviderError(_collapse_errors(model_errors))
