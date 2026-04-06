import json
from typing import List, Dict
from llm import call_llm

async def generate_narrative(topic: str, sources: List[Dict]) -> Dict:
    top_sources = sources[:5]
    if not top_sources:
        return {
            "headline": topic,
            "summary": "No sources were found to write this story.",
            "content": "No information could be retrieved."
        }
        
    context_blocks = []
    for i, s in enumerate(top_sources):
        context_blocks.append(f"Source [{i+1}]: {s.get('domain')} - {s.get('snippet')} - URL: {s.get('url')}")
        
    context = "\n\n".join(context_blocks)
        
    sys_prompt = """You are a senior journalist at a world-class newsroom. Write a 400-600 word investigative article using only the sources provided. The article must have: a headline, a two-sentence lede summary, then three to four named sections with subheadings (what happened, who is affected, what experts say, what happens next). Each section must be at least two paragraphs. Include at least one direct quote or paraphrase attributed to a specific source. Use specific facts, numbers, dates, and named entities from the sources — never make vague general statements. Every factual claim must end with a citation marker like [1]. Do not repeat the same point across sections. Do not use phrases like "according to reports" — name the publication directly. Output as JSON with fields: headline, summary, sections (array of objects with heading and body), and citations."""

    prompt = f"Topic: {topic}\n\nContext:\n{context}"
    
    res = call_llm([
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": prompt}
    ], json_mode=True)
    
    try:
        data = json.loads(res)
        return {
            "headline": data.get("headline", topic),
            "summary": data.get("summary", ""),
            "sections": data.get("sections", []),
            "citations": data.get("citations", [])
        }
    except Exception as e:
        print(f"Narrative gen error: {e}")
        return {
            "headline": topic,
            "summary": "Error generating narrative.",
            "sections": [],
            "citations": []
        }
