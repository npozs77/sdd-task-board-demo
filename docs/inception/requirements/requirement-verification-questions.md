# Requirements Clarification Questions
## SDD Task Board — Kanban Demo Application

Please answer each question by filling in the letter choice after the `[Answer]:` tag.
If none of the provided options match your needs, choose the last option (Other) and describe your preference.

---

## Question 1
What is the technology stack for this application?

A) Vanilla HTML/CSS/JavaScript — zero dependencies, open in browser

B) React/Vite — modern toolchain, component-based

C) Svelte — minimal framework overhead, good DX

D) Other (please describe after [Answer]: tag below)

[Answer]: A — The demo must prove methodology value without framework noise. Zero deps means open-and-run, nothing to install.

---

## Question 2
How should data persistence work?

A) localStorage — browser-native, no server, instant read/write

B) IndexedDB — more storage, async API, structured queries

C) Server-side (REST API) — real backend, database persistence

D) Other (please describe after [Answer]: tag below)

[Answer]: A — Simplest model that demonstrates real persistence. No async complexity, no server setup. Sufficient for demo scale (≤ 50 tasks).

---

## Question 3
What level of accessibility compliance is required?

A) None — demo only, no a11y requirements

B) WCAG 2.1 A — basic keyboard and screen reader support

C) WCAG 2.1 AA — full keyboard nav, ARIA labels, contrast, focus management

D) WCAG 2.1 AAA — comprehensive including cognitive accessibility

[Answer]: C — The demo itself should demonstrate quality practices. Accessibility built-in, not bolted-on. Shows SDD produces production-grade output.

---

## Question 4
What board structure should the application support?

A) Fixed 3 columns (To Do, In Progress, Done) — classic Kanban

B) Configurable columns — user can add/rename/remove columns

C) Swimlanes — columns + horizontal grouping (by project, priority, etc.)

D) Other (please describe after [Answer]: tag below)

[Answer]: A — Fixed structure keeps demo focused on task management, not board configuration. Column management would triple complexity without demonstrating additional SDD value.

---

## Question 5
How should task movement work?

A) Drag-and-drop only — natural, visual interaction

B) Drag-and-drop + keyboard shortcuts — accessible, two interaction modes

C) Buttons only (← →) — simplest implementation, no DnD complexity

D) Other (please describe after [Answer]: tag below)

[Answer]: B — Drag-and-drop for discoverability, keyboard shortcuts for accessibility (NFR-2). Both modes give full functionality.

---

## Question 6
What about mobile/responsive support?

A) Desktop only — demo is viewed on development machines

B) Responsive — adapts layout to tablet and mobile viewports

C) Separate mobile UI — different interaction patterns for touch

D) Other (please describe after [Answer]: tag below)

[Answer]: B — Responsive via CSS Grid breakpoints. Same app, same code, layout adapts. No separate mobile build.

---

## Question 7
Should the application include undo/redo functionality?

A) No undo — delete is permanent, simplicity over safety

B) Single-level undo — can reverse last action

C) Full undo/redo stack — arbitrary depth

D) Other (please describe after [Answer]: tag below)

[Answer]: A — Simplicity principle. Delete confirmation (BR-5) provides the safety net. Undo stack doubles state complexity without demonstrating additional methodology value.

---

## Question 8
What's the target browser support?

A) Latest Chrome only — simplest, for demo/dev use

B) Latest versions of Chrome, Firefox, Safari, Edge — modern evergreen browsers

C) Include IE11 / legacy Edge — enterprise compatibility

D) Other (please describe after [Answer]: tag below)

[Answer]: B — Modern evergreen browsers. ES2020+ features available without polyfills. No IE11 (dead browser, no value in supporting).

---

## Question 9
Should the demo include automated tests?

A) No tests — demo is the code, not the test suite

B) Unit tests only — verify business logic in the data store

C) Unit tests + property-based tests — verify invariants hold for any input

D) Unit + integration + E2E — full test pyramid

[Answer]: C — Unit tests organized by requirement ID demonstrate traceability into tests. Property-based tests demonstrate SDD's approach to invariant verification. E2E is overkill for a static demo.

---

## Question 10
What maturity level should this demo target?

A) PoC — minimum artifacts, prove the concept

B) MVP — full artifact set (HLD, user stories, components, operations docs)

C) Production — comprehensive including deployment automation, monitoring

D) Other (please describe after [Answer]: tag below)

[Answer]: B — MVP shows real value. Full artifact set demonstrates what SDD produces at a level that would be credible for a real project. PoC would look thin. Production is overkill for a demo.
