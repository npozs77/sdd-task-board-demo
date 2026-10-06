# Business Logic Model — Unit 3: Interaction Controller + App Entry

## Overview

The Controller owns all user interaction handling. It translates browser events (mouse, keyboard, touch) into Store operations and visual feedback. It uses **event delegation** — single listeners on the root element rather than per-card bindings — ensuring correct behaviour after Renderer re-renders the DOM.

The Controller is **stateful** only for active drag operations (`_draggedTaskId`). All other state lives in the Store.

The App Entry (`app.js`) is the bootstrap module: it creates Store, Renderer, and Controller, and wires them together.

---

## Primary Workflows

### Workflow 1: Drag & Drop — Move Task [FR-3]

```
User mousedown + move on .task-card
    │
    ▼
[1] _onDragStart(event):
    │   Find closest .task-card ancestor
    │        │
    │     [FAIL: no card found] → return (ignore)
    │
    │   Store dragged ID: this._draggedTaskId = card.dataset.taskId
    │   Set dataTransfer: e.dataTransfer.effectAllowed = 'move'
    │   Set dataTransfer data: e.dataTransfer.setData('text/plain', id)
    │
    │   Visual feedback:
    │     card.classList.add('dragging')              → opacity 0.5, rotate
    │     root.querySelectorAll('.column')
    │       .forEach(col => col.classList.add('drag-active'))  → show drop zones
    │
    ▼
User drags over .column
    │
    ▼
[2] _onDragOver(event):
    │   e.preventDefault()                           → allows drop
    │   e.dataTransfer.dropEffect = 'move'
    │   Find closest .column
    │        │
    │     [FAIL: no column] → return
    │
    │   column.classList.add('drag-over')            → highlight border
    │
    ▼
User drags out of .column
    │
    ▼
[3] _onDragLeave(event):
    │   Find closest .column
    │   If column exists AND e.relatedTarget is NOT inside column:
    │     column.classList.remove('drag-over')
    │
    ▼
User releases mouse on .column
    │
    ▼
[4] _onDrop(event):
    │   e.preventDefault()
    │   Find closest .column
    │        │
    │     [FAIL: no column OR no draggedTaskId] → return
    │
    │   Read target column: column.dataset.column
    │
    │   Calculate drop position:
    │     cards = column.querySelectorAll('.task-card:not(.dragging)')
    │     position = cards.length (default: end)
    │     FOR i = 0 to cards.length - 1:
    │       rect = cards[i].getBoundingClientRect()
    │       midpoint = rect.top + rect.height / 2
    │       IF event.clientY < midpoint:
    │         position = i
    │         BREAK
    │
    │   Call store.moveTask(this._draggedTaskId, targetColumn, position)
    │        │
    │     [FAIL: store throws] → console.warn, continue
    │
    │   Call _cleanup()
    │
    ▼
[5] _onDragEnd(event):           → fallback for cancelled drags
    │   Call _cleanup()
```

### Workflow 2: Keyboard Navigation [NFR-2]

```
User presses key while .task-card is focused
    │
    ▼
[1] _onKeyDown(event):
    │   Find closest .task-card from event.target
    │        │
    │     [FAIL: no card focused] → return (ignore)
    │
    │   Read taskId = card.dataset.taskId
    │
    ▼
[2] Route by key:
    │
    │   [Enter]
    │     e.preventDefault()
    │     Call _showEditModal(taskId)
    │     → RETURN
    │
    │   [Delete | Backspace]
    │     e.preventDefault()
    │     Call _showDeleteConfirm(taskId)
    │     → RETURN
    │
    │   [Ctrl+Arrow | Meta+Arrow] (cross-platform: Ctrl on Windows, Cmd on Mac)
    │     Find task in store: store.getState().find(t => t.id === taskId)
    │          │
    │       [FAIL: not found] → return
    │
    │     Determine current column index in ['todo', 'in-progress', 'done']
    │
    │     Route by arrow direction:
    │       ArrowRight + colIndex < 2:
    │         store.moveTask(taskId, columns[colIndex + 1])
    │       ArrowLeft + colIndex > 0:
    │         store.moveTask(taskId, columns[colIndex - 1])
    │       ArrowDown:
    │         store.reorderTask(taskId, task.order + 1)
    │       ArrowUp:
    │         store.reorderTask(taskId, task.order - 1)
    │
    │     e.preventDefault()  → prevent page scroll
```

### Workflow 3: Button Click Routing

```
User clicks within root element
    │
    ▼
[1] _onClick(event):
    │   Find closest element with [data-action] attribute
    │        │
    │     [FAIL: no data-action found] → return (not an action click)
    │
    ▼
[2] Route by action value:
    │
    │   action === 'add-task':
    │     Call _showAddModal()
    │
    │   action === 'edit':
    │     Read taskId = target.dataset.taskId
    │     Call _showEditModal(taskId)
    │
    │   action === 'delete':
    │     Read taskId = target.dataset.taskId
    │     Call _showDeleteConfirm(taskId)
```

### Workflow 4: Add Task Modal [FR-2]

```
_showAddModal()
    │
    ▼
[1] Call _showModal with config:
    │   title: 'Add Task'
    │   fields: [
    │     { name: 'title', label: 'Title', type: 'input', required: true },
    │     { name: 'description', label: 'Description', type: 'textarea' }
    │   ]
    │   onSubmit: (data) → store.createTask(data.title, data.description || '')
```

### Workflow 5: Edit Task Modal [FR-4]

```
_showEditModal(taskId)
    │
    ▼
[1] Find task: store.getState().find(t => t.id === taskId)
    │        │
    │     [FAIL: not found] → return (task may have been deleted)
    │
    ▼
[2] Call _showModal with config:
    │   title: 'Edit Task'
    │   fields: [
    │     { name: 'title', ..., required: true, value: task.title },
    │     { name: 'description', ..., value: task.description }
    │   ]
    │   onSubmit: (data) → store.editTask(taskId, { title, description })
```

### Workflow 6: Delete Confirmation [BR-5]

```
_showDeleteConfirm(taskId)
    │
    ▼
[1] Find task: store.getState().find(t => t.id === taskId)
    │        │
    │     [FAIL: not found] → return
    │
    ▼
[2] Create overlay DOM:
    │   <div class="modal-overlay">
    │     <div class="modal" role="alertdialog"
    │          aria-labelledby="confirm-title"
    │          aria-describedby="confirm-desc">
    │       <h2 id="confirm-title">Delete Task</h2>
    │       <p id="confirm-desc">
    │         Are you sure you want to delete "{task.title}"?
    │         This cannot be undone.
    │       </p>
    │       <div class="modal-actions">
    │         <button data-modal-action="cancel">Cancel</button>
    │         <button data-modal-action="confirm">Delete</button>
    │       </div>
    │     </div>
    │   </div>
    │
    ▼
[3] Bind close handlers:
    │   click on [data-modal-action="confirm"] → store.deleteTask(taskId), remove overlay
    │   click on [data-modal-action="cancel"] → remove overlay
    │   click on overlay background → remove overlay
    │   keydown Escape → remove overlay
    │
    ▼
[4] Append overlay to document.body
    │
    ▼
[5] Focus Cancel button (safe default for destructive action)
```

### Workflow 7: Generic Modal System

```
_showModal({ title, fields, onSubmit })
    │
    ▼
[1] Build overlay + modal DOM:
    │   <div class="modal-overlay">
    │     <div class="modal" role="dialog" aria-labelledby="modal-title">
    │       <h2 id="modal-title">{title}</h2>
    │       <form>
    │         FOR each field in fields:
    │           <label for="modal-{field.name}">{field.label}</label>
    │           IF field.type === 'textarea':
    │             <textarea id="modal-{name}" name="{name}" {required}>{value}</textarea>
    │           ELSE:
    │             <input id="modal-{name}" name="{name}" value="{value}" {required}>
    │         <div class="modal-actions">
    │           <button type="button" data-modal-action="cancel">Cancel</button>
    │           <button type="submit">Save</button>
    │         </div>
    │       </form>
    │     </div>
    │   </div>
    │
    ▼
[2] Bind form submit handler:
    │   e.preventDefault()
    │   Collect data from all fields by name
    │   FOR each required field:
    │     IF data[name].trim() === '':
    │       Set input border-color = var(--danger)   → visual error
    │       Focus the invalid input
    │       → RETURN (don't close, don't submit)
    │   Call onSubmit(data)
    │        │
    │     [FAIL: store throws] → console.warn
    │   Remove overlay
    │
    ▼
[3] Bind close handlers:
    │   click on overlay background → remove
    │   click on [data-modal-action="cancel"] → remove
    │   keydown Escape → remove
    │
    ▼
[4] Append to document.body
    │
    ▼
[5] Focus first input/textarea element
```

### Workflow 8: App Initialization (app.js)

```
<script type="module" src="app.js">
    │
    ▼
[1] Check document.readyState
    │   IF 'loading':
    │     addEventListener('DOMContentLoaded', init)
    │   ELSE:
    │     Call init() immediately
    │
    ▼
init():
    │
    ▼
[2] Get root: document.getElementById('board-root')
    │        │
    │     [FAIL: null] → console.error("App: #board-root not found"), return
    │
    ▼
[3] Create store = new TaskStore()
    │
    ▼
[4] Create renderer = new BoardRenderer(root, store)
    │
    ▼
[5] Create controller = new Controller(root, store)
    │
    ▼
[6] Expose debug: window.__taskBoard = { store, renderer, controller }
```

---

## Domain Entities

### Modal Field Configuration

```typescript
interface ModalField {
  /** Form field name — also used for DOM id: "modal-{name}" */
  name: string;

  /** Display label shown above the input */
  label: string;

  /** Input type determines DOM element: <input> or <textarea> */
  type: 'input' | 'textarea';

  /** If true, submission validates non-empty. [BR-3] */
  required?: boolean;

  /** Pre-fill value for edit modals. */
  value?: string;
}

interface ModalConfig {
  title: string;
  fields: ModalField[];
  onSubmit: (data: Record<string, string>) => void;
}
```

### Controller State

```typescript
class Controller {
  _root: HTMLElement;           // Event delegation target
  _store: TaskStore;           // Data operations
  _draggedTaskId: string | null;  // Active drag (null when idle)
}
```

---

## Event Delegation Strategy [NFR-4]

### Binding Pattern

```typescript
// Single listeners on root — NOT per-card
this._root.addEventListener('dragstart', (e) => this._onDragStart(e));
this._root.addEventListener('dragover',  (e) => this._onDragOver(e));
this._root.addEventListener('dragleave', (e) => this._onDragLeave(e));
this._root.addEventListener('drop',      (e) => this._onDrop(e));
this._root.addEventListener('dragend',   (e) => this._onDragEnd(e));
this._root.addEventListener('click',     (e) => this._onClick(e));
this._root.addEventListener('keydown',   (e) => this._onKeyDown(e));
```

### Why delegation?

| Concern | Per-card binding | Delegation |
|---------|-----------------|------------|
| Re-render survives | ❌ Must rebind | ✅ Root persists |
| Memory (50 cards) | 350 listeners | 7 listeners |
| Dynamic elements (modals) | Manual binding | Natural (body-level) |
| Cleanup on destroy | Must track all | Remove 7 from root |

---

## Keyboard Boundary Behaviour

| Situation | Key | Result |
|-----------|-----|--------|
| Task in "Done" column | Ctrl+Right | No-op (rightmost) |
| Task in "To Do" column | Ctrl+Left | No-op (leftmost) |
| First task in column (order 0) | Ctrl+Up | reorderTask(id, -1) → clamped to 0, no-op |
| Last task in column | Ctrl+Down | reorderTask(id, N+1) → clamped to N, no-op |
| No card focused | Any Ctrl+Arrow | _onKeyDown exits early (no .task-card ancestor) |
| Card focused, no Ctrl | Arrow keys | Browser default (scroll) |

---

## Cleanup Function

```typescript
_cleanup(): void {
  this._draggedTaskId = null;
  this._root.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  this._root.querySelectorAll('.drag-active').forEach(el => el.classList.remove('drag-active'));
  this._root.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}
```

Called by: `_onDrop()` (successful drop) and `_onDragEnd()` (cancelled drag or drop outside valid target).

---

## Error Handling

| Scenario | Condition | Behaviour |
|----------|-----------|-----------|
| Drop on non-column | `closest('.column')` returns null | No-op (return early) |
| Drag with no stored ID | `_draggedTaskId` is null at drop time | No-op (return early) |
| Store throws on move | Invalid column / task not found | Catch, console.warn, cleanup runs |
| Edit modal for deleted task | `store.getState().find()` returns undefined | Return early (no modal shown) |
| Submit with empty required field | `data[name].trim() === ''` | Red border, focus, don't close |
| Store throws on modal submit | Title empty after UI validation (race) | Catch, console.warn, modal stays open |
| Double-click delete | Second click hits overlay (already open) | Overlay click → closes first dialog |
| Keyboard move at boundary | Store clamps position | No error, no visible change |

---

## Public API

```typescript
class Controller {
  /**
   * Wire all event listeners on root element via delegation.
   * Does NOT own DOM construction — that's Renderer's job.
   */
  constructor(root: HTMLElement, store: TaskStore)
}

// app.js — no class, just init function
function init(): void
```

---

## Requirement Coverage

| Requirement | How satisfied |
|-------------|--------------|
| FR-2 | _showAddModal() → store.createTask() |
| FR-3 | Full drag-and-drop system: dragstart → dragover → drop → cleanup |
| FR-4 | _showEditModal() → store.editTask(), _showDeleteConfirm() → store.deleteTask() |
| FR-6 | Keyboard Ctrl+Up/Down → store.reorderTask(), drop position calculation within column |
| FR-7 | CSS class application: .dragging, .drag-active, .drag-over + cleanup |
| NFR-2 | Keyboard nav (Tab, Enter, Delete, Ctrl+Arrows, Escape), focus management in modals |
| NFR-4 | Event delegation — 7 listeners total regardless of card count |
| BR-3 | Modal validation: red border + prevent submit on empty required field |
| BR-5 | _showDeleteConfirm() with role="alertdialog", explicit confirm required |
