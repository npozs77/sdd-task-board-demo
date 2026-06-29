# High-Level Design — SDD Task Board

**Maturity**: MVP
**Status**: Approved at Gate 2

---

## Architecture Overview

The task board is a single-page browser application with a layered architecture. All logic runs client-side — there are no servers, APIs, or external services. Data persists to the browser's localStorage.

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                            │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │            Presentation Layer                   │  │
│  │                                                 │  │
│  │  index.html (shell)    styles.css (all visual)  │  │
│  │  board.js (DOM construction + reactive render)  │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │ subscribes to 'change'        │
│  ┌────────────────────┼───────────────────────────┐  │
│  │         Interaction Layer                       │  │
│  │                    │                            │  │
│  │  controller.js     │    (event delegation)      │  │
│  │  - drag/drop       │    - keyboard nav          │  │
│  │  - click routing   │    - modal system          │  │
│  └────────────────────┼───────────────────────────┘  │
│                       │ calls mutation methods        │
│  ┌────────────────────┼───────────────────────────┐  │
│  │           Data Layer                            │  │
│  │                    │                            │  │
│  │  store.js          ▼                            │  │
│  │  - Task CRUD     emit 'change'                  │  │
│  │  - validation    ──────────────► Renderer       │  │
│  │  - ordering                                     │  │
│  │  - event emitter                                │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │ read/write                    │
│  ┌────────────────────┼───────────────────────────┐  │
│  │         Persistence Layer                       │  │
│  │                    │                            │  │
│  │  localStorage      ▼                            │  │
│  │  key: 'sdd-task-board-state'                    │  │
│  │  format: JSON { tasks: Task[] }                 │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Architecture Decision Records

| # | Decision | Choice | Alternatives Considered | Rationale |
|---|----------|--------|------------------------|-----------|
| ADR-1 | Language | Vanilla JavaScript (ES2020+) | TypeScript, React, Svelte | Zero deps requirement (NFR-1); demo focuses on methodology not framework |
| ADR-2 | Module system | ES Modules (`type="module"`) | IIFE, CommonJS, bundled | Native browser support, clean imports, no bundler needed |
| ADR-3 | State management | Event-emitting class | Redux pattern, signals, pub/sub bus | Simplest reactive pattern that supports UI subscription without framework |
| ADR-4 | Persistence | localStorage (synchronous JSON) | IndexedDB, service worker cache | Sub-millisecond read/write, no async complexity, sufficient for ≤50 tasks |
| ADR-5 | Drag & Drop | HTML5 Drag and Drop API | SortableJS, custom touch handlers | Native API, zero dependencies, adequate for column-to-column moves |
| ADR-6 | Rendering | Full DOM rebuild via DocumentFragment | Virtual DOM, innerHTML, targeted patches | No framework overhead; batch rebuild is < 5ms for ≤50 tasks |
| ADR-7 | Event handling | Delegation on root element | Per-card binding, MutationObserver | Survives re-renders, 7 listeners vs N×5, no rebinding needed |

---

## Data Flow

```
User Action
    │
    ▼
Controller (interprets gesture: drag, click, key)
    │
    │ calls mutation method
    ▼
Store (validates, mutates state, persists)
    │
    │ emit 'change'          │ write JSON
    ▼                        ▼
Renderer (re-renders DOM)   localStorage
    │
    ▼
DOM (user sees updated board)
```

**Unidirectional**: Controller → Store → Renderer. No reverse data flow. Renderer never calls Store mutations. Controller never manipulates DOM directly (that's Renderer's job).

---

## Technology Stack

```
┌────────────────────────────────────────┐
│          index.html                     │  Entry: loads CSS + app.js
├────────────────────────────────────────┤
│          styles.css                     │  All visual (custom properties, grid, a11y)
├───────────┬───────────┬────────────────┤
│  store.js │  board.js │ controller.js  │  Application modules
│  (data)   │  (render) │ (interaction)  │
├───────────┴───────────┴────────────────┤
│          app.js                         │  Bootstrap: wire components
├────────────────────────────────────────┤
│     Browser APIs (no polyfills)         │
│     DOM, localStorage, Drag & Drop,    │
│     ES Modules, crypto.randomUUID()    │
└────────────────────────────────────────┘
```

---

## Component Interaction Sequence — Move Task (Drag)

```
User          Controller        Store          Renderer       DOM        localStorage
 │                │               │               │            │              │
 │─dragstart────►│               │               │            │              │
 │               │ _draggedId=X  │               │            │              │
 │               │───addClass('.dragging')────────────────────►│              │
 │               │───addClass('.drag-active')─────────────────►│              │
 │               │               │               │            │              │
 │─dragover─────►│               │               │            │              │
 │               │ preventDefault│               │            │              │
 │               │───addClass('.drag-over')───────────────────►│              │
 │               │               │               │            │              │
 │─drop─────────►│               │               │            │              │
 │               │ calcPosition  │               │            │              │
 │               │──moveTask()──►│               │            │              │
 │               │               │ validate col  │            │              │
 │               │               │ update state  │            │              │
 │               │               │──────────────────────────────────setItem──►│
 │               │               │──emit change─►│            │              │
 │               │               │               │──render()─►│              │
 │               │               │               │            │ rebuild DOM  │
 │               │ _cleanup()    │               │            │              │
 │               │───rmClasses────────────────────────────────►│              │
```

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| XSS via task content | All content set via `textContent` (never `innerHTML`). No user HTML rendered. |
| localStorage tampering | Corrupted data → graceful fallback to sample data. No authentication. |
| CSRF / API attacks | N/A — no network requests, no server, no cookies. |
| Dependency supply chain | N/A — zero dependencies. No npm packages to audit. |

---

## Scalability Boundaries

| Dimension | Practical limit | Reason |
|-----------|----------------|--------|
| Task count | ~50 (UX), ~5000 (storage) | > 50 tasks → board becomes unwieldy. localStorage ≈ 5MB ≈ 5000 tasks. |
| Column count | 3 (hardcoded, BR-1) | Fixed by business rule. Extension requires code change. |
| Concurrent tabs | 1 active (no sync) | Last-write-wins on localStorage. No cross-tab events. |
| Offline | Full (no network required) | Everything local. Works without internet. |
