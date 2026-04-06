import os
import httpx
import asyncio
from typing import List, Dict

TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")

async def fetch_tavily(query: str) -> List[Dict]:
    if not TAVILY_API_KEY:
        return []
    url = "https://api.tavily.com/search"
    headers = {"Content-Type": "application/json"}
    data = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "include_raw_content": False,
        "max_results": 10
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.post(url, json=data, headers=headers)
            res.raise_for_status()
            resp_data = res.json()
            results = []
            for item in resp_data.get("results", []):
                results.append({
                    "url": item.get("url"),
                    "title": item.get("title"),
                    "snippet": item.get("content", ""),
                    "domain": httpx.URL(item.get("url", "")).host
                })
            return results
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                print(f"Tavily rate limited (429). Falling back to SearXNG...")
                return []  # Return empty so caller falls back to SearXNG
            print(f"Tavily fetch error: {e}")
            return []
        except Exception as e:
            print(f"Tavily fetch error: {e}")
            return []

SEARXNG_INSTANCES = [
    "https://searx.be", 
    "https://searx.tiekoetter.com", 
    "https://searxng.org", 
    "https://search.bus-hit.me", 
    "https://searx.fmac.xyz"
]

async def fetch_searxng(query: str) -> List[Dict]:
    wait_time = 0
    results = []
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for attempt, instance in enumerate(SEARXNG_INSTANCES):
            if wait_time > 0:
                await asyncio.sleep(wait_time)
            try:
                # Add delay between calls
                await asyncio.sleep(1.5)
                res = await client.get(f"{instance}/search", params={"q": query, "format": "json"})
                res.raise_for_status()
                data = res.json()
                for item in data.get("results", []):
                    results.append({
                        "url": item.get("url"),
                        "title": item.get("title"),
                        "snippet": item.get("content", ""),
                        "domain": httpx.URL(item.get("url", "")).host
                    })
                if len(results) > 0:
                    break # Stop if we got results
            except Exception as e:
                # Exponential backoff
                wait_time = 2 ** (attempt + 1)
                continue
    return results

async def fetch_hacker_news(query: str) -> List[Dict]:
    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            res = await client.get("https://hn.algolia.com/api/v1/search", params={"query": query})
            res.raise_for_status()
            data = res.json()
            results = []
            for item in data.get("hits", []):
                url = item.get("url") or item.get("story_url")
                if not url: continue
                results.append({
                    "url": url,
                    "title": item.get("title", ""),
                    "snippet": item.get("story_text", "") or "",
                    "domain": httpx.URL(url).host
                })
            return results
        except Exception:
            return []

async def get_signals(query: str) -> List[Dict]:
    # Try Tavily first
    sources = await fetch_tavily(query)
    
    if len(sources) < 3:
        # Fallback to SearXNG
        sources.extend(await fetch_searxng(query))
        
    tech_keywords = ["software", "technology", "startup", "ai", "artificial intelligence", "tech"]
    is_tech = any(kw in query.lower() for kw in tech_keywords)
    if is_tech:
        sources.extend(await fetch_hacker_news(query))
        
    # Deduplicate by URL
    seen_urls = set()
    unique_sources = []
    for s in sources:
        if s["url"] not in seen_urls:
            seen_urls.add(s["url"])
            unique_sources.append(s)
            
    return unique_sources[:20]
