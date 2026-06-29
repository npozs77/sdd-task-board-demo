# Business Rules — SDD Task Board

## Overview

Business rules define the constraints and invariants that the system must enforce regardless of user interface. They are the "laws" of the domain — not optional behaviour, not preferences, but hard requirements that code must uphold.

---

## BR-1: Fixed Column Structure

**Rule**: The board has exactly three columns. They are immutable.

| Property | Value | Modifiable? |
|----------|-------|-------------|
| Column count | 3 | No |
| Column IDs | `todo`, `in-progress`, `done` | No |
| Column display names | "To Do", "In Progress", "Done" | No |
| Column order (left to right) | todo → in-progress → done | No |

**Enforcement points**:
- `store.js`: `VALID_COLUMNS` constant defines the allowed set
- `store.js`: `moveTask()` validates `targetColumn` against `VALID_COLUMNS`
- `board.js`: `COLUMNS` array defines render order (never reads from state)

**Edge cases**:
- API call with column `"archived"` → throws `Error("Invalid column: archived")`
- Stored state with tasks in column `"backlog"` (corrupted data) → on load, tasks with invalid columns are moved to `"todo"` with a console warning
- Column IDs are lowercase kebab-case internally; display names are for rendering only

**Rationale**: A fixed board structure keeps the demo focused. Column management (adding, renaming, reordering) would triple the complexity without demonstrating additional SDD value.

---

## BR-2: Task Identity (UUID)

**Rule**: Every task has a globally unique identifier, generated at creation time, immutable for the task's lifetime.

**Implementation**:
```javascript
// Primary: crypto.randomUUID() (available in all target browsers)
// Fallback: RFC 4122 v4 pattern using Math.random()
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

**Invariants**:
- No two tasks in the same board share an ID (guaranteed by UUID uniqueness)
- Task ID never changes after creation (no rename, no reassignment)
- Task ID is the only stable reference to a task (title can change, position can change)
- All operations (edit, move, delete, reorder) use task ID as the lookup key

**Edge cases**:
- Duplicate ID in stored data (corruption) → undefined behaviour (first match wins in `Array.find`)
- Empty string ID → invalid, but not explicitly checked (generateId never produces empty)
- ID format is not validated on load — any truthy string is accepted

---

## BR-3: Required Title Field

**Rule**: Every task must have a non-empty title. This is the only required field.

**Validation logic**:
```
input → trim(input) → result
  if result.length === 0 → REJECT (throw Error)
  if result.length > 0  → ACCEPT (use trimmed value)
```

**Enforcement points**:
- `store.createTask(title, desc)`: validates before creating
- `store.editTask(id, { title })`: validates before updating (only if title field is being changed)
- UI modal: submit button triggers validation, shows red border on empty input

**What counts as "empty"**:
| Input | Trimmed | Valid? |
|-------|---------|--------|
| `"Buy milk"` | `"Buy milk"` | ✅ Yes |
| `"  Buy milk  "` | `"Buy milk"` | ✅ Yes (whitespace trimmed) |
| `""` | `""` | ❌ No |
| `"   "` | `""` | ❌ No (whitespace only) |
| `"\n\t"` | `""` | ❌ No (whitespace only) |
| `"0"` | `"0"` | ✅ Yes (string "0" is not empty) |

**Description field**: Never validated. Any string (including empty) is acceptable. Always trimmed on save for consistency but never rejected.

**Error message**: `"Title must not be empty"` — thrown as a standard Error object.

---

## BR-4: Sample Data Seeding

**Rule**: On first visit (no existing localStorage data), the board initializes with 5 sample tasks that demonstrate the board's functionality.

**Trigger conditions** (any of these → seed sample data):
1. `localStorage.getItem('sdd-task-board-state')` returns `null`
2. Stored value fails `JSON.parse()` (corrupted JSON)
3. Parsed value doesn't have a `tasks` array property (invalid shape)

**Sample data specification**:

| # | Title | Description | Column | Order |
|---|-------|-------------|--------|-------|
| 1 | Review project requirements | Read through the PRD and note questions | todo | 0 |
| 2 | Set up development environment | _(empty)_ | todo | 1 |
| 3 | Design database schema | Include user and task tables | todo | 2 |
| 4 | Implement authentication | OAuth2 flow with refresh tokens | in-progress | 0 |
| 5 | Write API documentation | OpenAPI spec for all endpoints | done | 0 |

**Design rationale**:
- 5 tasks is enough to show a populated board without overwhelming
- Tasks spread across all 3 columns → demonstrates the full workflow visually
- Titles are realistic developer tasks → relatable for the target audience
- Mix of with/without descriptions → shows both states
- Descriptions hint at technical depth → suggests real-world usage

**Important**: Each sample task gets a fresh UUID on every seed operation. Sample data UUIDs are never hardcoded strings.

---

## BR-5: Deletion Confirmation

**Rule**: Deleting a task requires explicit user confirmation. There is no undo.

**Confirmation flow**:
```
User clicks Delete
  → System shows dialog:
      Title: "Delete Task"
      Message: "Are you sure you want to delete '[task title]'? This cannot be undone."
      Actions: [Cancel] [Delete]
  → User clicks Delete → task permanently removed
  → User clicks Cancel → no action, dialog closes
  → User clicks overlay → no action, dialog closes
  → User presses Escape → no action, dialog closes
```

**Accessibility requirements for confirmation dialog**:
- `role="alertdialog"` (not just `dialog` — this is a destructive action)
- `aria-labelledby` pointing to the dialog title
- `aria-describedby` pointing to the message text
- Focus moves to Cancel button on open (safe default)
- Focus is trapped within dialog while open

**What "permanent" means**:
- Task is removed from the in-memory array
- localStorage is updated immediately
- There is no undo stack, no trash bin, no soft-delete
- Once confirmed, the only way to recover is to clear localStorage (which resets to sample data)

**Edge cases**:
- Task deleted by another tab while dialog is open → on confirm, `deleteTask()` throws "Task not found" → dialog closes, board re-renders (task already gone)
- Very long task title in dialog → CSS truncates with ellipsis or wraps (no overflow)

---

## BR-6: Persistence on Every State Change

**Rule**: The application saves the complete board state to localStorage after every mutation. There is no explicit "Save" button and no batching of writes.

**Mutations that trigger save**:
| Operation | Method | Save triggered? |
|-----------|--------|----------------|
| Create task | `createTask()` | ✅ Yes |
| Edit task | `editTask()` | ✅ Yes |
| Move task | `moveTask()` | ✅ Yes |
| Delete task | `deleteTask()` | ✅ Yes |
| Reorder task | `reorderTask()` | ✅ Yes |
| Read state | `getState()` | ❌ No (read-only) |
| Get column tasks | `getTasks()` | ❌ No (read-only) |

**Save format**:
```json
{
  "tasks": [
    {
      "id": "a1b2c3d4-...",
      "title": "Task title",
      "description": "Optional description",
      "column": "todo",
      "order": 0
    }
  ]
}
```

**Performance consideration**: For a board with 50 tasks, each save writes ~5KB to localStorage. `JSON.stringify()` + `localStorage.setItem()` completes in < 1ms. No performance concern at expected scale.

**Failure handling**:
- If `localStorage.setItem()` throws (quota exceeded, private browsing) → log `console.warn`, continue operating in-memory
- The app doesn't become unusable — it just won't persist across page reloads
- No user-facing error for localStorage failures (would be noisy and confusing for a demo)

**Multi-tab behaviour** (not explicitly supported, but considered):
- Two tabs open the same board → each tab has its own in-memory state
- Saves from one tab overwrite the other's data in localStorage
- The other tab won't see changes until it reloads
- This is acceptable for a demo app — no real-time sync needed

---

## Rule Interaction Matrix

Shows how business rules interact with each other:

| Rule | Interacts with | Interaction |
|------|---------------|-------------|
| BR-1 (Columns) | BR-4 (Sample Data) | Sample data must use only valid column IDs |
| BR-2 (UUID) | BR-4 (Sample Data) | Sample data gets fresh UUIDs, never hardcoded |
| BR-3 (Title) | BR-4 (Sample Data) | All sample tasks must have non-empty titles |
| BR-5 (Confirm Delete) | BR-6 (Persistence) | Save happens after confirmation, not before |
| BR-6 (Persistence) | BR-4 (Sample Data) | First save happens immediately after seeding |
| BR-1 (Columns) | FR-3 (Movement) | Movement target must be a valid column |

---

## Validation Summary

| What is validated | Where | When | Error |
|-------------------|-------|------|-------|
| Task title non-empty | `store.createTask`, `store.editTask` | On create, on edit (if title changing) | `Error("Title must not be empty")` |
| Target column valid | `store.moveTask` | On move | `Error("Invalid column: {value}")` |
| Task exists | All mutation methods | Before mutation | `Error("Task not found: {id}")` |
| localStorage readable | `store._load` | On init | Graceful fallback to sample data |
| localStorage writable | `store._save` | On every mutation | Graceful fallback (warn + continue) |
