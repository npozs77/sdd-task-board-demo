# Code Summary — Unit 3: Interaction Controller + App Entry

## Files Delivered

| File | Purpose | Lines |
|------|---------|-------|
| `src/controller.js` | Drag/drop, keyboard nav, modals, button handlers | ~250 |
| `src/app.js` | Entry point: wires Store + Renderer + Controller | ~30 |

## Requirement Traceability

| Requirement | Implementation Location |
|-------------|----------------------|
| FR-3 (Task Movement) | `_onDragStart()`, `_onDragOver()`, `_onDrop()` — drag-and-drop flow |
| FR-4 (Task Editing) | `_showEditModal()` → `store.editTask()` |
| FR-4 (Task Deletion) | `_showDeleteConfirm()` → `store.deleteTask()` |
| FR-6 (Task Ordering) | `_onDrop()` position calculation, `_onKeyDown()` Ctrl+Arrow up/down |
| FR-7 (Visual Feedback) | `.dragging` class on dragstart, `.drag-active` on columns, `.drag-over` on target |
| NFR-2 (Accessibility) | Keyboard: Tab between cards, Enter to edit, Delete to delete, Ctrl+Arrows to move |
| NFR-4 (Performance) | Event delegation (single listener on root), no per-card binding |
| BR-3 (Required Fields) | Modal validation: red border on empty required field, prevents submit |
| BR-5 (Deletion Confirmation) | `_showDeleteConfirm()` with alertdialog role |

## Design Decisions

- **Event delegation**: Single listeners on root element, not per-card. Survives re-renders without rebinding.
- **Generic modal system**: `_showModal()` accepts field configs, reusable for add/edit.
- **Keyboard movement**: Ctrl+Arrow moves between columns (left/right) or reorders within column (up/down). Follows accessibility best practices for grid navigation.
- **Focus management**: Modals trap focus. Cancel/close returns focus to overlay close, then browser manages return.
- **Drop position**: Calculated from mouse Y vs card midpoints. Gives natural insertion feel.

## Complete App File List

```
src/
├── index.html        # HTML shell, loads CSS + app.js
├── styles.css        # All styling (responsive, a11y, dark theme)
├── app.js            # Entry point (init + wiring)
├── store.js          # Data layer (CRUD + localStorage + events)
├── board.js          # UI layer (DOM rendering)
└── controller.js     # Interaction (drag/drop, keyboard, modals)
```

## How to Run

```bash
# From site/demo/src/
npx serve .
# Open http://localhost:3000
```

Or simply open `src/index.html` in any modern browser (requires file:// ES module support, which most browsers have — or use any static server).
