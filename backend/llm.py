import os
import time
from litellm import completion

# LiteLLM reads these automatically from env:
# GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY

MODELS = [
    "groq/llama-3.3-70b-versatile",
    "gemini/gemini-2.0-flash",
    "openrouter/meta-llama/llama-3.1-8b-instruct:free",
    "groq/llama-3.1-8b-instant",
]

def call_llm(messages: list, json_mode: bool = False) -> str:
    """Single unified LLM call with fallback chain and smart retry."""
    
    kwargs = {
        "messages": messages,
        "timeout": 15,
        "temperature": 0.2,
    }
    
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    
    last_error = None
    for model in MODELS:
        # Try each model up to 3 times with backoff for per-minute limits
        for attempt in range(3):
            try:
                response = completion(model=model, **kwargs)
                return response.choices[0].message.content
            except Exception as e:
                error_str = str(e)
                last_error = e
                
                # If it's a per-minute rate limit (not daily), wait and retry same model
                if "tokens per minute" in error_str or "per minute" in error_str.lower():
                    wait = 4 * (attempt + 1)  # 4s, 8s, 12s
                    print(f"[LiteLLM] {model} hit per-minute limit. Waiting {wait}s (attempt {attempt+1}/3)...")
                    time.sleep(wait)
                    continue
                    
                # If it's a daily limit or other fatal error, skip to next model
                print(f"[LiteLLM] {model} failed (fatal): {error_str[:120]}")
                break  # break retry loop, move to next model
    
    print(f"[LiteLLM] All models exhausted.")
    raise Exception("rate_limit")
