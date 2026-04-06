# Goal

Build an Autonomous Newsroom with two modes that journalists, researchers, and curious readers can use to investigate topics and verify articles.

---

## Mode 1 — Investigate

The user types a topic. The system searches the web, clusters the sources, verifies the key claims, and writes a full news story with citations. The user watches the pipeline run step by step in real time before reading the finished article. Each step updates on screen as it completes — not after everything finishes.

## Mode 2 — Audit

The user pastes article text or a URL. The system extracts every factual claim, searches for supporting or contradicting evidence, and returns a structured verification report broken into four sections: unsupported claims, missing context, contradictions between sources, and verified claims. The report also includes a Virlo factuality score as a secondary signal.

---

## What Makes This Different

Most AI journalism tools search and summarize. This one shows its work. Every search query used, every snippet retrieved, every verdict reached, and every decision the pipeline made is visible through a full reasoning trace. The core pitch is: "AI journalism that shows its work."

---

## Success Criteria

- The UI is clean and step-based. One screen serves one purpose. No clutter.
- The investigation pipeline updates live as each step completes. The frontend polls the backend every five hundred milliseconds and shows real step status, real result counts, and real timing — not fake delays or a single spinner.
- The audit produces structured output. Four labeled sections, not a wall of text.
- A reasoning trace exists for both modes. The trace shows per-claim reasoning: the exact search query used, the top snippets returned, and a one-line explanation of why the verdict was reached.
- Error screens explain specifically what failed, naming the query or domain that caused the problem.
- The confidence score is calculated from a real formula using domain grouping, not a guess from the language model.
- The Virlo factuality score appears in Audit reports as a secondary badge.
- The app deploys to a public URL that loads in under three seconds on first visit.

---

## Confidence Score Formula

The score is computed locally by the application, never estimated by the language model. It combines three weighted factors.

The first factor is the verification ratio: how many claims were confirmed by at least two independent sources. Independence is defined by root domain — two results from the same domain count as one source, regardless of how different their URLs look. This factor accounts for sixty percent of the score.

The second factor is source diversity: the number of unique root domains divided by the total number of sources used. This accounts for twenty-five percent.

The third factor is authority: how many sources come from known reputable outlets such as major news organizations, academic journals, or government domains. This accounts for fifteen percent.

The final score is displayed as a whole number between zero and one hundred. Decimals are never shown. The color of the score changes: yellow for seventy-five and above, orange for fifty to seventy-four, and red for below fifty.

---

## Non-Goals

- No chatbot interface
- No generic dashboards with charts and widgets
- No over-engineered backend split into multiple services
- No true real-time streaming of LLM tokens — the pipeline runs sequentially on the backend and the frontend polls for status
- No paid API keys required to run the demo
- No named entity extraction or secondary search passes — that is a version two feature