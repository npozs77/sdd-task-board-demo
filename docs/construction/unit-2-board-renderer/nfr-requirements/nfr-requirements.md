# NFR Requirements — Unit 2: Board Renderer

## Performance

| ID | Requirement |
|---|---|
| PERF-2.1 | Full board re-render for 50 tasks shall complete in under 5ms (single DocumentFragment write) |
| PERF-2.2 | Render must cause exactly 1 browser reflow per call (batch via fragment, single innerHTML clear + append) |
| PERF-2.3 | No layout thrashing during render — all reads (getBoundingClientRect) before writes (appendChild) |

## Accessibility

| ID | Requirement |
|---|---|
| A11Y-2.1 | Board must have `role="region"` with `aria-label="Task Board"` — screen reader landmark |
| A11Y-2.2 | Each column must use `<section>` with `aria-label` matching display name |
| A11Y-2.3 | Task list must use `role="list"`, cards must use `role="listitem"` — count announced |
| A11Y-2.4 | All task cards must have `tabindex="0"` — keyboard-focusable in DOM order |
| A11Y-2.5 | All buttons must have `aria-label` that includes the task title — distinguishable per card |
| A11Y-2.6 | Colour contrast must meet WCAG 2.1 AA: ≥ 4.5:1 for normal text, ≥ 3:1 for large text |
| A11Y-2.7 | Focus indicator must be visible on all interactive elements via `:focus-visible` |

## Responsiveness

| ID | Requirement |
|---|---|
| RES-2.1 | Layout must adapt at ≥ 960px (3 columns), 640–959px (3 columns tighter), < 640px (single stacked column) |
| RES-2.2 | No horizontal scrollbar at any viewport width (board fills available space) |
| RES-2.3 | Touch targets (buttons) must be ≥ 44×44px on mobile breakpoint |

## Correctness

| ID | Requirement |
|---|---|
| COR-2.1 | Render output must match Store state exactly — no stale DOM after change event |
| COR-2.2 | Cards without description must not render an empty `<p>` element (skip entirely) |
| COR-2.3 | Cards with falsy title (corrupted data) must render `"[Untitled]"` — not empty or `"undefined"` |
| COR-2.4 | `data-task-id` attribute must be set on cards AND action buttons — Controller depends on it |

## Maintainability

| ID | Requirement |
|---|---|
| MTN-2.1 | All styling via CSS custom properties — theme change requires only `:root` updates |
| MTN-2.2 | No inline styles in JavaScript (all visual through CSS classes) |
| MTN-2.3 | Column configuration (id, name, cssClass) must be a single constant — adding a column = one array entry |
