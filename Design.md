# Design

## Philosophy

One screen. One purpose. No clutter. The complexity lives in the pipeline, not the interface. Every screen answers a single question for the user and contains at most two primary actions. If a screen asks the user to do more than two things, something is wrong with the design.

---

## Design System Enforcement — Do This First Before Any Screen

Before building any screen, set up the design system as a Tailwind configuration file and a global CSS file. The Tailwind config must define custom colors for every surface and accent value in this document. It must restrict font sizes to exactly the six allowed values. It must restrict font weights to the three allowed values. It must restrict spacing to the allowed scale. This is not optional polish — it is the first thing to build because it makes every subsequent screen correct by default rather than requiring manual verification.

The global CSS file must set box-shadow to none on every element. It must remove all default borders. It must define the background, surface, modal, and text colors as CSS custom properties so they can be referenced consistently. Input fields are the only element allowed to receive a border, and that border must be one pixel solid hex 262626.

If these two files are configured correctly at the start, the design system cannot be accidentally violated — the Tailwind class names simply will not exist for values outside the allowed set.

---

## Colors

The page background is near-black at hex 0A0A0A. Cards and panels sit one level lighter at hex 141414. Modals and dropdowns sit one level above that at hex 1E1E1E. Elevation is communicated by this background color hierarchy and nothing else. No shadows. No borders between layers. No gradients.

The single accent color is yellow at hex FACC15. It appears on the primary action button, the confidence score, the logo dot, and the active pipeline step indicator. It does not appear anywhere else in the interface.

Primary text is hex FAFAFA. Secondary text for labels and metadata is hex A3A3A3. Muted text for timestamps and hints is hex 525252.

Error states use red at hex EF4444. Warning and low-confidence states use orange at hex F97316. Verified and high-confidence states use green at hex 22C55E.

Input fields have a one-pixel border in hex 262626. This is the only border used in the entire system.

---

## Typography

Interface font: Geist, falling back to system-ui. Article body font: Lora, falling back to Georgia. Trace and metadata font: Geist Mono.

Six allowed font sizes only: twelve pixels for timestamps and labels, fourteen pixels for body copy and secondary text, sixteen pixels as the default body size, twenty pixels for section headers, twenty-eight pixels for screen titles, and forty pixels for the confidence score display. No other sizes exist in the design system.

Three allowed font weights only: four hundred for body text, five hundred for labels and navigation, and six hundred for headings. Weight seven hundred is never used. Weight three hundred is never used.

Article body text uses Lora at eighteen pixels with a line height of one point eight. This is the only place where Lora appears and the only place where eighteen pixels appears. All other text uses Geist at one of the six allowed sizes.

---

## Spacing

Four-pixel base grid. Allowed values: four pixels for icon-to-label gaps, eight pixels for related inline elements, sixteen pixels for component internal padding, twenty-four pixels between elements in a section, thirty-two pixels between sections on a screen, and forty-eight pixels between major screen blocks. No other spacing values are used.

---

## Screens

### Entry Screen

The logo mark sits in the top-left corner: a small yellow dot beside the word OpenPress (or your chosen project name) in medium weight Geist. No navigation links. No other header content.

Below the header is a short headline in twenty-eight pixel Geist and a one-line subheading in fourteen pixel secondary text. The headline reads: **Investigate. Verify. Know.** The subheading reads: *AI journalism that shows its work.*

Below the subheading are two mode cards placed side by side on desktop and stacked on mobile. The Investigate card has a single text input and a yellow primary button. The Audit card has a textarea that accepts pasted text or a URL, and a yellow primary button.

#### Live Preview Section

Below the mode cards, show a collapsed example investigation to demonstrate value before the user submits a query. This is a static demonstration — not interactive — showing what the user will see after clicking Investigate.

The example includes:
- A topic pill (e.g., "EU AI ACT ENFORCEMENT 2026")
- Four step indicators with realistic result summaries and durations
- One expanded claim verification showing the search query, source snippets, and verdict explanation
- The confidence score and Virlo badge together

This preview builds trust instantly and reduces friction for first-time users.

#### Bottom CTA Section

Below the preview, add a short section titled **"Stop reading summaries. Read the reasoning."** with two buttons: Start investigating and Audit an article. These buttons mirror the primary CTAs from the mode cards above and provide an alternative entry point for users who have already scrolled past the cards.

### Investigation Screen

The top bar shows the user's topic on the left and a Cancel text link on the right. Cancel returns to Entry.

Below the top bar are four step indicators stacked vertically. Each has three states. Pending: an empty circle, the step name, and the word Waiting in muted text. Active: a yellow pulsing dot, the step name, and a short description of what is happening. Complete: a checkmark, the step name, and the real result summary with real timing — for example, fourteen sources found and two point one seconds. The timing shown is the actual duration from the backend, not a made-up number.

The four steps are Signal Search, Clustering Sources, Verifying Claims, and Writing Story. Each step's state updates when the frontend polls and receives a new status from the backend. When all four steps show complete, the app waits six hundred milliseconds then navigates to the Story screen.

### Story Screen

The top bar has a back link on the left and the confidence badge on the right. The confidence score is yellow for seventy-five and above, orange for fifty to seventy-four, and red for below fifty.

The article shows the headline in bold Geist at twenty-eight pixels, then a two-to-three sentence summary in fourteen pixel secondary text, then a horizontal rule, then the body in Lora at eighteen pixels. Inline citation markers appear as superscript numbers.

A fixed action bar at the bottom has exactly two buttons: View Sources and View Trace.

### Audit Screen

The top bar shows a truncated version of the article identifier on the left and a Re-audit ghost button on the right.

The confidence score appears at the top as a large forty-pixel number in the appropriate color. Below it is a label and a description of how many claims were checked across how many sources. Below that, if a Virlo factuality score is available, it appears as a secondary badge with the label Virlo Score and the integer value.

Four labeled sections follow. Unsupported Claims with a red indicator. Missing Context with an orange indicator. Contradictions with a yellow indicator. Verified Claims with a green indicator. Sections with no findings show the text No issues found in muted gray. They are never hidden entirely — showing that a section was checked is as important as showing findings.

A View Trace button at the bottom opens the trace modal.

### Trace Modal

The trace modal is the same component used in both Story screen and Audit screen. It accepts a trace object and renders each step as a row. Each row shows the step name, the result summary, and the duration. For verification steps, each row expands to show the exact search query used, the top two or three source snippets returned with their domain names, and the one-line reasoning for the verdict. This is the evidence that the system showed its work.

An Export JSON button at the bottom copies the raw trace data to the clipboard.

### Error Screens

Error screens replace the entire page. Never shown as toasts or banners.

The layout is a centered yellow icon, a specific headline, a specific explanation, and two actions. The headline always names the specific failure. For example: No sources found for quantum computing grants. Or: Could not fetch article from nytimes.com.

The explanation has three parts: what happened, why it likely happened, and what the user can do.

The primary action is a yellow button labeled Try Again that returns to Entry with the user's previous input preserved. The secondary action is a text link labeled Go Back that clears inputs.

The six error types with their headlines:

No sources found for the query: headline names the exact query. Tavily search credits exhausted: mentions that the limit was reached and suggests using demo mode. Story or report generation failed because the model was unavailable: names the service. Article URL could not be fetched: names the domain. No verifiable claims found in the article: explains what that means. Article text could not be extracted because the page is paywalled or bot-blocked: suggests pasting the text directly.

---

## Animation

The only animation in the app is the step indicator pulse on the Investigation screen. While a step is active, its yellow dot pulses between full opacity and forty percent opacity on a one-point-two-second loop. No other animations exist anywhere. No entrance animations, no hover movement, no exit transitions.

---

## Modals

Dark translucent overlay behind an elevated surface panel. Maximum width six hundred forty pixels. Thirty-two pixels of internal padding. Twelve-pixel border radius. Closed by clicking the X button or the overlay. Only one modal open at a time. No nested modals.

---

## Responsive Behavior

Desktop wider than one thousand twenty-four pixels: Entry screen shows two mode cards side by side. Tablet and mobile: cards stack vertically. Font sizes do not change between breakpoints. Only layout and column structure change.


**Reference screenshot:** `./docs/screenshots/entry-screen.png`