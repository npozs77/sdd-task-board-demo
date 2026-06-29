# Code Summary — Unit 1: Data Store

## Files Delivered

| File | Purpose | Lines |
|------|---------|-------|
| `src/store.js` | Task CRUD, localStorage persistence, event system | ~200 |

## Requirement Traceability

| Requirement | Implementation Location |
|-------------|----------------------|
| FR-1 (Board Structure) | `VALID_COLUMNS` constant, `getTasks(column)` |
| FR-2 (Task Management) | `createTask()`, `editTask()` |
| FR-5 (Data Persistence) | `_load()`, `_save()`, `STORAGE_KEY` |
| FR-6 (Task Ordering) | `reorderTask()`, `_normalizeOrder()` |
| BR-1 (Default Columns) | `VALID_COLUMNS = ['todo', 'in-progress', 'done']` |
| BR-2 (Task Identity) | `generateId()` → UUID v4 |
| BR-3 (Required Fields) | Validation in `createTask()` and `editTask()` |
| BR-4 (Sample Data) | `createSampleData()` → 5 tasks on first load |
| BR-5 (Deletion) | `deleteTask()` (confirmation is UI concern, Unit 3) |
| BR-6 (Persistence Timing) | `_save()` called in every mutation method |

## Design Decisions

- **Event-driven**: Store emits `'change'` after every mutation. Renderer subscribes.
- **Full-state persistence**: Entire task array serialized on every change. Acceptable for ≤50 tasks (NFR-4).
- **Graceful degradation**: localStorage failures logged, app continues in-memory.
- **No framework**: Plain ES module class. Zero dependencies.

## Public API

```javascript
const store = new TaskStore();

store.getState()                    // → Task[]
store.getTasks('todo')              // → Task[] (sorted by order)
store.createTask('title', 'desc')   // → Task (new, in "todo")
store.editTask(id, { title, description })
store.moveTask(id, 'done', 0)       // → move to position 0 in "done"
store.deleteTask(id)
store.reorderTask(id, 2)            // → move to position 2 in same column

store.on('change', callback)
store.off('change', callback)
```
