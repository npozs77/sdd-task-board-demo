# Application Components — SDD Task Board

---

## Component Overview

The application has four components in three layers. Each component is a single ES module file with a clear responsibility boundary.

```
┌─────────────────────────────────────────────────┐
│  Presentation + Interaction Layer                │
│  ┌──────────────────┐  ┌─────────────────────┐  │
│  │  Board Renderer   │  │   Controller        │  │
│  │  (C2 — board.js)  │  │  (C3 — controller.js│) │
│  └────────┬──────────┘  └────────┬────────────┘  │
│           │ subscribes            │ calls          │
├───────────┼───────────────────────┼───────────────┤
│  Data Layer                       │               │
│  ┌────────┴───────────────────────┴────────────┐  │
│  │              Task Store                      │  │
│  │            (C1 — store.js)                   │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │ read/write                   │
├─────────────────────┼─────────────────────────────┤
│  Persistence        │                             │
│                     ▼                             │
│              localStorage                         │
└───────────────────────────────────────────────────┘

Orchestration: C4 (app.js) — creates C1, C2, C3 and wires them together.
```

---

## C1 — Task Store (store.js)

**Responsibility**: Single source of truth for all board state. CRUD operations, business rule enforcement, localStorage persistence, event emission.

**Technology**: Vanilla JavaScript, ES module class
**State**: `Task[]` held in memory, synced to localStorage on mutation
**Interfaces**:
- Input: Method calls from Controller (create, edit, move, delete, reorder)
- Output: Task data via getState/getTasks, `'change'` events via on/off
- Persistence: Read on init, write on every mutation

**Key design rules**:
- Never touches DOM
- Never imports other application modules
- Validates all inputs before mutation (fail-fast with descriptive errors)
- Every mutation: validate → mutate → persist → emit

---

## C2 — Board Renderer (board.js)

**Responsibility**: DOM construction and update. Builds the complete board UI from Store state. Subscribes to `'change'` event for reactive updates.

**Technology**: Vanilla JavaScript, DOM API, DocumentFragment
**State**: Stateless — derives all DOM from Store on every render
**Interfaces**:
- Input: `root` HTMLElement + `store` TaskStore instance
- Output: DOM nodes appended to root
- Subscribes: `store.on('change', render)`

**Key design rules**:
- Never mutates Store data (read-only via getTasks)
- Never handles user events (that's Controller's job)
- Full re-render on every change (DocumentFragment for batch)
- Sets `data-*` attributes for Controller to query

---

## C3 — Controller (controller.js)

**Responsibility**: User interaction handling. Translates browser events into Store operations and visual feedback via CSS classes.

**Technology**: Vanilla JavaScript, HTML5 Drag & Drop API, event delegation
**State**: Only `_draggedTaskId` (during active drag, null otherwise)
**Interfaces**:
- Input: DOM events (delegated from root)
- Output: Store mutations + DOM class manipulation for visual feedback
- Creates: Modal DOM (appended to body, removed on close)

**Key design rules**:
- Event delegation — binds on root, not per-card
- Never constructs board DOM (that's Renderer's job)
- Never reads/writes localStorage directly (that's Store's job)
- Catches Store errors at boundaries (log + continue)

---

## C4 — App Entry (app.js)

**Responsibility**: Bootstrap and wiring. Creates all components and connects them.

**Technology**: Vanilla JavaScript, ES module
**State**: None
**Interfaces**:
- Input: DOMContentLoaded event
- Output: Running application (store + renderer + controller wired)
- Debug: Exposes `window.__taskBoard` for console access

**Key design rules**:
- Runs once on page load
- Fails gracefully if `#board-root` not found
- No logic beyond initialization

---

## Component Communication

| From | To | Mechanism | Data |
|------|-----|-----------|------|
| Controller → Store | Method call | `store.createTask()`, `store.moveTask()`, etc. | Task data, IDs |
| Store → Renderer | Event | `store.on('change', render)` | No payload (renderer queries state) |
| Controller → DOM | Class manipulation | `classList.add/remove` | Visual feedback during drag |
| Renderer → DOM | Element construction | `createElement`, `appendChild` | Full board structure |
| Store → localStorage | JSON serialization | `setItem` on every mutation | `{ tasks: Task[] }` |
| localStorage → Store | JSON parsing | `getItem` on init | `{ tasks: Task[] }` or null |

---

## Dependency Rules

```
app.js ──imports──► store.js (no dependencies)
       ──imports──► board.js (depends on store interface)
       ──imports──► controller.js (depends on store interface)

board.js ──receives──► store instance (via constructor)
controller.js ──receives──► store instance (via constructor)

store.js ──depends on──► nothing (fully standalone)
```

**No circular dependencies.** Store is the leaf. Board and Controller depend on Store's interface but not on each other.
