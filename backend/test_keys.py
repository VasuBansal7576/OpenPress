"""Quick API key diagnostic — run this to see which keys work."""
import os
os.environ["GROQ_API_KEY"] = "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"
os.environ["GEMINI_API_KEY"] = "AIzaSyCtZ1BYNjOX54Y6Ae54xkaszeQ7p3Qsdrg"

from litellm import completion

models = [
    "groq/llama-3.3-70b-versatile",
    "gemini/gemini-2.0-flash",
    "groq/llama-3.1-8b-instant",
]

for m in models:
    try:
        r = completion(model=m, messages=[{"role":"user","content":"say hi"}], timeout=10)
        print(f"✅ {m}: WORKS — {r.choices[0].message.content[:30]}")
    except Exception as e:
        print(f"❌ {m}: FAILED — {e}")
