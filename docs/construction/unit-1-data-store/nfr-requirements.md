# NFR Requirements — Unit 1: Data Store

## Performance

| ID | Requirement |
|---|---|
| PERF-1.1 | `createTask()`, `editTask()`, `moveTask()`, `deleteTask()` shall complete in under 1ms for boards with ≤ 50 tasks |
| PERF-1.2 | `_save()` (JSON.stringify + localStorage.setItem) shall complete in under 2ms for typical state (~5KB) |
| PERF-1.3 | `_load()` on init shall complete in under 5ms (parse + validate + hydrate) |

## Reliability

| ID | Requirement |
|---|---|
| REL-1.1 | Corrupted localStorage JSON must not crash the application — graceful fallback to sample data with console warning |
| REL-1.2 | localStorage unavailability (private browsing, quota exceeded) must not prevent app from functioning — in-memory operation with warning |
| REL-1.3 | Passing invalid task IDs to mutation methods must throw descriptive errors, not produce undefined behaviour |
| REL-1.4 | Calling `_emit('change')` when no listeners are registered must be a no-op (no throw) |

## Correctness

| ID | Requirement |
|---|---|
| COR-1.1 | Order values within any column must always be sequential (0, 1, 2, ...) — no gaps after any operation |
| COR-1.2 | `moveTask()` must validate targetColumn against `VALID_COLUMNS` before any state mutation — fail-fast |
| COR-1.3 | Title validation must use string-empty check (trim + length), not falsy check — `"0"` is a valid title |
| COR-1.4 | `generateId()` must produce RFC 4122 v4 compliant UUIDs (36 characters, correct format) |

## Extensibility

| ID | Requirement |
|---|---|
| EXT-1.1 | Adding new task fields (e.g., `dueDate`, `priority`) must require only changes to Task construction and persistence — not to CRUD method signatures |
| EXT-1.2 | Changing persistence backend (e.g., IndexedDB) must only require replacing `_load()` and `_save()` — Store interface unchanged |

## Testability

| ID | Requirement |
|---|---|
| TST-1.1 | Store must be instantiable in a test environment with mocked localStorage — no browser dependency in unit tests |
| TST-1.2 | All error paths must be reachable via public API calls (no private-only error conditions) |
| TST-1.3 | Event emission must be verifiable via `on('change', spy)` pattern |
