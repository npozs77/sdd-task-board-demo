# Component Dependency Diagram — SDD Task Board

---

## Import Graph

```
app.js
  ├── import { TaskStore } from './store.js'
  ├── import { BoardRenderer } from './board.js'
  └── import { Controller } from './controller.js'
```

## Runtime Dependency Flow

```
                    ┌──────────┐
                    │  app.js  │
                    │  (C4)    │
                    └──┬───┬───┬──┘
            creates    │   │   │    creates
         ┌─────────────┘   │   └─────────────┐
         ▼                 │                  ▼
  ┌──────────────┐         │          ┌──────────────┐
  │ BoardRenderer│         │          │  Controller  │
  │    (C2)      │         │          │    (C3)      │
  └──────┬───────┘         │          └──────┬───────┘
         │                 │                  │
         │ subscribes      │ creates          │ calls
         │ to 'change'     │                  │ mutations
         │                 ▼                  │
         │          ┌──────────────┐          │
         └─────────►│  TaskStore   │◄─────────┘
                    │    (C1)      │
                    └──────┬───────┘
                           │
                           │ read/write
                           ▼
                    ┌──────────────┐
                    │ localStorage │
                    └──────────────┘
```

## Dependency Matrix

| Component | Depends on | Depended on by |
|-----------|-----------|----------------|
| C1 (Store) | localStorage (browser API) | C2 (read), C3 (write), C4 (creates) |
| C2 (Renderer) | C1 (reads state, subscribes) | C4 (creates) |
| C3 (Controller) | C1 (calls mutations) | C4 (creates) |
| C4 (App Entry) | C1, C2, C3 (imports all) | None (entry point) |

## Build Order Implication

Since C1 has no application dependencies, it can be built and tested in isolation. C2 and C3 depend on C1's interface. C4 depends on all three.

```
Build: C1 → C2 (parallel with C3, but C3 uses C1+C2's DOM) → C3 → C4
Test:  C1 alone → C2 with C1 → C3 with C1 → C4 integration
```

This maps directly to the unit decomposition:
- Unit 1 = C1 (standalone)
- Unit 2 = C2 (depends on C1)
- Unit 3 = C3 + C4 (depends on C1 + C2)
