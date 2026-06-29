# User Stories — SDD Task Board

---

## Epic 1 — Task Management

### US-1.1 — Create a Task
**As** Casey (solo developer), **I want** to add a new task with a title and optional description, **so that** I can capture work items as they arise without leaving the board.

**Acceptance Criteria**:
- AC1: "Add task" button is visible in the To Do column
- AC2: Clicking it opens a modal with title (required) and description (optional) fields
- AC3: Submitting with a valid title creates the task at the bottom of To Do
- AC4: Submitting with empty title shows inline validation (red border, no close)
- AC5: Task appears immediately on board without page reload

### US-1.2 — Edit a Task
**As** Casey, **I want** to modify a task's title or description after creating it, **so that** I can refine task details as I learn more.

**Acceptance Criteria**:
- AC1: Edit button visible on hover or focus of any task card
- AC2: Clicking Edit opens modal pre-filled with current values
- AC3: Modifying and saving updates the card immediately
- AC4: Cancelling leaves the task unchanged

### US-1.3 — Delete a Task
**As** Casey, **I want** to permanently remove a completed or irrelevant task, **so that** the board stays clean.

**Acceptance Criteria**:
- AC1: Delete button visible on hover or focus of any task card
- AC2: Clicking Delete shows confirmation dialog with task title
- AC3: Confirming permanently removes the task (no undo)
- AC4: Cancelling leaves the task in place

---

## Epic 2 — Workflow Management

### US-2.1 — Move Task via Drag
**As** Casey, **I want** to drag a task card from one column to another, **so that** I can progress work through stages naturally.

**Acceptance Criteria**:
- AC1: Cards are draggable (cursor changes to grab)
- AC2: Valid drop targets highlight during drag
- AC3: Dropping on a column moves the task to that column
- AC4: Drop position determines order within target column
- AC5: Original column re-renders without the moved card

### US-2.2 — Move Task via Keyboard
**As** Alex (accessibility user), **I want** to move tasks between columns using keyboard shortcuts, **so that** I have full functionality without a mouse.

**Acceptance Criteria**:
- AC1: Ctrl+Arrow Right moves focused task to next column
- AC2: Ctrl+Arrow Left moves focused task to previous column
- AC3: Movement at boundaries (leftmost/rightmost) is a no-op
- AC4: Focus follows the card to its new position after move

### US-2.3 — Reorder Tasks Within Column
**As** Casey, **I want** to change the order of tasks within a column, **so that** I can prioritise what to work on next.

**Acceptance Criteria**:
- AC1: Dragging within the same column reorders
- AC2: Ctrl+Arrow Up moves focused task up one position
- AC3: Ctrl+Arrow Down moves focused task down one position
- AC4: Reorder at boundaries (top/bottom) is a no-op

---

## Epic 3 — Data Persistence

### US-3.1 — Automatic Save
**As** Casey, **I want** my board state to persist automatically, **so that** I never lose work due to forgetting to save.

**Acceptance Criteria**:
- AC1: Every create/edit/move/delete/reorder saves immediately
- AC2: Refreshing the page restores exact board state
- AC3: No explicit "save" button exists (not needed)

### US-3.2 — First-Visit Experience
**As** Morgan (technical evaluator), **I want** the board to show sample data on first visit, **so that** I immediately see a populated board demonstrating functionality.

**Acceptance Criteria**:
- AC1: First visit (no localStorage data) shows 5 sample tasks
- AC2: Tasks are distributed across all 3 columns
- AC3: Sample tasks have realistic developer-themed content
- AC4: Sample tasks are immediately editable/moveable/deletable

---

## Epic 4 — Accessibility

### US-4.1 — Screen Reader Navigation
**As** Alex, **I want** the board to announce its structure and content via ARIA, **so that** I can understand the board state without seeing it.

**Acceptance Criteria**:
- AC1: Board has landmark role with descriptive label
- AC2: Each column announces its name and task count
- AC3: Each card announces its title on focus
- AC4: Action buttons have descriptive labels ("Edit [task name]")

### US-4.2 — Focus Management in Modals
**As** Alex, **I want** focus to be managed correctly when modals open and close, **so that** I don't lose my place on the board.

**Acceptance Criteria**:
- AC1: Opening a modal moves focus to first input
- AC2: Tab cycles within modal (focus trapped)
- AC3: Escape closes modal
- AC4: Closing modal returns focus to the element that triggered it

---

## Story-to-Requirement Mapping

| Story | Requirements |
|-------|-------------|
| US-1.1 | FR-2, BR-3 |
| US-1.2 | FR-4, BR-3 |
| US-1.3 | FR-4, BR-5 |
| US-2.1 | FR-3, FR-7 |
| US-2.2 | FR-3, NFR-2 |
| US-2.3 | FR-6, NFR-2 |
| US-3.1 | FR-5, BR-6 |
| US-3.2 | BR-4 |
| US-4.1 | NFR-2 |
| US-4.2 | NFR-2 |
