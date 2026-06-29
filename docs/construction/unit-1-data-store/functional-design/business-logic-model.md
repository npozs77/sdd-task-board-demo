# Business Logic Model — Unit 1: Data Store

## Overview

The Data Store is the single source of truth for all board state. It manages CRUD operations on tasks, enforces business rule invariants, persists state to localStorage, and emits change events for the UI layer to subscribe to.

The store is **stateful** (holds the task array in memory) but **deterministic** in behaviour: same sequence of operations always produces same state, regardless of timing or calling context.

---

## Primary Workflows

### Workflow 1: Create Task

```
title (string), description (string, optional)
    │
    ▼
[1] Trim title string
    │
    ▼
[2] Validate title is non-empty after trim
    │        │
    │     [FAIL] → throw Error("Title must not be empty")
    │
    ▼
[3] Generate task ID via crypto.randomUUID()
    │        │
    │     [FALLBACK] → RFC 4122 v4 manual generation if crypto unavailable
    │
    ▼
[4] Determine order value: count existing tasks where column === 'todo'
    │
    ▼
[5] Construct Task object:
    │   { id, title: trimmed, description: (desc ?? '').trim(),
    │     column: 'todo', order: count }
    │
    ▼
[6] Append to internal tasks array
    │
    ▼
[7] Persist full state to localStorage
    │        │
    │     [FAIL] → console.warn, continue (graceful degradation)
    │
    ▼
[8] Emit 'change' event to all subscribers
    │
    ▼
Return: created Task object
```

### Workflow 2: Move Task

```
id (string), targetColumn (string), position (number, optional)
    │
    ▼
[1] Validate targetColumn ∈ VALID_COLUMNS
    │        │
    │     [FAIL] → throw Error("Invalid column: {targetColumn}")
    │
    ▼
[2] Find task by id in internal array
    │        │
    │     [FAIL] → throw Error("Task not found: {id}")
    │
    ▼
[3] Record sourceColumn = task.column
    │
    ▼
[4] Set task.column = targetColumn
    │
    ▼
[5] Normalize order in sourceColumn:
    │   filter tasks by sourceColumn (exclude moved task)
    │   sort by order ascending
    │   reassign order = 0, 1, 2, ... (close gaps)
    │
    ▼
[6] Calculate insert position in targetColumn:
    │   Get tasks in targetColumn (exclude moved task if same column)
    │   Sort by order ascending
    │   Clamp position to [0, length] (undefined → append to end)
    │   Splice task at position
    │   Reassign order = 0, 1, 2, ...
    │
    ▼
[7] Persist full state to localStorage
    │        │
    │     [FAIL] → console.warn, continue
    │
    ▼
[8] Emit 'change' event
```

### Workflow 3: Edit Task

```
id (string), updates ({ title?: string, description?: string })
    │
    ▼
[1] Find task by id
    │        │
    │     [FAIL] → throw Error("Task not found: {id}")
    │
    ▼
[2] If updates.title is defined:
    │   [2a] Trim title
    │   [2b] Validate non-empty after trim
    │        │
    │     [FAIL] → throw Error("Title must not be empty")
    │   [2c] Set task.title = trimmed value
    │
    ▼
[3] If updates.description is defined:
    │   Set task.description = updates.description.trim()
    │
    ▼
[4] Persist full state to localStorage
    │
    ▼
[5] Emit 'change' event
```

### Workflow 4: Delete Task

```
id (string)
    │
    ▼
[1] Find task index by id
    │        │
    │     [FAIL] → throw Error("Task not found: {id}")
    │
    ▼
[2] Record column = tasks[index].column
    │
    ▼
[3] Remove task from array (splice at index)
    │
    ▼
[4] Normalize order in affected column:
    │   filter remaining tasks by column
    │   sort by order ascending
    │   reassign order = 0, 1, 2, ... (no gaps)
    │
    ▼
[5] Persist full state to localStorage
    │
    ▼
[6] Emit 'change' event
```

### Workflow 5: Reorder Task (within column)

```
id (string), newPosition (number)
    │
    ▼
[1] Find task by id
    │        │
    │     [FAIL] → throw Error("Task not found: {id}")
    │
    ▼
[2] Get all tasks in task.column, sorted by order
    │
    ▼
[3] Remove task from current position in sorted list
    │
    ▼
[4] Clamp newPosition to [0, remaining.length]
    │
    ▼
[5] Splice task at clamped position
    │
    ▼
[6] Reassign order = 0, 1, 2, ... for all tasks in column
    │
    ▼
[7] Persist + emit 'change'
```

### Workflow 6: Initialize (constructor)

```
new TaskStore()
    │
    ▼
[1] Initialize empty listeners map
    │
    ▼
[2] Try localStorage.getItem(STORAGE_KEY)
    │        │
    │     [null] → seed sample data, persist, return
    │
    ▼
[3] Try JSON.parse(raw)
    │        │
    │     [FAIL: SyntaxError] → warn, seed sample data, persist, return
    │
    ▼
[4] Validate parsed.tasks is Array
    │        │
    │     [FAIL] → warn, seed sample data, persist, return
    │
    ▼
[5] Set internal state = parsed.tasks
```

---

## Domain Entities

### Task

```typescript
interface Task {
  /** UUID v4, immutable after creation. [BR-2] */
  id: string;

  /** Non-empty after trim. [BR-3] */
  title: string;

  /** Any string including empty. Trimmed on save. */
  description: string;

  /** Current column assignment. Must be one of VALID_COLUMNS. [BR-1] */
  column: 'todo' | 'in-progress' | 'done';

  /** 0-based position within column. Sequential, no gaps. [FR-6] */
  order: number;
}
```

### BoardState (persistence shape)

```typescript
interface BoardState {
  tasks: Task[];
}
```

### Constants

```typescript
/** [BR-1] Exactly 3 columns. Immutable. Used for validation in moveTask(). */
const VALID_COLUMNS: readonly string[] = ['todo', 'in-progress', 'done'];

/** [FR-5] localStorage key for board state. */
const STORAGE_KEY = 'sdd-task-board-state';
```

---

## Event System

### Design

Synchronous pub/sub. No event payload — listeners call `getState()` or `getTasks(column)` to get current state.

```typescript
interface EventEmitter {
  /** Register a callback for an event. */
  on(event: 'change', callback: () => void): void;

  /** Remove a previously registered callback. */
  off(event: 'change', callback: () => void): void;

  /** Internal: invoke all registered callbacks for event. */
  _emit(event: 'change'): void;
}
```

### Behaviour

- `_emit('change')` is called at the end of every successful mutation (create, edit, move, delete, reorder)
- Read operations (`getState`, `getTasks`) never emit
- If a listener throws, other listeners still execute (forEach continues)
- Listeners receive no arguments — they query state themselves

---

## Persistence Layer

### Storage Contract

| Property | Value |
|----------|-------|
| Key | `'sdd-task-board-state'` |
| Format | `JSON.stringify({ tasks: Task[] })` |
| Read trigger | Constructor (once, on init) |
| Write trigger | Every successful mutation [BR-6] |
| Max expected size | ~5KB for 50 tasks |

### Graceful Degradation

| Scenario | localStorage status | Behaviour |
|----------|-------------------|-----------|
| Normal operation | Available, writable | Read on init, write on every mutation |
| Private browsing | Throws on setItem | In-memory only, warn per write failure |
| Quota exceeded | Throws on setItem | In-memory only, warn per write failure |
| Corrupted JSON in storage | Available but invalid | Warn, seed sample data, overwrite |
| Key deleted between sessions | Available but empty | Seed sample data on next load |

---

## Sample Data [BR-4]

Seeded on first visit (or when stored data is invalid):

| # | Title | Description | Column | Order |
|---|-------|-------------|--------|-------|
| 1 | Review project requirements | Read through the PRD and note questions | todo | 0 |
| 2 | Set up development environment | _(empty)_ | todo | 1 |
| 3 | Design database schema | Include user and task tables | todo | 2 |
| 4 | Implement authentication | OAuth2 flow with refresh tokens | in-progress | 0 |
| 5 | Write API documentation | OpenAPI spec for all endpoints | done | 0 |

Each sample task gets a fresh UUID on seeding (never hardcoded IDs). [BR-2]

---

## Order Normalization

### Purpose

After moves and deletes, order values can have gaps (0, 2, 5). Normalization ensures sequential values for correct insertion math.

### Algorithm

```typescript
_normalizeOrder(column: string): void {
  // 1. Filter tasks by column
  // 2. Sort by current order (ascending)
  // 3. Reassign order = index (0, 1, 2, ...)
}
```

### When called

| Operation | Columns normalized |
|-----------|--------------------|
| moveTask | sourceColumn + targetColumn |
| deleteTask | affected column |
| reorderTask | affected column |
| createTask | _(not needed — appends to end, always sequential)_ |
| editTask | _(not needed — doesn't change position)_ |

---

## Error Handling

| Method | Condition | Error |
|--------|-----------|-------|
| createTask | Empty/whitespace title | `Error("Title must not be empty")` |
| editTask | Task ID not found | `Error("Task not found: {id}")` |
| editTask | Empty/whitespace title (when updating title) | `Error("Title must not be empty")` |
| moveTask | Invalid column value | `Error("Invalid column: {value}")` |
| moveTask | Task ID not found | `Error("Task not found: {id}")` |
| deleteTask | Task ID not found | `Error("Task not found: {id}")` |
| reorderTask | Task ID not found | `Error("Task not found: {id}")` |

All errors are standard `Error` objects. Caller is responsible for handling (Controller catches and logs at boundaries).

---

## Public API Summary

```typescript
class TaskStore {
  constructor()                                          // Load from localStorage or seed

  // Queries (no side effects, no events emitted)
  getState(): Task[]                                     // All tasks (shallow copy)
  getTasks(column: string): Task[]                       // Column tasks, sorted by order

  // Mutations (persist + emit 'change')
  createTask(title: string, description?: string): Task  // → new task in 'todo'
  editTask(id: string, updates: Partial<Pick<Task, 'title' | 'description'>>): void
  moveTask(id: string, targetColumn: string, position?: number): void
  deleteTask(id: string): void
  reorderTask(id: string, newPosition: number): void

  // Event subscription
  on(event: 'change', callback: () => void): void
  off(event: 'change', callback: () => void): void
}
```

---

## Requirement Coverage

| Requirement | How satisfied |
|-------------|--------------|
| FR-1 | `VALID_COLUMNS` defines board structure; `getTasks(column)` provides per-column data |
| FR-2 | `createTask()` + `editTask()` — full task CRUD |
| FR-5 | `_load()` in constructor + `_save()` after every mutation |
| FR-6 | `reorderTask()` + order normalization in `moveTask()` and `deleteTask()` |
| BR-1 | `VALID_COLUMNS` constant + validation in `moveTask()` |
| BR-2 | `generateId()` → `crypto.randomUUID()` with RFC 4122 v4 fallback |
| BR-3 | Title trim + empty check in `createTask()` and `editTask()` |
| BR-4 | `createSampleData()` → 5 tasks seeded when localStorage is empty/invalid |
| BR-5 | `deleteTask()` executes removal — confirmation is UI layer (Controller) |
| BR-6 | `_save()` called at the end of every mutation method |
