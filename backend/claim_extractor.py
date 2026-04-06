import json
from typing import List
from llm import call_llm

async def extract_claims(text: str) -> List[str]:
    if not text.strip():
        return []
        
    system_prompt = """You are a journalistic claim extractor. 
Extract up to 15 distinct, verifiable factual claims from the provided text.
Ignore opinions, rhetorical statements, and contextual background.
Return a JSON object with a single key 'claims' containing a list of strings.
Example: {"claims": ["The AI Office will start audits in Q3 2026", "Company X reported $5M revenue"]}"""

    prompt = f"Extract factual claims from the following text:\n\n{text[:10000]}"
    
    response = call_llm([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ], json_mode=True)
    
    try:
        data = json.loads(response)
        claims = data.get("claims", [])
        if not filter(lambda c: isinstance(c, str), claims):
             claims = []
        return claims[:15]
    except Exception as e:
        print(f"Claim extraction parsing error: {e}")
        return []
