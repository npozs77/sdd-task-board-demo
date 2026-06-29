# Developer Guide — SDD Task Board

## Architecture

```
src/
├── index.html        # HTML shell — loads CSS and app.js module
├── styles.css        # All visual presentation (custom properties, grid, a11y)
├── app.js            # Entry point — wires Store + Renderer + Controller
├── store.js          # Data layer — CRUD, localStorage, event emitter
├── board.js          # UI layer — DOM construction, reactive rendering
└── controller.js     # Interaction — drag/drop, keyboard, modals
```

### Dependency graph

```
app.js
  ├── imports store.js      (data layer)
  ├── imports board.js      (UI layer)
  └── imports controller.js (interaction layer)

board.js
  └── receives store instance (reads state via getTasks())

controller.js
  └── receives store instance (calls mutation methods)

store.js
  └── standalone (no imports, no DOM access)
```

### Design principles

- **No framework**: Vanilla JavaScript, zero npm dependencies
- **ES modules**: Native browser `type="module"` — no bundler
- **Event-driven**: Store emits, Renderer reacts. No polling, no timers.
- **Separation of concerns**: Store never touches DOM. Renderer never mutates data. Controller bridges both.

---

## Running Locally

```bash
# Any static file server works
cd site/demo/src
npx serve .

# Or Python
python3 -m http.server 3000

# Or PHP
php -S localhost:3000
```

Open `http://localhost:3000` in your browser.

**Note**: Opening `index.html` directly (`file://`) works in most browsers for ES modules, but some (older Firefox) may block module imports from `file://`. Use a local server for reliability.

---

## Module Reference

### store.js — TaskStore

The single source of truth for all board state.

```javascript
import { TaskStore } from './store.js';
const store = new TaskStore();
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `createTask` | `(title: string, desc?: string) → Task` | Add task to "todo" column |
| `editTask` | `(id: string, { title?, description? }) → void` | Update task fields |
| `moveTask` | `(id: string, column: string, position?: number) → void` | Move to column at position |
| `deleteTask` | `(id: string) → void` | Permanently remove task |
| `reorderTask` | `(id: string, newPosition: number) → void` | Reorder within same column |
| `getState` | `() → Task[]` | Get all tasks (copy) |
| `getTasks` | `(column: string) → Task[]` | Get tasks for column (sorted) |
| `on` | `(event: string, fn: Function) → void` | Subscribe to events |
| `off` | `(event: string, fn: Function) → void` | Unsubscribe |

**Events emitted**: `'change'` — after every successful mutation.

**Errors thrown**:
- `"Title must not be empty"` — on create/edit with empty title
- `"Invalid column: {value}"` — on move to non-existent column
- `"Task not found: {id}"` — on any operation with bad ID

---

### board.js — BoardRenderer

Builds and maintains the DOM representation of the board.

```javascript
import { BoardRenderer } from './board.js';
const renderer = new BoardRenderer(document.getElementById('board-root'), store);
```

| Method | Description |
|--------|-------------|
| `constructor(root, store)` | Subscribe to store changes, initial render |
| `render()` | Full re-render from current state |
| `destroy()` | Unsubscribe, clear DOM |

**Rendering approach**: Full re-render on every change event. Uses `DocumentFragment` for batch DOM updates (single reflow).

**DOM data attributes set**:
- `data-column="todo|in-progress|done"` on column sections
- `data-task-id="uuid"` on task cards and action buttons
- `data-action="add-task|edit|delete"` on buttons

---

### controller.js — Controller

Handles all user interactions via event delegation.

```javascript
import { Controller } from './controller.js';
const controller = new Controller(document.getElementById('board-root'), store);
```

**Binds these events on root**:
- `dragstart`, `dragover`, `dragleave`, `drop`, `dragend` — for drag-and-drop
- `click` — for button actions (delegated via `data-action`)
- `keydown` — for keyboard navigation

**Creates modal DOM dynamically**: Appended to `document.body`, removed on close.

---

## Data Model

### Task object shape

```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // UUID v4
  title: "Task title",                           // Non-empty string
  description: "Optional description",           // Any string (including "")
  column: "todo",                                // "todo" | "in-progress" | "done"
  order: 0                                       // 0-based position in column
}
```

### localStorage format

Key: `sdd-task-board-state`

```json
{
  "tasks": [
    { "id": "...", "title": "...", "description": "...", "column": "todo", "order": 0 },
    { "id": "...", "title": "...", "description": "...", "column": "in-progress", "order": 0 }
  ]
}
```

---

## Extending the App

### Adding a new column

1. `store.js`: Add to `VALID_COLUMNS` array
2. `board.js`: Add to `COLUMNS` array with display name and CSS class
3. `styles.css`: Add `.column--{id}` styles and update grid template
4. `controller.js`: Update keyboard navigation column array

### Adding task fields

1. Define the field in the Task interface (conceptually)
2. `store.js`: Include in `createTask()` and `editTask()` 
3. `board.js`: Render the field in `_renderCard()`
4. `controller.js`: Add to modal field configuration
5. Update sample data in `createSampleData()`

### Changing persistence backend

Replace the two localStorage calls in `store.js`:
- `_load()`: Replace `localStorage.getItem` with your read logic
- `_save()`: Replace `localStorage.setItem` with your write logic

The rest of the app is unaffected (Store interface stays the same).

---

## CSS Customization

### Theming via custom properties

Override CSS custom properties to change the entire look:

```css
:root {
  --bg: #ffffff;           /* Light mode */
  --surface: #f5f5f5;
  --text: #1a1a1a;
  --accent: #0066cc;
  /* ... etc */
}
```

### Key CSS classes

| Class | Purpose | Modify to change |
|-------|---------|-----------------|
| `.board` | Grid container | Column layout, gap |
| `.column` | Column wrapper | Background, border, padding |
| `.task-card` | Task card | Card appearance, hover effects |
| `.task-actions` | Button container | Show/hide behaviour |
| `.modal-overlay` | Modal backdrop | Background opacity, blur |
| `.modal` | Modal dialog | Size, padding, position |

---

## Debugging

### Console access

The app exposes `window.__taskBoard` with:
- `__taskBoard.store` — TaskStore instance
- `__taskBoard.renderer` — BoardRenderer instance
- `__taskBoard.controller` — Controller instance

### Useful console commands

```javascript
// Create a task programmatically
__taskBoard.store.createTask('Test task', 'Created from console');

// Move a task
const tasks = __taskBoard.store.getState();
__taskBoard.store.moveTask(tasks[0].id, 'done');

// View current state
console.table(__taskBoard.store.getState());

// Reset to sample data
localStorage.removeItem('sdd-task-board-state');
location.reload();

// Force re-render
__taskBoard.renderer.render();
```

---

## Code Standards

| Rule | Standard |
|------|----------|
| Max function length | 50 lines |
| Parameters | 1–3 preferred, 4 max |
| Naming | Intent-revealing, no abbreviations |
| Documentation | JSDoc on all exports |
| Private methods | Prefixed with `_` |
| Error handling | Throw standard Error objects, catch at boundaries |
| Module pattern | One class per file, named export |

---

## Known Limitations

| Limitation | Reason | Workaround |
|-----------|--------|------------|
| No multi-tab sync | localStorage doesn't emit cross-tab events in this setup | Reload other tabs manually |
| No undo | Simplicity — undo stack would double state complexity | Use browser back/forward for page-level undo |
| No task due dates | Out of scope for demo | Extend Task type + add field to modal |
| No search/filter | Out of scope for demo | Add filter input that hides non-matching cards via CSS |
| No export/import | Out of scope for demo | Implement via `JSON.stringify(store.getState())` |
| Mobile drag suboptimal | HTML5 DnD has limited touch support | Use touch event polyfill or buttons for mobile move |
