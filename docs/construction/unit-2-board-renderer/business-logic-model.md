# Business Logic Model — Unit 2: Board Renderer

## Overview

The Board Renderer owns all DOM construction and update logic. It subscribes to the Store's `'change'` event and re-renders the board when state changes. It is **reactive** (responds to external state changes) and **stateless** (derives DOM entirely from Store state — never holds its own copy of tasks).

The Renderer never mutates Store data. It only reads via `store.getTasks(column)`.

---

## Primary Workflows

### Workflow 1: Initial Render (constructor)

```
root (HTMLElement), store (TaskStore)
    │
    ▼
[1] Validate root element is not null
    │        │
    │     [FAIL] → throw Error("Board root element not found")
    │
    ▼
[2] Store references: this._root = root, this._store = store
    │
    ▼
[3] Create change handler: this._handleChange = () => this.render()
    │
    ▼
[4] Subscribe: store.on('change', this._handleChange)
    │
    ▼
[5] Call this.render() — initial DOM construction
```

### Workflow 2: Full Re-render

```
render()
    │
    ▼
[1] Create DocumentFragment (batch DOM writes)
    │
    ▼
[2] Create board container <div class="board">
    │   Set role="region", aria-label="Task Board"
    │
    ▼
[3] For each column in COLUMNS (todo → in-progress → done):
    │
    │   [3a] Create <section> element
    │        Set class="column column--{id}"
    │        Set data-column="{id}"
    │        Set aria-label="{displayName}"
    │
    │   [3b] Create <h2> header
    │        Content: "{displayName} <span class='count'>({taskCount})</span>"
    │
    │   [3c] Get tasks: store.getTasks(column.id)
    │
    │   [3d] Create task list container <div class="column-tasks">
    │        Set role="list"
    │
    │   [3e] If tasks.length === 0:
    │        │   Create <p class="column-empty">No tasks</p>
    │        │   Append to list container
    │        │
    │        ELSE: For each task in tasks:
    │              │   Call _renderCard(task) → HTMLElement
    │              │   Append to list container
    │
    │   [3f] Append list container to section
    │
    │   [3g] Create drop zone indicator
    │        <div class="drop-zone" aria-hidden="true">Drop here</div>
    │
    │   [3h] If column.id === 'todo':
    │        │   Create add button
    │        │   <button class="btn-add-task" aria-label="Add new task"
    │        │           data-action="add-task">+ Add task</button>
    │
    │   [3i] Append section to board container
    │
    ▼
[4] Clear root element: this._root.innerHTML = ''
    │
    ▼
[5] Append fragment to root (single DOM write → single reflow)
```

### Workflow 3: Render Single Card

```
_renderCard(task: Task) → HTMLElement
    │
    ▼
[1] Create <article> element
    │   Set class="task-card"
    │   Set data-task-id="{task.id}"
    │   Set role="listitem"
    │   Set draggable="true"
    │   Set aria-label="{task.title || '[Untitled]'}"
    │   Set tabindex="0"
    │
    ▼
[2] Create title element
    │   <h3 class="task-title">{task.title || '[Untitled]'}</h3>
    │
    ▼
[3] If task.description is truthy:
    │   Create <p class="task-description">{task.description}</p>
    │   Append to article
    │
    ▼
[4] Create actions container <div class="task-actions">
    │
    ▼
[5] Create Edit button
    │   <button aria-label="Edit {task.title}"
    │           data-action="edit" data-task-id="{task.id}">Edit</button>
    │
    ▼
[6] Create Delete button
    │   <button class="btn-delete" aria-label="Delete {task.title}"
    │           data-action="delete" data-task-id="{task.id}">Delete</button>
    │
    ▼
[7] Append buttons to actions, actions to article
    │
    ▼
Return: article element
```

### Workflow 4: Destroy (cleanup)

```
destroy()
    │
    ▼
[1] Unsubscribe: store.off('change', this._handleChange)
    │
    ▼
[2] Clear DOM: this._root.innerHTML = ''
```

---

## Domain Entities

### Column Configuration

```typescript
interface ColumnConfig {
  /** Internal identifier matching Store's VALID_COLUMNS. */
  id: 'todo' | 'in-progress' | 'done';

  /** Human-readable display name for column header. */
  name: string;

  /** CSS class applied to section element for per-column styling. */
  cssClass: string;
}

/** [FR-1] [BR-1] Render order is authoritative — left to right. */
const COLUMNS: readonly ColumnConfig[] = [
  { id: 'todo',        name: 'To Do',        cssClass: 'column--todo' },
  { id: 'in-progress', name: 'In Progress',  cssClass: 'column--in-progress' },
  { id: 'done',        name: 'Done',         cssClass: 'column--done' }
];
```

### Generated DOM Tree

```
div.board [role="region", aria-label="Task Board"]
├── section.column.column--todo [data-column="todo", aria-label="To Do"]
│   ├── h2.column-header → "To Do (3)"
│   ├── div.column-tasks [role="list"]
│   │   ├── article.task-card [data-task-id, role="listitem", draggable, tabindex="0"]
│   │   │   ├── h3.task-title
│   │   │   ├── p.task-description (optional)
│   │   │   └── div.task-actions
│   │   │       ├── button [data-action="edit", data-task-id]
│   │   │       └── button.btn-delete [data-action="delete", data-task-id]
│   │   └── ... (more cards)
│   ├── div.drop-zone [aria-hidden="true"]
│   └── button.btn-add-task [data-action="add-task"] (todo only)
├── section.column.column--in-progress [...]
│   └── ... (same structure, no add button)
└── section.column.column--done [...]
    └── ... (same structure, no add button)
```

---

## Accessibility Architecture [NFR-2]

### ARIA Role Strategy

| Element | Tag | Role/Attribute | Rationale |
|---------|-----|---------------|-----------|
| Board | `<div>` | `role="region"` + `aria-label` | Landmark for screen reader navigation |
| Column | `<section>` | Implicit landmark + `aria-label` | Navigable region per column |
| Task list | `<div>` | `role="list"` | Announces count to screen reader |
| Task card | `<article>` | `role="listitem"` + `aria-label` | Reads title on focus |
| Task card | `<article>` | `tabindex="0"` | Keyboard-focusable |
| Edit button | `<button>` | `aria-label="Edit {title}"` | Distinguishes per-card |
| Delete button | `<button>` | `aria-label="Delete {title}"` | Distinguishes per-card |
| Drop zone | `<div>` | `aria-hidden="true"` | Decorative, not announced |

### Heading Hierarchy

```
h1: "Task Board" (in app header — outside Renderer scope)
  h2: "To Do (3)"
    h3: "Review project requirements"
    h3: "Set up development environment"
  h2: "In Progress (1)"
    h3: "Implement authentication"
  h2: "Done (1)"
    h3: "Write API documentation"
```

### Keyboard Focus Order

DOM order determines tab sequence (no `tabindex > 0`):
1. All cards in "To Do" (top to bottom)
2. "Add task" button
3. All cards in "In Progress"
4. All cards in "Done"

---

## CSS Architecture

### Custom Properties (design tokens)

```css
:root {
  /* Backgrounds — slate palette matching main site */
  --bg: #0f172a;
  --surface: #1e293b;
  --surface-2: #334155;
  --border: #475569;

  /* Text */
  --text: #cbd5e1;
  --text-muted: #94a3b8;

  /* Accents — per-column */
  --accent-todo: #60a5fa;       /* blue-400 */
  --accent-progress: #c084fc;   /* purple-400 */
  --accent-done: #4ade80;       /* green-400 */

  /* Interaction */
  --accent: #22d3ee;            /* cyan-400 */
  --danger: #f87171;            /* red-400 */
  --focus-ring: 0 0 0 2px var(--accent);
}
```

### Responsive Breakpoints [NFR-3]

| Viewport | Grid template | Gap | Behaviour |
|----------|--------------|-----|-----------|
| ≥ 960px | `repeat(3, 1fr)` | 16px | 3 columns side by side |
| 640–959px | `repeat(3, 1fr)` | 12px | Tighter spacing, reduced padding |
| < 640px | `1fr` | 16px | Single column, stacked vertically |

Implementation: `@media` queries modifying `grid-template-columns` on `.board`.

### State Classes (applied by Controller)

| Class | Target | Trigger | Effect |
|-------|--------|---------|--------|
| `.dragging` | `.task-card` | dragstart on this card | opacity: 0.5, rotate(2deg) |
| `.drag-active` | `.column` | any card is being dragged | drop zone opacity: 1 |
| `.drag-over` | `.column` | dragged card over this column | border-color: accent |

---

## Rendering Strategy — Performance [NFR-4]

### Full re-render on every change

| Board size | Expected render time | Reflows |
|-----------|---------------------|---------|
| 5 tasks (default) | < 1ms | 1 |
| 20 tasks | < 2ms | 1 |
| 50 tasks | < 5ms | 1 |

### Why full re-render (not DOM patching)?

1. Board has ≤ 50 tasks — full render is sub-5ms
2. `DocumentFragment` batches all DOM writes into single reflow
3. Partial update logic (diff which cards moved, which changed) adds complexity without measurable benefit at this scale
4. No framework to provide virtual DOM — manual diffing is bug-prone
5. Event delegation in Controller survives re-renders (listeners on root, not per-card)

---

## Error Handling

| Scenario | Condition | Behaviour |
|----------|-----------|-----------|
| Null root element | `root === null` in constructor | Throw `Error("Board root element not found")` |
| Empty column | `store.getTasks(col).length === 0` | Render "No tasks" placeholder |
| Missing task title | `task.title` is falsy (corrupted data) | Render `"[Untitled]"` fallback |
| Undefined description | `!task.description` | Skip description paragraph |
| Store emits during render | Change event fires while rendering | Idempotent — re-render runs again safely |

---

## Public API

```typescript
class BoardRenderer {
  /**
   * Construct renderer, subscribe to store changes, perform initial render.
   * @throws Error if root element is null
   */
  constructor(root: HTMLElement, store: TaskStore)

  /** Full re-render from current store state. [NFR-4] */
  render(): void

  /** Unsubscribe from store, clear DOM. Call on teardown. */
  destroy(): void
}
```

---

## Requirement Coverage

| Requirement | How satisfied |
|-------------|--------------|
| FR-1 | `COLUMNS` config renders exactly 3 columns with headers and task counts |
| FR-7 | Drop zone indicator, CSS state classes for drag feedback, empty state message |
| NFR-1 | Zero imports from external packages — pure DOM API |
| NFR-2 | Full ARIA implementation (roles, labels, headings, tabindex, focus indicators) |
| NFR-3 | CSS Grid + media queries at 640px/960px breakpoints |
| NFR-4 | DocumentFragment batching — single reflow per render |
| NFR-5 | Standard DOM APIs: `createElement`, `setAttribute`, `classList` — all target browsers |
| NFR-6 | JSDoc on all public methods, functions ≤ 50 lines, single-responsibility |
