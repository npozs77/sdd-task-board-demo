# Requirements — SDD Task Board

## Project Context

A Kanban-style task board that demonstrates SDD methodology outputs. Pure client-side application with localStorage persistence. No backend, no build tools, no external dependencies.

**Target users**: Developers and technical leads evaluating SDD Toolkit.
**Primary goal**: Demonstrate that even a "simple" app benefits from structured requirements → design → implementation.
**Secondary goal**: Serve as a reference implementation showing what SDD artifacts look like at MVP maturity.

---

## Functional Requirements

### FR-1: Board Structure

The application displays a Kanban board with exactly three columns arranged horizontally:

| Column | Display Name | Purpose |
|--------|-------------|---------|
| `todo` | To Do | Tasks not yet started |
| `in-progress` | In Progress | Tasks actively being worked on |
| `done` | Done | Completed tasks |

**Acceptance criteria**:
- All three columns are always visible (never hidden or collapsed)
- Each column displays a header with the column name and current task count
- Columns cannot be added, removed, renamed, or reordered by the user
- Empty columns show a visual placeholder indicating no tasks

**Rationale**: Fixed columns keep the demo focused on task management rather than board configuration. This matches the most common Kanban pattern.

---

### FR-2: Task Creation

Users can create new tasks through a dedicated "Add task" interface.

**Required fields**:
- Title (string, must not be empty after trimming whitespace)

**Optional fields**:
- Description (string, defaults to empty string if not provided)

**Behaviour**:
1. User clicks "Add task" button (located in the To Do column)
2. A modal dialog appears with title input field and optional description textarea
3. User enters title (required) and optionally a description
4. On submit: task is created in the "To Do" column at the bottom of the list
5. Modal closes, board updates to show the new task
6. On cancel: modal closes, no task created

**Validation**:
- Title field shows error state if submission attempted with empty/whitespace-only title
- No maximum length enforced (browser textarea limits apply naturally)
- Description is never validated (any content or empty is acceptable)

**Edge cases**:
- Submitting only whitespace → treated as empty, validation fails
- Pasting text with leading/trailing whitespace → trimmed on save
- Very long titles → rendered with CSS overflow handling (truncation with ellipsis or wrapping)

---

### FR-3: Task Movement Between Columns

Users can move tasks between any two columns using drag-and-drop.

**Drag-and-drop flow**:
1. User initiates drag on a task card (mousedown + move, or touch start + move)
2. Visual feedback: source card becomes semi-transparent, cursor changes to "grabbing"
3. As user drags over columns, the target column highlights to indicate valid drop zone
4. User drops the card on a target column
5. Task moves from source column to target column at the drop position
6. Both columns re-render to reflect the change
7. State is persisted immediately

**Drop position calculation**:
- If dropped above an existing card → inserts before that card
- If dropped below all cards or on empty area → appends to end of column
- If dropped on the same column → treated as a reorder (see FR-6)

**Constraints**:
- A task can move from any column to any other column (no workflow restrictions)
- A task can also move within the same column (reordering)
- Only one task can be dragged at a time (no multi-select drag)
- Drag cannot be initiated on action buttons (edit, delete) — only on the card body

---

### FR-4: Task Editing and Deletion

**Editing**:
1. User clicks "Edit" button on a task card
2. Modal appears pre-populated with current title and description
3. User modifies fields
4. On submit: task updates with new values, board re-renders
5. Same validation rules as FR-2 (title required, whitespace trimmed)

**Deletion**:
1. User clicks "Delete" button on a task card
2. Confirmation dialog appears: "Are you sure you want to delete '[task title]'? This cannot be undone."
3. On confirm: task is permanently removed, column re-renders
4. On cancel: dialog closes, no action taken

**Edge cases**:
- Editing a task that was deleted in another tab → error handled gracefully (task not found)
- Rapid double-click on delete → only one confirmation shown
- Editing while drag in progress → should not be possible (buttons hidden during drag)

---

### FR-5: Data Persistence

All board state persists to the browser's localStorage.

**Persistence behaviour**:
- **Save trigger**: Every state mutation (create, edit, move, delete, reorder) writes the full state to localStorage immediately
- **Load trigger**: On page load (DOMContentLoaded), state is read from localStorage
- **Storage key**: `sdd-task-board-state`
- **Storage format**: `JSON.stringify({ tasks: Task[] })`

**First-visit behaviour**:
- If the storage key does not exist → seed with sample data (see BR-4)
- Sample data provides an immediately interesting board for first-time visitors

**Data corruption handling**:
- If stored JSON fails to parse → log warning, treat as first visit, seed sample data
- If stored data parses but has unexpected shape → log warning, seed sample data
- App continues to function regardless of localStorage issues (graceful degradation)

**Storage limitations**:
- localStorage has a ~5MB limit per origin — with typical task data (<1KB per task), this supports ~5000 tasks, far exceeding expected use
- If localStorage.setItem() throws (quota exceeded, private mode) → log warning, continue operating in-memory only

---

### FR-6: Task Ordering Within Columns

Tasks within a column maintain a defined order. Users can reorder tasks within the same column.

**Ordering model**:
- Each task has an `order` field (integer, 0-based) within its column
- Tasks are always displayed sorted by `order` ascending
- When a task is added → assigned `order = length of column` (appears at bottom)
- When a task is moved to another column → assigned position based on drop location
- When a task is deleted → remaining tasks in that column have their `order` values normalized (no gaps)

**Reordering**:
- Drag-and-drop within the same column → recalculates order values
- Keyboard shortcut: Ctrl+Arrow Up/Down moves the focused task up/down within its column
- After reorder, all tasks in the column get sequential order values (0, 1, 2, ...)

---

### FR-7: Visual Feedback

The interface provides immediate visual feedback for all interactions.

**Drag feedback**:
- Dragged card: `opacity: 0.5`, slight rotation (2deg), elevated shadow
- Valid drop target column: highlighted border, visible drop-zone indicator
- Drop zone text: "Drop here" appears at the bottom of receiving columns

**State transitions**:
- Adding a task: new card appears immediately (no animation delay)
- Moving a task: card disappears from source, appears in target (instant, no slide animation to keep it simple)
- Deleting a task: card removed immediately after confirmation

**Empty states**:
- Empty column shows: "No tasks" in muted italic text
- This disappears as soon as a task is added or moved in

**Action visibility**:
- Edit/Delete buttons are hidden by default, appear on card hover or when card has focus
- On mobile (touch devices): buttons are always visible (no hover available)

---

## Non-Functional Requirements

### NFR-1: Zero External Dependencies

The application has zero runtime dependencies.

**What this means**:
- No `package.json` file in the demo app source
- No `node_modules/` directory
- No CDN links in HTML (no Bootstrap, no Tailwind, no jQuery, no icon libraries)
- No `<script>` tags pointing to external URLs
- No CSS `@import` from external URLs
- No `fetch()` calls to any API endpoint
- No build step required (no TypeScript compilation, no bundling, no minification)

**How to run**: Open `index.html` in a browser. That's it.

**Rationale**: Demonstrates that SDD methodology adds value regardless of tech complexity. The process is the point, not the framework choice.

---

### NFR-2: Accessibility (WCAG 2.1 AA)

The application meets WCAG 2.1 Level AA compliance.

**Semantic HTML**:
- Board uses `<main>` element
- Columns use `<section>` with `aria-label`
- Task lists use `role="list"` with `role="listitem"` on cards
- Task cards use `<article>` element
- Headings follow hierarchy: `<h1>` (app title) → `<h2>` (column names) → `<h3>` (task titles)
- Buttons are actual `<button>` elements (not styled divs)

**Keyboard navigation**:
- Tab: moves focus between task cards sequentially (left-to-right, top-to-bottom)
- Enter: opens edit modal for focused card
- Delete/Backspace: opens delete confirmation for focused card
- Ctrl+Arrow Left/Right: moves focused task to adjacent column
- Ctrl+Arrow Up/Down: reorders focused task within its column
- Escape: closes any open modal or dialog

**ARIA attributes**:
- All columns: `aria-label="[Column Name]"`
- All task cards: `aria-label="[Task Title]"`
- All buttons: `aria-label` with descriptive text (e.g., "Edit Review project requirements")
- Confirmation dialog: `role="alertdialog"` with `aria-labelledby` and `aria-describedby`
- Form modal: `role="dialog"` with `aria-labelledby`

**Focus management**:
- Opening a modal → focus moves to first interactive element
- Closing a modal → focus returns to trigger element
- After moving a task via keyboard → focus follows the card to its new position
- Focus indicators: visible on all interactive elements via `:focus-visible` (2px accent-coloured ring)

**Colour contrast**:
- Body text on background: #e6edf3 on #0d1117 = contrast ratio 13.5:1 (exceeds 4.5:1)
- Muted text on background: #8b949e on #0d1117 = contrast ratio 5.2:1 (exceeds 4.5:1)
- Accent on background: #58a6ff on #0d1117 = contrast ratio 5.8:1 (exceeds 4.5:1)

---

### NFR-3: Responsive Layout

The board adapts to all common viewport sizes.

**Breakpoints**:

| Viewport | Layout | Behaviour |
|----------|--------|-----------|
| ≥ 960px (desktop) | 3 columns side-by-side | Full horizontal board |
| 640–959px (tablet) | 3 columns, reduced gap/padding | Columns narrower but still visible |
| < 640px (mobile) | Single column stacked | Scroll vertically between sections |

**Implementation**: CSS Grid with `grid-template-columns` changing via `@media` queries. No JavaScript involved in layout decisions.

**Touch support**: On touch devices, drag-and-drop uses the same HTML5 Drag and Drop API (supported on mobile browsers with touch event translation).

---

### NFR-4: Performance

**Targets**:
- First paint: < 100ms (no network requests, no parsing beyond local JS modules)
- Drag operations: 60fps (no layout thrashing during drag events)
- localStorage read/write: < 10ms for typical board (≤ 50 tasks)

**Strategies**:
- Full re-render uses `DocumentFragment` to batch DOM changes (single reflow)
- Event delegation: single listener on root element, not per-card (survives re-renders)
- No requestAnimationFrame needed — operations are fast enough without scheduling
- localStorage operations are synchronous and sub-millisecond for small payloads

---

### NFR-5: Browser Support

Works in the latest stable version of:
- Google Chrome
- Mozilla Firefox
- Apple Safari
- Microsoft Edge

**Not supported**: Internet Explorer 11, legacy Edge (pre-Chromium).

**Language features used**: ES2020+ (modules, optional chaining, nullish coalescing, `crypto.randomUUID()`). All supported in target browsers since 2020+.

---

### NFR-6: Code Quality

**Structure**:
- Clean separation: data layer (`store.js`), UI rendering (`board.js`), event handling (`controller.js`), entry point (`app.js`)
- Each module has a single responsibility
- No circular imports

**Function rules**:
- Maximum 50 lines per function
- 1–3 parameters preferred, 4 maximum
- Pure functions where possible (store methods are the exception — they mutate internal state)

**Naming**:
- All names reveal intent (no `x`, `tmp`, `data`, `handler`)
- Private methods prefixed with `_` (convention, not enforced)
- Events use past tense or action verbs (`'change'`, not `'onChanged'`)

**Documentation**:
- JSDoc comment on every exported function/class
- @param and @returns types documented
- Module-level comment explaining purpose and requirement references

---

## High-Level Design

### Architecture Decision Record

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Language | Vanilla JS (ES2020+) | TypeScript, React, Svelte | Zero deps requirement (NFR-1); demo focuses on methodology, not framework |
| Styling | Single CSS file + custom properties | Tailwind, CSS-in-JS | Self-contained, no build step, themeable |
| State management | Event-emitting class | Redux-like store, signals | Simplest pattern that supports reactive UI without a framework |
| Persistence | localStorage | IndexedDB, service worker cache | Synchronous, no async complexity, sufficient for demo scale |
| Drag & drop | HTML5 DnD API | drag library (SortableJS) | Native, zero dependencies, adequate for column-to-column moves |
| Modules | ES modules (type="module") | IIFE, CommonJS | Native browser support, clean imports, no bundler needed |
| Rendering | Direct DOM manipulation | Virtual DOM, innerHTML | No framework overhead, explicit control, fast enough for small DOM |

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                      │
│                                                                      │
│  ┌────────────┐    events     ┌──────────────┐    state    ┌──────┐│
│  │ Controller │──────────────►│    Store      │────────────►│ DOM  ││
│  │            │               │              │             │      ││
│  │ - drag/drop│    ┌─────────►│ - tasks[]    │  change     │      ││
│  │ - keyboard │    │          │ - CRUD ops   │──event──┐   │      ││
│  │ - clicks   │    │          │ - validation │         │   │      ││
│  │ - modals   │    │          └──────┬───────┘         ▼   │      ││
│  └─────┬──────┘    │                 │          ┌──────────┐│      ││
│        │           │                 │          │ Renderer  ││      ││
│        │    user   │                 ▼          │          ││      ││
│        │  actions  │          ┌──────────────┐  │ - columns ││      ││
│        └───────────┘          │ localStorage │  │ - cards   │└──────┘│
│                               │              │  │ - a11y    │        │
│                               │ Key:         │  └──────────┘        │
│                               │ sdd-task-    │                      │
│                               │ board-state  │                      │
│                               └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

```
┌─────────────────────────────────┐
│          index.html              │  Entry point (loads modules)
├─────────────────────────────────┤
│          styles.css              │  All visual presentation
├──────────┬──────────┬───────────┤
│ store.js │ board.js │controller.│  Application modules
│          │          │   js      │
├──────────┴──────────┴───────────┤
│          app.js                  │  Initialization + wiring
├─────────────────────────────────┤
│     Browser APIs                 │  DOM, localStorage, Drag & Drop,
│     (no polyfills)               │  ES Modules, crypto.randomUUID()
└─────────────────────────────────┘
```

### Component Interaction Sequence (Task Move)

```
User          Controller         Store           Renderer         DOM
 │                │                │                │               │
 │─dragstart────►│                │                │               │
 │               │ setDraggedId   │                │               │
 │               │ add .dragging  │                │               │
 │               │────────────────────────────────────►addClass    │
 │               │                │                │               │
 │─dragover─────►│                │                │               │
 │               │ preventDefault │                │               │
 │               │ highlight col  │                │               │
 │               │────────────────────────────────────►addClass    │
 │               │                │                │               │
 │─drop─────────►│                │                │               │
 │               │ calcPosition   │                │               │
 │               │───moveTask()──►│                │               │
 │               │                │ update state   │               │
 │               │                │ save to LS     │               │
 │               │                │──emit change──►│               │
 │               │                │                │──render()────►│
 │               │                │                │               │ rebuild columns
 │               │ cleanup()      │                │               │
 │               │────────────────────────────────────►rmClass     │
 │               │                │                │               │
```
