import json
import httpx
import asyncio
from typing import Dict
from llm import call_llm
from signal_fetcher import fetch_tavily
import urllib.parse

async def verify_claim(claim: str) -> Dict:
    # 1. Generate search query for claim
    sys_prompt = "You are a search query generator. Return a JSON object with a 'query' string parameter optimized for finding factual evidence about the provided claim."
    res = call_llm([
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": f"Claim: {claim}"}
    ], json_mode=True)
    
    query = claim
    try:
         query_data = json.loads(res)
         query = query_data.get("query", claim)
    except:
         pass
         
    # 2. Fetch evidence
    sources = await fetch_tavily(query)
    
    # 3. Analyze evidence
    # Format the top 3 sources
    eval_sources = sources[:3]
    evidence_text = "\n\n".join([f"Source {i+1} Domain: {s['domain']}\nSnippet: {s['snippet']}" for i, s in enumerate(eval_sources)])
    
    if not eval_sources:
         return {
             "claim": claim,
             "verdict": "unsupported",
             "query": query,
             "snippets": [],
             "explanation": "No sources could be found to verify this claim."
         }
         
    eval_sys = """You are a rigorous journalistic fact verifier.
Analyze the claim against the provided source snippets.
Output JSON with these keys:
- 'verdict': 'supported', 'unsupported', or 'disputed'
- 'explanation': exactly one sentence explaining the verdict.
Return ONLY valid JSON."""

    eval_prompt = f"Claim to verify: {claim}\n\nSources:\n{evidence_text}"
    
    await asyncio.sleep(3)  # Spread requests to stay under Groq free-tier RPM
    eval_res = call_llm([
        {"role": "system", "content": eval_sys},
        {"role": "user", "content": eval_prompt}
    ], json_mode=True)
    
    verdict = "unsupported"
    explanation = "Failed to evaluate claim due to processing error."
    try:
        eval_data = json.loads(eval_res)
        verdict = eval_data.get("verdict", "unsupported").lower()
        if verdict not in ["supported", "unsupported", "disputed"]: verdict = "unsupported"
        explanation = eval_data.get("explanation", explanation)
    except Exception as e:
        print(f"Eval parse error: {e}")
        
    return {
        "claim": claim,
        "verdict": verdict,
        "query": query,
        "snippets": [{"domain": s["domain"], "text": s["snippet"]} for s in eval_sources],
        "explanation": explanation
    }
