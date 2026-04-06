# AGENTS.md

Read this file at the start of every session before reading anything else. Follow every rule here exactly. Do not invent alternatives.

---

## What This Project Is

An Autonomous Newsroom with two modes. Investigate mode takes a topic and produces a sourced news article with a full reasoning trace. Audit mode takes an article and produces a structured verification report with a confidence score and a Virlo factuality badge. The entire design philosophy is: one screen, one purpose, no clutter. The differentiator is: AI journalism that shows its work.

---

## Stack

Frontend: Next.js 14 with the App Router. No Pages Router. Styling: Tailwind CSS with a custom config that enforces the design system — no component library. Fonts: Geist for interface text, Lora for article body, Geist Mono for trace metadata.

Backend: FastAPI in Python. One file per module. No Docker. Deployed to Railway free tier.

---

## First Thing to Build — Design System Files

Before writing any screen, create the Tailwind config and global CSS file. The Tailwind config defines custom colors, font sizes restricted to twelve, fourteen, sixteen, twenty, twenty-eight, and forty pixels only, font weights restricted to four hundred, five hundred, and six hundred only, and spacing restricted to four, eight, sixteen, twenty-four, thirty-two, and forty-eight pixels only. The global CSS sets box-shadow to none on everything and removes all default borders. Input fields are the only element that may have a border, and it must be one pixel solid hex 262626. If these files are not created first, design violations will accumulate and require a rebuild.

---

## Design Rules — Non-Negotiable

Background colors: page is hex 0A0A0A, cards are hex 141414, modals are hex 1E1E1E. No other background values exist.

Accent color: yellow hex FACC15 only. Appears on primary button, confidence score, logo dot, and active step indicator. Nowhere else.

Text: primary is hex FAFAFA, secondary is hex A3A3A3, muted is hex 525252.

Status colors: error is hex EF4444, warning is hex F97316, success is hex 22C55E.

No box shadows. No gradients. No card borders. No section dividers. Elevation is background color layering only.

The only border in the system is one pixel solid hex 262626 on input fields.

Confidence badge color: yellow for seventy-five and above, orange hex F97316 for fifty to seventy-four, red hex EF4444 for below fifty.

Article body text only: Lora at eighteen pixels, line height one point eight.

Animation: only the step indicator pulse on the Investigation screen. Nothing else moves.

---

## API Architecture — Polling Pattern

The backend exposes four endpoints, not two.

First: POST /api/investigate/start. Accepts a topic string. Returns a run identifier immediately. Starts the pipeline as a background task. HTTP 202.

Second: GET /api/investigate/status/{run_id}. Returns the current trace object with each step's status (pending, active, complete, or failed), result summary, duration in milliseconds for completed steps, and reasoning data for verification steps. The frontend calls this every five hundred milliseconds.

Third: POST /api/audit/start. Accepts a text string and optional URL string. Returns a run identifier immediately. HTTP 202.

Fourth: GET /api/audit/status/{run_id}. Same polling pattern as investigate.

Do not implement a single blocking POST endpoint that returns after ten seconds. That will produce a hanging screen with no step updates, which violates the core UX requirement.

---

## Reasoning Trace Rules

Every verification step must record reasoning data, not just metadata. The reasoning object for each claim must include the exact query string that was sent to Tavily, the top two or three results returned with their title, domain, and snippet text, and a one-sentence explanation of why the verdict was reached. This data is stored in the trace and displayed in the trace modal under an expandable section per claim. Showing step duration and result counts is a performance log, not a reasoning trace. The trace must show why decisions were made.

---

## Domain Independence Rule for Confidence Score

A claim is counted as confirmed only if at least two sources from different root domains support it. Root domain means the registered domain without subdomains — so news.bbc.com and bbc.com/sport are both bbc.com. If only one root domain confirms a claim, it is marked as unsupported regardless of how many individual URLs are found. This rule is enforced in the Confidence Scorer, not in the Verification Engine. The Verification Engine collects all sources. The Confidence Scorer applies the domain grouping before computing the verification ratio.

---

## Virlo Integration Rules

In Audit mode, after extracting article text, call the Virlo API with the article URL. The API is at virlo.ai/for-developers, it is free tier, no approval required. Append the returned factuality score as a badge to the audit report. If Virlo fails or times out, continue without it — the report still shows. Timeout on the Virlo call: ten seconds. Environment variable: VIRLO_API_KEY.

---

## Timeout Rules

Every external API call must have a timeout. Tavily and Groq: fifteen seconds. Gemini and Virlo: ten seconds. SearXNG, Hacker News, Wikipedia: eight seconds. If a call exceeds its timeout, record it in the trace as a failed step with a specific error message naming the service. Never let an API call hang indefinitely.

---

## SearXNG Fallback Rules

Use five specific instances in this order: searx.be, searx.tiekoetter.com, searxng.org, search.bus-hit.me, and searx.fmac.xyz. If one fails, wait two seconds before trying the next. If that fails, wait four seconds before the next. This is exponential backoff. Space all SearXNG requests at least one and a half seconds apart.

---

## Claim Cap Display Rule

When an article has more than fifteen factual claims, the Claim Extractor processes only the first fifteen. The audit screen must show a notice that says only the first fifteen claims were verified due to rate limits. Do not silently drop claims.

---

## Shared Components

Build these four components once and reuse them without modification.

TraceModal accepts a trace object. Renders step list with expandable reasoning sections per claim. Used in Story screen and Audit screen.

SourcesModal accepts a sources array. Renders a numbered list with title, domain, and relevance. Used in Story screen and Audit screen.

ConfidenceBadge accepts a number. Renders in yellow, orange, or red based on the ranges defined above. Used in both top bars.

ErrorScreen accepts an error type, a headline string with interpolated variables (query name, domain name), an explanation string, a primary action label, and a secondary action label. Replaces the full page. Never a toast or banner.

---

## What Not To Do

Do not implement a single blocking POST endpoint. Use the polling pattern.

Do not show step duration and result counts and call it a reasoning trace. Include the query, snippets, and one-line why.

Do not count two sources from the same domain as two independent sources.

Do not skip the Virlo call in Audit mode.

Do not set a timeout longer than fifteen seconds on any external call.

Do not install shadcn, Radix, Chakra, Material UI, or any component library.

Do not use DuckDuckGo, Brave Search, Reddit API, or Ollama.

Do not add animations other than the step indicator pulse.

Do not use toast notifications. Errors replace the screen.

Do not invent features not described in goal.md and design.md.

Do not use font sizes, weights, spacing values, or colors not defined in the Tailwind config.

---

## Execution Order

Work from execution.md. Complete one step at a time. Do not start the next step until the current one is fully working and matches the design. When a step is done, name it and ask which step to do next. Do not proceed automatically.