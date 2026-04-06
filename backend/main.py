import asyncio
import uuid
import time
import os
import httpx
from typing import Optional
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from signal_fetcher import get_signals
from source_aggregator import aggregate_sources
from claim_extractor import extract_claims
from verification_engine import verify_claim
from narrative_generator import generate_narrative
from confidence_scorer import calculate_confidence
from virlo_integration import get_virlo_score
from stats_db import record_run, get_stats

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

runs_db = {}

class InvestigateRequest(BaseModel):
    topic: Optional[str] = None
    text: Optional[str] = None
    url: Optional[str] = None

class TraceBuilder:
    def __init__(self, run_id: str):
        self.run_id = run_id
        
    def set_start(self, step_idx: int):
        runs_db[self.run_id]["trace"]["steps"][step_idx]["status"] = "active"
        runs_db[self.run_id]["trace"]["steps"][step_idx]["_start"] = time.time()
        
    def set_complete(self, step_idx: int, summary: str, reasoning=None):
        step = runs_db[self.run_id]["trace"]["steps"][step_idx]
        step["status"] = "complete"
        step["result_summary"] = summary
        if "_start" in step:
            step["duration_ms"] = int((time.time() - step["_start"]) * 1000)
        if reasoning:
            step["reasoning"] = reasoning

    def set_failed(self, step_idx: int, error_msg: str):
        step = runs_db[self.run_id]["trace"]["steps"][step_idx]
        step["status"] = "failed"
        runs_db[self.run_id]["status"] = "failed"
        runs_db[self.run_id]["error_message"] = error_msg

def simulate_pipeline(run_id: str):
    # Fallback simulation used before
    pass

async def execute_investigate_pipeline(run_id: str, topic: str):
    trace = TraceBuilder(run_id)

    # Real Mode API Check
    if not os.environ.get("TAVILY_API_KEY") or not os.environ.get("GROQ_API_KEY"):
        trace.set_failed(0, "Missing API keys. Set TAVILY_API_KEY and GROQ_API_KEY in environment.")
        return

    try:
        # Step 1: Signal Search
        trace.set_start(0)
        raw_sources = await get_signals(topic)
        if not raw_sources:
            trace.set_failed(0, f"No sources found for '{topic}'.")
            return
        trace.set_complete(0, f"{len(raw_sources)} sources found")
        
        # Step 2: Clustering
        trace.set_start(1)
        ranked_sources = aggregate_sources(raw_sources, topic)
        unique_domains = len(set(s.get("domain", "") for s in ranked_sources))
        trace.set_complete(1, f"{unique_domains} unique root domains")
        
        # Step 3: Verifying Claims
        trace.set_start(2)
        # Extract main context to verify
        combined_text = " ".join([s["snippet"] for s in ranked_sources])
        claims = await extract_claims(combined_text)
        if not claims:
             trace.set_failed(2, "No verifiable claims found in the article")
             return
             
        verified_results = []
        reasoning_list = []
        for claim in claims[:15]:
            res = await verify_claim(claim)
            verified_results.append(res)
            reasoning_list.append({
                "query": res["query"],
                "snippets": res["snippets"],
                "explanation": res["explanation"]
            })
            await asyncio.sleep(2) # Protect Free Tier Rate Limits
            
        trace.set_complete(2, f"{len(verified_results)} claims checked", reasoning=reasoning_list)
        
        # Step 4: Writing Story
        trace.set_start(3)
        story = await generate_narrative(topic, ranked_sources)
        if not story:
             trace.set_failed(3, "Story generation failed because the model was unavailable")
             return
        trace.set_complete(3, "Story generated")
        
        # Finalize
        confidence = calculate_confidence(verified_results, ranked_sources)
        runs_db[run_id]["status"] = "finished"
        runs_db[run_id]["sections"] = story.get("sections", [])
        runs_db[run_id]["citations"] = story.get("citations", [])
        runs_db[run_id]["headline"] = story["headline"]
        runs_db[run_id]["summary"] = story["summary"]
        runs_db[run_id]["sources"] = ranked_sources
        runs_db[run_id]["confidence"] = confidence
        
        # Record stats
        record_run(len(verified_results), len(ranked_sources), confidence)
        
    except Exception as e:
        import traceback
        print(f"Pipeline error: {e}")
        traceback.print_exc()
        runs_db[run_id]["status"] = "failed"
        if "rate_limit" in str(e).lower():
             runs_db[run_id]["error_message"] = "API rate limit reached. Wait a minute and try again."
        else:
             runs_db[run_id]["error_message"] = f"Pipeline error: {str(e)}"


@app.post("/api/investigate/start")
async def start_investigate(req: InvestigateRequest, background_tasks: BackgroundTasks):
    run_id = str(uuid.uuid4())
    runs_db[run_id] = {
        "id": run_id,
        "mode": "investigate",
        "status": "created",
        "topic": req.topic or "Unknown",
        "trace": {
            "steps": [
                {"name": "Signal Search", "status": "pending"},
                {"name": "Clustering Sources", "status": "pending"},
                {"name": "Verifying Claims", "status": "pending"},
                {"name": "Writing Story", "status": "pending"}
            ]
        }
    }
    background_tasks.add_task(execute_investigate_pipeline, run_id, req.topic)
    return {"run_id": run_id}


async def execute_audit_pipeline(run_id: str, text: str, url: Optional[str] = None):
    import re
    trace = TraceBuilder(run_id)

    if not os.environ.get("TAVILY_API_KEY") or not os.environ.get("GROQ_API_KEY"):
        trace.set_failed(0, "Missing API keys. Set TAVILY_API_KEY and GROQ_API_KEY in environment.")
        return
        
    if not url:
        match = re.search(r'(https?://[^\s]+)', text)
        if match:
            url = match.group(1)
            
    try:
        # Step 0: Extracting Claims
        trace.set_start(0)
        claims = await extract_claims(text)
        if not claims:
             trace.set_failed(0, "No claims could be extracted to verify.")
             return
        trace.set_complete(0, f"Extracted {len(claims)} claims")
        
        # Step 1: Verifying Claims
        trace.set_start(1)
        verified_results = []
        issues = []
        source_collection = []
        
        for claim in claims:
            res = await verify_claim(claim)
            verified_results.append(res)
            
            # transform to issues format
            if res["verdict"] == "unsupported":
                 issues.append({"type": "unsupported", "claim": claim, "explanation": res["explanation"]})
            elif res["verdict"] == "disputed":
                 issues.append({"type": "contradiction", "claim": claim, "explanation": res["explanation"]})
            else:
                 issues.append({"type": "verified", "claim": claim, "explanation": res["explanation"]})
                 
            source_collection.extend(res.get("snippets", []))
            await asyncio.sleep(2) # Protect Free Tier Rate Limits
            
        trace.set_complete(1, f"Verified {len(claims)} claims")
        
        # Step 2: Virlo Fact-Check
        trace.set_start(2)
        virlo_score = None
        if url:
             virlo_score = await get_virlo_score(url)
             
        if virlo_score is not None:
             trace.set_complete(2, f"Virlo Score: {virlo_score}")
        else:
             trace.set_complete(2, "Virlo score skipped or failed silently")
             
        # Step 3: Calculating Confidence
        trace.set_start(3)
        confidence = calculate_confidence(verified_results, source_collection)
        trace.set_complete(3, f"Calculated score: {confidence}")
        
        runs_db[run_id]["status"] = "finished"
        runs_db[run_id]["confidence"] = confidence
        if virlo_score is not None:
             runs_db[run_id]["virlo_score"] = virlo_score
             
        stats = []
        unsupported = [i for i in issues if i["type"] == "unsupported"]
        contradiction = [i for i in issues if i["type"] == "contradiction"]
        missing_context = [i for i in issues if i["type"] == "missing_context"]
        verified = [i for i in issues if i["type"] == "verified"]
        
        stats_text = f"Verified {len(verified)} completely. Found {len(unsupported)} unsupported and {len(contradiction)} contradictions."
        runs_db[run_id]["stats"] = stats_text
        runs_db[run_id]["issues"] = issues
        
        # Record stats
        record_run(len(claims), len(source_collection), confidence)
        
    except Exception as e:
        print(f"Audit pipeline error: {e}")
        runs_db[run_id]["status"] = "failed"
        if str(e) == "rate_limit":
             runs_db[run_id]["error_message"] = "API rate limit reached. Wait a minute and try again."
        else:
             runs_db[run_id]["error_message"] = "An unexpected error occurred during the audit."

@app.post("/api/audit/start")
async def start_audit(req: InvestigateRequest, background_tasks: BackgroundTasks):
    run_id = str(uuid.uuid4())
    runs_db[run_id] = {
        "id": run_id,
        "mode": "audit",
        "status": "created",
        "topic": req.text[:50] if req.text else "Unknown",
        "trace": {
            "steps": [
                {"name": "Extracting Claims", "status": "pending"},
                {"name": "Verifying Claims", "status": "pending"},
                {"name": "Virlo Fact-Check", "status": "pending"},
                {"name": "Calculating Confidence", "status": "pending"}
            ]
        }
    }
    background_tasks.add_task(execute_audit_pipeline, run_id, req.text, req.url)
    return {"run_id": run_id}

@app.get("/api/investigate/status/{run_id}")
async def get_status(run_id: str):
    record = runs_db.get(run_id)
    if not record:
        return {"error": "Not found", "status": "failed"}, 404
    return record

@app.get("/api/audit/status/{run_id}")
async def get_audit_status(run_id: str):
    return await get_status(run_id)

@app.get("/api/stats")
async def api_stats():
    return get_stats()
