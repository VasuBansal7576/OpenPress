import os
import httpx
from typing import Optional

VIRLO_API_KEY = os.environ.get("VIRLO_API_KEY")

async def get_virlo_score(url: str) -> Optional[int]:
    if not VIRLO_API_KEY or not url:
        return None
        
    api_url = "https://api.virlo.ai/v1/factcheck"
    headers = {
        "Authorization": f"Bearer {VIRLO_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {"url": url}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.post(api_url, headers=headers, json=data)
            res.raise_for_status()
            resp_data = res.json()
            return resp_data.get("factuality_score")
        except Exception as e:
            print(f"Virlo API error: {e}")
            return None
