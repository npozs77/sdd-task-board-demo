# Application Design — SDD Task Board

## Architecture Overview

Single-page static app with three layers:

```
┌─────────────────────────────────────┐
│           UI Layer (DOM)            │
│  Renders board, handles user events │
├─────────────────────────────────────┤
│         Controller Layer            │
│  Orchestrates actions, coordinates  │
│  between data and UI                │
├─────────────────────────────────────┤
│          Data Layer                 │
│  Task CRUD, localStorage I/O,      │
│  state management                   │
└─────────────────────────────────────┘
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | Vanilla JavaScript (ES2020+) | Zero dependencies, browser-native |
| Styling | Single CSS file, CSS custom properties | Themeable, no preprocessor needed |
| Storage | localStorage JSON | Simplest persistence, no server |
| Drag & Drop | HTML5 Drag and Drop API | Native, no library needed |
| Module system | ES modules (type="module") | Clean separation, native support |

## Component Breakdown

### C1: Data Store (`store.js`)
- Manages board state (tasks array + column assignments)
- Reads/writes localStorage
- Generates UUIDs for new tasks
- Provides CRUD operations: createTask, moveTask, editTask, deleteTask, reorderTask
- Emits change events for UI to react

### C2: Board Renderer (`board.js`)
- Builds DOM from current state
- Creates column elements with drop zones
- Creates task cards with drag handles
- Updates DOM on state changes (reactive re-render or targeted updates)
- Handles responsive layout via CSS (no JS layout logic)

### C3: Interaction Controller (`controller.js`)
- Wires drag-and-drop events (dragstart, dragover, drop)
- Wires button clicks (add task, edit, delete, move)
- Keyboard navigation (tab between cards, enter to activate, arrow keys to move)
- Shows confirmation dialog for delete
- Coordinates between C1 and C2

### C4: Entry Point (`app.js`)
- Initializes store (load from localStorage or seed sample data)
- Creates controller and renderer
- Mounts board to DOM

## Data Model

```javascript
// Board state shape
{
  tasks: [
    {
      id: "uuid-string",
      title: "Task title",
      description: "Optional description",
      column: "todo" | "in-progress" | "done",
      order: 0  // position within column
    }
  ]
}
```

## Data Flows

### Create Task
```
User clicks "Add" → Controller.handleAddTask()
  → prompt for title → Store.createTask(title, desc)
  → localStorage updated → change event
  → Renderer.updateColumn("todo")
```

### Move Task (drag)
```
User drags card → Controller.handleDragStart(taskId)
  → visual feedback (ghost, opacity)
  → User drops on column → Controller.handleDrop(taskId, targetColumn, position)
  → Store.moveTask(taskId, targetColumn, position)
  → localStorage updated → change event
  → Renderer.updateColumn(sourceCol) + Renderer.updateColumn(targetCol)
```

### Edit Task
```
User clicks edit → Controller.handleEdit(taskId)
  → inline form appears → User submits
  → Store.editTask(taskId, {title, description})
  → localStorage updated → change event
  → Renderer.updateCard(taskId)
```

## File Structure

```
src/
├── index.html        # Shell: loads CSS + app.js
├── styles.css        # All styling (custom properties, responsive, a11y)
├── app.js            # Entry point: init + mount
├── store.js          # Data layer: CRUD + localStorage + events
├── board.js          # UI layer: DOM rendering
└── controller.js     # Interaction: drag/drop, keyboard, buttons
```

## High-Level Design

### State Management Pattern
Event-driven: Store holds state, emits `change` events. Renderer subscribes and re-renders affected columns. No framework, no virtual DOM — direct DOM manipulation guided by state diffs.

### Accessibility Architecture
- Board uses `role="region"` with `aria-label` per column
- Tasks use `role="article"` with `aria-label` = task title
- Move buttons have `aria-label="Move [task] to [column]"`
- Keyboard: Tab focuses cards sequentially; Enter opens actions; Arrow keys (with modifier) move between columns
- Focus management: after move, focus follows the card to its new position

### Responsive Strategy
CSS Grid for columns. At mobile breakpoint (< 640px), grid collapses to single column with section headers. No JS involved in layout changes.
