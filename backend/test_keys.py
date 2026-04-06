"""Quick API key diagnostic.

Set provider keys in the environment before running:
  GROQ_API_KEY=...
  GEMINI_API_KEY=...
"""

import os

from litellm import completion

models = [
    ("groq/llama-3.3-70b-versatile", "GROQ_API_KEY"),
    ("gemini/gemini-2.0-flash", "GEMINI_API_KEY"),
    ("groq/llama-3.1-8b-instant", "GROQ_API_KEY"),
]

for model, required_key in models:
    if not os.environ.get(required_key):
        print(f"⚠️  {model}: skipped because {required_key} is not set")
        continue

    try:
        response = completion(
            model=model,
            messages=[{"role": "user", "content": "say hi"}],
            timeout=10,
        )
        print(f"✅ {model}: WORKS — {response.choices[0].message.content[:30]}")
    except Exception as error:
        print(f"❌ {model}: FAILED — {error}")
