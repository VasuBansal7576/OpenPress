import re
from typing import List, Dict

AUTHORITY_DOMAINS = [
    "reuters.com", "bbc.com", "apnews.com", "theguardian.com", 
    "nytimes.com", "wsj.com", "nature.com", "arxiv.org", "wikipedia.org",
    "bloomberg.com", "ft.com", "cnn.com"
]

def tokenize(text: str) -> set:
    text = re.sub(r'[^a-z0-9\s]', '', text.lower())
    return set(text.split())

def jaccard_similarity(s1: set, s2: set) -> float:
    if not s1 and not s2: return 1.0
    if not s1 or not s2: return 0.0
    return len(s1.intersection(s2)) / len(s1.union(s2))

def aggregate_sources(raw_sources: List[Dict], query: str) -> List[Dict]:
    if not raw_sources:
        return []

    query_tokens = tokenize(query)
    
    # 1. Fuzzy Deduplication
    unique_sources = []
    for source in raw_sources:
        is_dup = False
        text = f"{source.get('title','')} {source.get('snippet','')}"
        toks = tokenize(text)
        
        for u_source in unique_sources:
            u_text = f"{u_source.get('title','')} {u_source.get('snippet','')}"
            u_toks = tokenize(u_text)
            if jaccard_similarity(toks, u_toks) > 0.8:  # 80% similarity threshold
                is_dup = True
                break
        
        if not is_dup:
            unique_sources.append(source)

    # 2. Score by relevance
    for source in unique_sources:
        text = f"{source.get('title','')} {source.get('snippet','')}"
        toks = list(tokenize(text))
        
        # Term frequency score: how many times query words appear
        score = 0
        for token in query_tokens:
            score += toks.count(token) * 0.1
            
        # Optional: Add small baseline
        score = min(score, 1.0)
        
        # Authority bonus
        domain = source.get("domain", "").replace("www.", "")
        if domain in AUTHORITY_DOMAINS or domain.endswith(".gov"):
            score += 0.2
            
        source["relevance"] = min(score, 1.0)
        
    # 3. Sort by relevance and take top 10
    unique_sources.sort(key=lambda x: x["relevance"], reverse=True)
    return unique_sources[:10]
