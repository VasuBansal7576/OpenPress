# Evaluate

This is the final checklist to run before submission. Every item here is something a judge will either test, observe, or ask about. If any item fails, fix it before submitting. Do not submit with an open item.

---

## Pipeline and Live Updates

The user types a topic and clicks Investigate. The Investigation screen appears immediately — not after a delay. The four step indicators update one by one as the backend completes each step. Each completed step shows the real result count and real duration from the backend, not hardcoded strings. The story appears automatically after all steps complete without the user clicking anything.

Test this with a topic that takes a real ten-second pipeline run. The steps must update during those ten seconds, not after.

---

## Reasoning Trace

Open the trace modal from the Story screen after a real investigation run. Every verification step must show the exact search query that was sent to Tavily. It must show the top two or three source snippets with their domain names. It must show a one-line explanation of why the verdict was reached. If the trace only shows step names and durations, it is wrong.

Open the trace modal from the Audit screen after a real audit run. Same requirement — per-claim queries, snippets, and reasoning must be visible.

---

## Confidence Score

After a real run, check that the confidence score is a whole number between zero and one hundred with no decimal point. Check that it changes color correctly: yellow at seventy-five and above, orange at fifty to seventy-four, red at below fifty. Verify internally that the score was computed using domain grouping — a claim confirmed only by two URLs from the same domain should not count as two independent confirmations.

---

## Virlo Badge

Run an audit on an article by pasting a public URL. The report must include a Virlo factuality score badge. If Virlo is unavailable, the report must still appear without the badge and without an error.

---

## Audit Report Structure

The four sections must always appear: Unsupported Claims, Missing Context, Contradictions, and Verified Claims. Sections with no findings must show the text No issues found in muted gray. They must never disappear entirely. If an article has more than fifteen claims, the UI must show a notice that only the first fifteen were verified.

---

## Error Screens

Test each of the six error states by breaking inputs:

Submit the string asdfghjkl as a topic. The no-sources error screen must appear with the exact query in the headline.

Invalidate the Tavily API key and submit a real topic. The credits-exhausted or API-failure error must appear with a specific explanation.

Submit a URL that returns a 404. The URL-unreachable error must appear with the domain name in the headline.

Audit a short poem with no factual claims. The no-verifiable-claims error must appear.

Audit a known-paywalled URL. The paywall-blocked error must appear with a suggestion to paste the text directly.

All error screens must have a Try Again button that preserves the previous input and a Go Back link that clears it.

---

## Design Verification

Open the app and check each of the following visually:

No card has a visible border. The only borders in the app are on input fields, one pixel solid hex 262626.

No element has a box shadow. If any shadow is visible, it is a violation.

The font on the article body is visibly different from the interface font — it must be a serif face, not Geist.

The confidence score is the largest number on its screen at forty pixels. No other number on any screen is forty pixels.

The only yellow elements are the primary button, the confidence score, the logo dot, and the active step indicator. No other element uses yellow.

There are no hover animations, entrance animations, or exit transitions anywhere. The only animation is the step indicator pulse on the Investigation screen.

---

## Performance

Load the live URL from a cold start and measure the time to first meaningful paint. It must be under three seconds. If it is not, the backend is either slow to wake up or the frontend bundle is too large.

---

## Demo Mode

Add the demo parameter to the URL. The app must load and complete a full investigation or audit run using pre-loaded files with no real API calls. If demo mode fails, you have no fallback during the presentation.

---

## Final Score Prediction

If all items above pass, the submission beats roughly ninety-five percent of hackathon entries because it delivers:

A non-chatbot UI that is genuinely clean and step-based. Live pipeline updates with real timing data. A reasoning trace that shows per-claim evidence, not just metadata. A confidence score that is deterministic and domain-aware. A Virlo integration that other entrants likely missed. Specific, interpolated error messages. A working fallback for live demos. A deployed live URL.

The idea is strong. The plan is airtight. The execution checklist is complete. Go build it.