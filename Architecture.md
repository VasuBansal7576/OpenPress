# Architecture

## Core Pipeline

Every request follows the same linear flow: input enters the pipeline, the system searches for signals, clusters and ranks them, verifies the claims, generates the output, and records a full trace. The only difference between Investigate and Audit is what triggers the pipeline and what comes out at the end. The frontend never waits for the full pipeline to finish — it polls for status every five hundred milliseconds and updates the UI as each step completes.

---

## What Was Removed and Why

DuckDuckGo was removed. It blocks IP addresses after roughly ten requests per minute and has no documented API.

Brave Search was removed. Brave eliminated its free tier in February 2026 and now requires a credit card.

Ollama was removed. It requires four to eight gigabytes of RAM on the same machine as the app and cannot be deployed to Railway or Render.

Reddit API was removed. Approval can take up to twenty-four hours, which is too risky for a hackathon timeline.

---

## Polling Architecture — How the Frontend Sees Live Progress

This is the most critical architectural decision. A single batch endpoint that returns after ten seconds produces no live updates — the screen hangs, then jumps to results. That violates the core UX requirement. The fix is a two-endpoint polling pattern.

The first endpoint starts a pipeline run. It accepts the user's topic or article, immediately returns a run identifier, and kicks off the pipeline asynchronously in a background task. The HTTP response comes back in under one hundred milliseconds.

The second endpoint returns the current state of a run. It accepts a run identifier and returns the full trace object with the status of each step. Steps that have not started yet have a pending status. The step currently running has an active status. Completed steps have a success or failed status along with their result summary and duration in milliseconds.

The frontend calls the second endpoint every five hundred milliseconds from the moment the run starts. Each response updates the step indicators on screen. When all steps show a completed status, the frontend waits six hundred milliseconds and navigates to the results screen using the data already in the final status response.

This pattern requires no WebSockets, no SSE, and no streaming infrastructure. It works on any hosting platform with a standard HTTP server.

---

## Search Stack

### Primary — Tavily

Tavily is an AI-native search API built specifically for language model pipelines. The free tier gives one thousand credits per month with no credit card required. The rate limit is five requests per second. The environment variable is TAVILY_API_KEY.

Tavily is used for all primary topic searches in Investigate mode and for all per-claim verification lookups in Audit mode. Every Tavily call must have a timeout of fifteen seconds. If the call exceeds that, return a timeout error rather than hanging indefinitely.

### Secondary — SearXNG Public Instances

SearXNG requires no API key and no authentication. It is used as a fallback when Tavily returns fewer than three results. Use the following five instances in order, moving to the next if one fails or returns an error: searx.be, searx.tiekoetter.com, searxng.org, search.bus-hit.me, and searx.fmac.xyz. Space requests at least one and a half seconds apart. Use exponential backoff — if an instance fails, wait two seconds before trying the next one, then four seconds before the next. Every SearXNG call must have a timeout of ten seconds.

### Tertiary — Hacker News API

Completely free, no authentication, no rate limits documented. Used to supplement results for technology, software, startup, or artificial intelligence topics via the Algolia-powered search endpoint at hn.algolia.com. Timeout: eight seconds.

### Quaternary — Wikipedia API

Free, no authentication. Returns authoritative summaries for named entities, historical events, and definitions. Used during verification to establish a factual baseline. Timeout: eight seconds.

### Virlo API — Audit Mode Only

Virlo provides factuality scores and related fact checks for articles. The API is REST-based, free tier, no approval required. Sign up at virlo.ai/for-developers. In Audit mode, after extracting the article text, send the article URL to Virlo's fact-check endpoint. Append the returned factuality score and any related fact-check references to the audit report as a secondary badge. The environment variable is VIRLO_API_KEY. If Virlo fails or times out, the audit report still shows — just without the Virlo badge. Timeout: ten seconds.

### Always Available — Pre-loaded Demo Files

A set of pre-written signal files covering three scenarios is bundled in the repository under the demo-data folder. Activated by a demo parameter in the URL. During a hackathon presentation, these files ensure the demo never breaks due to API slowness or rate limits.

---

## Language Model Stack

### Primary — Groq

Free tier, thirty requests per minute, no credit card required. Model: llama-3.3-70b-versatile for quality. Fallback model: llama-3.1-8b-instant for speed. Environment variable: GROQ_API_KEY. Timeout: fifteen seconds on every call.

### Secondary — Gemini Flash

Google AI Studio, free, fifteen hundred requests per day, personal Gmail account only. Model: gemini-2.0-flash. Environment variable: GEMINI_API_KEY. Timeout: fifteen seconds.

### Always Available — Pre-written Demo Responses

Pre-written LLM outputs bundled in the demo-data folder. Activate automatically if both Groq and Gemini fail or time out. The app never shows a broken screen during a demo.

---

## Module Descriptions

### Signal Fetcher

Takes a query string. Returns a list of raw sources. Queries Tavily first. Supplements with SearXNG if results are fewer than three. Appends Hacker News results for technology topics. Deduplicates by URL. Returns at most twenty items. Enforces a fifteen-second timeout on each API call.

### Source Aggregator

Takes the raw source list. Returns a ranked, deduplicated shortlist. Removes near-duplicate entries using fuzzy string matching on titles and snippets. Scores each source by relevance using term frequency analysis. Sources from known authoritative domains receive a bonus score. Returns the top ten sources sorted by relevance.

### Claim Extractor — Audit Mode Only

Takes article text. Returns a list of individual factual claims capped at fifteen. Sends text to Groq with a prompt that classifies each sentence as a fact, an opinion, or contextual background. Only factual sentences pass through. If the article contains more than fifteen factual claims, the UI shows a notice that only the first fifteen were verified due to rate limits.

### Verification Engine

Takes a single claim. Returns a verdict object that includes the verdict itself (supported, unsupported, or disputed), the exact search query that was used, the top two or three source snippets that were returned, and a one-sentence explanation of why the verdict was reached. This reasoning data is stored in the trace and displayed in the trace modal.

Domain independence rule: a claim is counted as supported only if at least two sources from different root domains confirm it. Two results from the same root domain count as one source, regardless of how different their full URLs are. For example, bbc.com/news/article-1 and bbc.com/news/article-2 count as one source from bbc.com.

### Confidence Scorer

Takes the claims list, verification results, and source list. Returns an integer between zero and one hundred. Never calls the language model. Always deterministic — same inputs produce same output.

Verification ratio: count claims where at least two unique root domains confirm the claim, then divide by total claims. Weight: sixty percent.

Diversity score: count unique root domains across all sources, divide by total sources. Weight: twenty-five percent.

Authority score: count sources from the authority list (reuters.com, bbc.com, apnews.com, theguardian.com, nytimes.com, wsj.com, nature.com, arxiv.org, wikipedia.org, and any dot-gov domain), divide by total sources. Weight: fifteen percent.

### Narrative Generator — Investigate Mode Only

Takes ranked sources and verification results. Builds a context block from the top five sources. Sends it to Groq with a prompt to write an article including a headline, a two-sentence summary, and a body with inline citation markers. Maps citation markers back to source URLs. Timeout: fifteen seconds.

### Trace Builder

Records the name, label, status, result summary, duration in milliseconds, and for verification steps the full reasoning object (query, snippets, one-line explanation) for every module call. Stores the trace in memory keyed by run identifier. The status endpoint reads from this in-memory store and returns the current trace state on every poll.

---

## Run State Machine

Each pipeline run passes through these states in order. The status endpoint returns the current state on every poll.

The run starts in a created state the moment the start endpoint returns a run identifier. Signal Search is the first step to enter the active state. When it completes it transitions to complete and Clustering Sources becomes active. This continues through Verifying Claims and Writing Story. When Writing Story completes, the entire run enters a finished state. The full output is available in the status response at this point.

If any step fails, it enters a failed state with an error message, and the run enters a failed state. The status response includes the specific error type and message so the frontend can show the correct error screen.

---

## Output Schema

Every finished run returns one object with this shape regardless of mode. The mode field is either investigate or audit. The content field is the full article text for Investigate mode or null for Audit mode. Headline and summary are strings for Investigate mode and null for Audit mode. Sources is an array of objects each with url, title, domain, snippet, and relevance score. Confidence is an integer. Issues is an array of objects each with type, claim, explanation, and optionally source-a and source-b for contradictions. Virlo score is an integer or null. The trace object contains the run identifier, mode, query, start timestamp, total duration, model used, and an array of step objects each with step number, name, label, status, result summary, duration, and an optional reasoning object.

---

## Deployment

Backend: FastAPI deployed to Railway free tier. Frontend: Next.js deployed to Vercel free tier. No Docker required. The backend URL is passed to the frontend through the NEXT_PUBLIC_API_URL environment variable.

---

## Environment Variables

TAVILY_API_KEY is required. Comes from tavily.com. GROQ_API_KEY is required. Comes from console.groq.com. VIRLO_API_KEY is required for the Virlo badge. Comes from virlo.ai/for-developers. GEMINI_API_KEY is optional fallback. Comes from aistudio.google.com. DEMO_MODE defaults to false, set to true for presentations. NEXT_PUBLIC_API_URL points the frontend to the deployed backend.

---

## Timeout Rules

Every external API call has a maximum timeout. Tavily calls: fifteen seconds. Groq calls: fifteen seconds. Gemini calls: fifteen seconds. SearXNG calls: ten seconds. Virlo calls: ten seconds. Hacker News calls: eight seconds. Wikipedia calls: eight seconds. If any call exceeds its timeout, it returns a specific error to the trace builder rather than hanging. The error message names which service timed out.

---

## Free Tier Usage Budget Per Run

Each investigation run uses eight to twelve Tavily credits and three to five Groq requests. Each audit run uses five to fifteen Tavily credits and four to eight Groq requests. One additional Virlo call per audit run. Hacker News, Wikipedia, and SearXNG are always free. With one thousand monthly Tavily credits, the free tier supports approximately eighty to one hundred full runs per month.