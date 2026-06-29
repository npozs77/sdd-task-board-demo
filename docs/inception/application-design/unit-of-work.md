# Units of Work — SDD Task Board

Three units, ordered by dependency.

---

## Unit 1 — Data Store

**Capability**: FR-1, FR-2, FR-5, FR-6, BR-1–BR-6
**Component**: C1 (Data Store)
**Delivers**:
- `src/store.js` — task CRUD, localStorage persistence, event emitter, UUID generation, sample data seeding

**Input**: User actions (create, edit, delete, move, reorder)
**Output**: Updated board state + localStorage write + change event

---

## Unit 2 — Board Renderer

**Capability**: FR-1, FR-7, NFR-2, NFR-3
**Component**: C2 (Board Renderer)
**Delivers**:
- `src/board.js` — DOM construction, column rendering, task cards, responsive layout
- `src/styles.css` — all styling (custom properties, grid, a11y, responsive)
- `src/index.html` — app shell

**Input**: Board state from Store (via change events)
**Output**: Rendered DOM reflecting current state

**Depends on**: Unit 1 (reads state from Store)

---

## Unit 3 — Interaction Controller + App Entry

**Capability**: FR-3, FR-4, FR-6, FR-7, NFR-2, NFR-4
**Components**: C3 (Controller), C4 (Entry Point)
**Delivers**:
- `src/controller.js` — drag-and-drop, keyboard navigation, button handlers, confirmation dialogs
- `src/app.js` — initialization, wiring store + renderer + controller

**Input**: User interactions (mouse, keyboard, touch)
**Output**: Calls to Store (state changes) + calls to Renderer (visual feedback)

**Depends on**: Unit 1 + Unit 2

---

## Build Order

```
Unit 1 (Data Store) → Unit 2 (Board Renderer) → Unit 3 (Controller + Entry)
```

Sequential — each depends on the prior.

---

## Traceability Matrix

| Requirement | Unit |
|-------------|------|
| FR-1 (Board Structure) | Unit 1 (data), Unit 2 (render) |
| FR-2 (Task Management) | Unit 1 |
| FR-3 (Task Movement) | Unit 3 |
| FR-4 (Task Editing) | Unit 3 |
| FR-5 (Data Persistence) | Unit 1 |
| FR-6 (Task Ordering) | Unit 1, Unit 3 |
| FR-7 (Visual Feedback) | Unit 2, Unit 3 |
| NFR-1 (Zero Dependencies) | All |
| NFR-2 (Accessibility) | Unit 2, Unit 3 |
| NFR-3 (Responsive) | Unit 2 |
| NFR-4 (Performance) | Unit 3 |
| NFR-5 (Browser Support) | All |
| NFR-6 (Code Quality) | All |
| BR-1–BR-6 | Unit 1 |
