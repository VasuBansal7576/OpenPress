from typing import List, Dict
from source_aggregator import AUTHORITY_DOMAINS

def calculate_confidence(claims_results: List[Dict], sources: List[Dict]) -> int:
    if not claims_results or not sources:
        return 0
        
    total_claims = len(claims_results)
    confirmed_claims = 0
    
    # 1. Verification ratio (60%)
    for res in claims_results:
        if res.get("verdict") == "supported":
            domains = set(s["domain"] for s in res.get("snippets", []))
            if len(domains) >= 2:
                confirmed_claims += 1
                
    verification_ratio = confirmed_claims / total_claims if total_claims > 0 else 0
    verification_score = verification_ratio * 60
    
    # 2. Diversity Score (25%)
    total_sources = len(sources)
    unique_domains = set(s.get("domain", "") for s in sources)
    diversity_ratio = len(unique_domains) / total_sources if total_sources > 0 else 0
    diversity_score = diversity_ratio * 25
    
    # 3. Authority Score (15%)
    auth_count = 0
    for s in sources:
        domain = s.get("domain", "").replace("www.", "")
        if domain in AUTHORITY_DOMAINS or domain.endswith(".gov"):
            auth_count += 1
            
    authority_ratio = auth_count / total_sources if total_sources > 0 else 0
    authority_score = authority_ratio * 15
    
    total = verification_score + diversity_score + authority_score
    return int(round(total))
