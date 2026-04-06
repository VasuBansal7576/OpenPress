# Execution Plan

## Rules

Do not skip steps. Each step ends in a working, deployable state. Do not redesign a previous screen unless the current step explicitly says to. Build shared components once and reuse them — never rebuild. Use demo data until Step 5, then wire real APIs. Test every error state manually by breaking inputs on purpose. Never call a step done until it matches the design in design.md exactly.

---

## Step 0 — Design System Setup (Do This Before Anything Else)

Before writing any screen or component, create two files.

The first is the Tailwind configuration. It must define custom color tokens for all surfaces and accent values from design.md. It must restrict font sizes to exactly twelve, fourteen, sixteen, twenty, twenty-eight, and forty pixels. It must restrict font weights to four hundred, five hundred, and six hundred. It must restrict spacing to four, eight, sixteen, twenty-four, thirty-two, and forty-eight pixels.

The second is the global CSS file. It must set box-shadow to none universally. It must remove all default borders. It must define the six color values as CSS custom properties. It must restrict borders to input fields only.

This step is complete when the Tailwind config compiles and the global CSS loads without errors. No screens yet.

---

## Step 1 — Entry Screen

Build the entry screen with no backend connection.

The page uses the design system defined in Step 0. The top-left shows a yellow dot beside the word Newsroom. A short headline and subheading sit below. Two mode cards sit side by side on desktop and stack on mobile. The Investigate card has a text input and a yellow primary button. The Audit card has a textarea and a yellow primary button. Clicking either button navigates to a static placeholder screen.

Nothing else is on this page. No navigation, no settings, no footer, no extra copy.

---

## Step 2 — Investigation Screen (Static Layout)

Build the pipeline screen with no API calls and no animation.

The top bar shows a hardcoded topic on the left and a Cancel text link on the right. Four step indicators appear in a vertical list, all in the pending state: empty circle, step name, Waiting in muted text. Cancel navigates back to Entry.

The goal here is the layout and the step component with its three visual states clearly defined: pending, active, and complete.

---

## Step 3 — Polling Infrastructure and Live Step Animation

This is the most important step. Build the backend polling pattern and wire it to the frontend.

On the backend: create the start endpoint for Investigate mode that accepts a topic and immediately returns a run identifier. Create the status endpoint that accepts a run identifier and returns the current trace object with step statuses. For now, simulate the pipeline by advancing steps on a timer so you can test the polling without real API calls. Each step goes active then complete in sequence with hardcoded result summaries and durations.

On the frontend: immediately after the start endpoint returns a run identifier, begin polling the status endpoint every five hundred milliseconds. Each poll response updates the step indicators. When all steps show complete status, wait six hundred milliseconds and navigate to a placeholder Story screen. Display real result summaries and durations from the status response, not hardcoded strings.

This step is complete when a user submits a topic on Entry, watches the four steps update one by one with real data from the polling responses, and arrives at the placeholder Story screen. If this works correctly with simulated data, adding real API calls in Step 5 requires only replacing the simulation with actual calls.

---

## Step 4 — Story Screen, Audit Screen, and Shared Modals

Build the story reading experience and the audit report screen using hardcoded mock data.

Story screen: top bar with back link and confidence badge using correct colors per design.md. Article area with headline in twenty-eight pixel Geist bold, summary in fourteen pixel secondary text, horizontal rule, body in Lora at eighteen pixels with inline citation markers as superscript numbers. Fixed action bar with View Sources and View Trace buttons.

Build the TraceModal component. It renders each pipeline step as a row with step name, result summary, and duration. For verification steps, it renders an expandable section showing the search query, the top source snippets with domain names, and the one-line reasoning. An Export JSON button copies the raw trace data. This component is used by both Story screen and Audit screen without modification.

Build the SourcesModal component. It renders a numbered list with title, domain, and a relevance indicator. This component is used by both modes without modification.

Build the ConfidenceBadge component with correct color logic.

Build the Audit screen using hardcoded mock data with all four labeled sections, the confidence badge, the Virlo score badge as a placeholder, and the View Trace button.

---

## Step 5 — Real APIs for Investigate Mode

Replace the simulated pipeline with real API calls.

The start endpoint kicks off a real background task. The task runs Signal Fetcher (Tavily, SearXNG fallback across five instances with exponential backoff, Hacker News for tech topics), then Source Aggregator (fuzzy dedup, TF-IDF ranking), then Verification Engine (Tavily per claim, domain grouping logic, reasoning object per claim including query, snippets, and one-line explanation), then Narrative Generator (Groq with top five sources as context, fifteen-second timeout), then Confidence Scorer (verification ratio using domain independence rule, diversity score, authority score), then Trace Builder (records everything). Every external call has its timeout enforced.

The status endpoint reads from the in-memory run store and returns the current state. The frontend does not change — it was already polling.

Test with a real topic. Verify that step timings in the UI match real API call durations. Verify the trace modal shows actual queries, actual snippets, and actual reasoning. If the reasoning is empty or generic, the trace is wrong.

---

## Step 6 — Real APIs for Audit Mode and Virlo Integration

Build the full Audit pipeline.

The start endpoint for Audit accepts text or URL. If a URL is provided, fetch and extract the article text with a ten-second timeout. If extraction fails, return the URL-unreachable error immediately.

The pipeline: Claim Extractor (Groq, JSON output, fifteen claims max). For each claim: Verification Engine (same as Investigate mode, with domain grouping and reasoning object). Then: Virlo API call with the article URL, ten-second timeout, fail silently if unavailable. Then: Confidence Scorer. Then: Report Generator which organizes issues into the four sections. Then: Trace Builder.

The Audit screen should now show real data. Verify that the Virlo badge appears when a URL was provided. Verify that empty sections show No issues found rather than disappearing. Verify the trace modal shows per-claim reasoning.

---

## Step 7 — Error States

Build and test all six error screens.

Error screens replace the entire page. Each must name the specific failure in the headline using the actual query or domain. Test each one by deliberately breaking inputs:

Test no-sources by submitting a random nonsense string as a topic. Test credits-exhausted by invalidating the Tavily key. Test model-unavailable by invalidating the Groq key. Test URL-unreachable by submitting a known-404 URL. Test no-verifiable-claims by auditing a short poem. Test paywall-blocked by auditing a known-paywalled URL.

Every error screen must show a Try Again button that returns to Entry with the previous input preserved, and a Go Back link that clears inputs.

---

## Step 8 — Deployment and Demo Mode

Deploy the full app.

Backend to Railway: add all five environment variables (TAVILY_API_KEY, GROQ_API_KEY, VIRLO_API_KEY, GEMINI_API_KEY, DEMO_MODE). Frontend to Vercel: add NEXT_PUBLIC_API_URL pointing to the Railway backend URL.

Verify demo mode works by adding the demo parameter to the URL. In demo mode, the app uses pre-loaded files from the demo-data folder and makes no real API calls. This is what you use during the hackathon presentation.

Verify the live URL loads in under three seconds on a cold start. If it does not, optimize the backend startup or switch to Render which has better cold start performance on free tier.

Update the README with the live URL, a five-command local setup guide, and a screenshot of each screen.

---

## Shared Component Summary

| Component | Used in | Rule |
|---|---|---|
| TraceModal | Story screen, Audit screen | Same component, no forks |
| SourcesModal | Story screen, Audit screen | Same component, no forks |
| ConfidenceBadge | Story top bar, Audit top section | Same component, no forks |
| ErrorScreen | All modes | Parameterized by error type |
| StepIndicator | Investigation screen only | Three states: pending, active, complete |