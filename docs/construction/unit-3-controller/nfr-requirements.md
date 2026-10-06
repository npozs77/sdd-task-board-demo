# NFR Requirements — Unit 3: Interaction Controller + App Entry

## Performance

| ID | Requirement |
|---|---|
| PERF-3.1 | Event delegation: maximum 7 listeners on root — not N listeners per card |
| PERF-3.2 | Drag feedback (class toggle) must not trigger layout recalculation — use transform/opacity only |
| PERF-3.3 | Drop position calculation must iterate cards once (O(n)) — no nested loops |

## Accessibility

| ID | Requirement |
|---|---|
| A11Y-3.1 | All board operations must be achievable via keyboard: create (button), edit (Enter), delete (Delete/Backspace), move (Ctrl+Arrows) |
| A11Y-3.2 | Delete confirmation must use `role="alertdialog"` with `aria-labelledby` and `aria-describedby` |
| A11Y-3.3 | Form modals must use `role="dialog"` with `aria-labelledby` pointing to title |
| A11Y-3.4 | Opening modal must move focus to first input — closing must return focus to trigger |
| A11Y-3.5 | Escape key must close any open modal/dialog |
| A11Y-3.6 | Keyboard move at boundary (leftmost/rightmost column, top/bottom of column) must be a no-op — no error, no focus loss |

## Reliability

| ID | Requirement |
|---|---|
| REL-3.1 | Store errors during drag must not leave visual artifacts — `_cleanup()` must run regardless of success/failure |
| REL-3.2 | Edit/delete of a task deleted in another tab must not crash — early return if task not found |
| REL-3.3 | Modal submit failure (Store throws) must not close modal — user retains their input |
| REL-3.4 | Event handlers must not throw unhandled exceptions — wrap Store calls in try/catch at boundaries |

## Usability

| ID | Requirement |
|---|---|
| UXR-3.1 | Drag visual feedback must be immediate (< 16ms from dragstart to class application) |
| UXR-3.2 | Drop zones must highlight only the column currently under cursor — not all columns |
| UXR-3.3 | Action buttons (Edit, Delete) must be hidden by default, visible on hover/focus — clean card appearance |
| UXR-3.4 | On mobile (< 640px) action buttons must always be visible (no hover on touch devices) |
| UXR-3.5 | Confirmation dialog default focus must be Cancel (not Delete) — safe default for destructive action |
| UXR-3.6 | Form validation must show error inline (red border) — not an alert() or page navigation |

## Testability

| ID | Requirement |
|---|---|
| TST-3.1 | Controller must be instantiable with a mock root element and mock store for unit testing |
| TST-3.2 | Modal creation must append to `document.body` (not root) — testable in isolation from board DOM |
| TST-3.3 | All event handlers must be testable by dispatching synthetic events on root |
