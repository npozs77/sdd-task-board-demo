/**
 * Data Store — Task Board State Management
 * Handles CRUD operations, localStorage persistence, and change events.
 *
 * Requirements covered:
 * - FR-1: Board structure (VALID_COLUMNS)
 * - FR-2: Task management (createTask, editTask)
 * - FR-5: Data persistence (_load, _save)
 * - FR-6: Task ordering (reorderTask, _normalizeOrder)
 * - BR-1: Fixed columns (VALID_COLUMNS validation)
 * - BR-2: UUID identity (generateId)
 * - BR-3: Required title (validation in create/edit)
 * - BR-4: Sample data (createSampleData)
 * - BR-5: Deletion (deleteTask — confirmation is UI layer)
 * - BR-6: Persistence timing (_save called in every mutation)
 */

const STORAGE_KEY = 'sdd-task-board-state';
const VALID_COLUMNS = ['todo', 'in-progress', 'done']; // BR-1: Fixed column structure

/**
 * Generate a UUID v4 string. [BR-2: Task Identity]
 * Uses crypto.randomUUID() where available, falls back to manual generation.
 * @returns {string} UUID string
 */
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

/**
 * Creates sample tasks for first-time visitors. [BR-4: Sample Data Seeding]
 * @returns {Array<Object>} Array of 5 sample tasks across all columns
 */
function createSampleData() {
  return [
    { id: generateId(), title: 'Review project requirements', description: 'Read through the PRD and note questions', column: 'todo', order: 0 },
    { id: generateId(), title: 'Set up development environment', description: '', column: 'todo', order: 1 },
    { id: generateId(), title: 'Design database schema', description: 'Include user and task tables', column: 'todo', order: 2 },
    { id: generateId(), title: 'Implement authentication', description: 'OAuth2 flow with refresh tokens', column: 'in-progress', order: 0 },
    { id: generateId(), title: 'Write API documentation', description: 'OpenAPI spec for all endpoints', column: 'done', order: 0 }
  ];
}

/**
 * TaskStore manages board state with localStorage persistence.
 * Emits 'change' events on every mutation for reactive UI updates.
 */
export class TaskStore {
  constructor() {
    /** @type {Array<Object>} */
    this._tasks = [];
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();

    this._load();
  }

  /**
   * Load state from localStorage, or seed sample data on first visit.
   * [FR-5: Data Persistence] [BR-4: Sample Data] [BR-6: Persistence Timing]
   * Handles corrupted JSON gracefully — treats as first visit.
   */
  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        this._tasks = createSampleData();
        this._save();
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tasks)) {
        this._tasks = parsed.tasks;
      } else {
        throw new Error('Invalid state format');
      }
    } catch (e) {
      console.warn('TaskStore: Failed to load state, seeding sample data.', e.message);
      this._tasks = createSampleData();
      this._save();
    }
  }

  /**
   * Persist current state to localStorage. [BR-6: Save on every mutation]
   */
  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: this._tasks }));
    } catch (e) {
      console.warn('TaskStore: localStorage write failed.', e.message);
    }
  }

  /**
   * Emit a named event to all registered listeners.
   * @param {string} event - Event name
   */
  _emit(event) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => fn());
    }
  }

  /**
   * Register a listener for an event.
   * @param {string} event - Event name (e.g., 'change')
   * @param {Function} callback - Handler function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
  }

  /**
   * Remove a listener for an event.
   * @param {string} event - Event name
   * @param {Function} callback - Handler to remove
   */
  off(event, callback) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(callback);
    }
  }

  /**
   * Recompute order values for tasks in a column to be sequential.
   * @param {string} column - Column to normalize
   */
  _normalizeOrder(column) {
    this._tasks
      .filter((t) => t.column === column)
      .sort((a, b) => a.order - b.order)
      .forEach((t, i) => { t.order = i; });
  }

  /**
   * Get all tasks (full state).
   * @returns {Array<Object>} Copy of all tasks
   */
  getState() {
    return [...this._tasks];
  }

  /**
   * Get tasks for a specific column, sorted by order.
   * @param {string} column - Column name
   * @returns {Array<Object>} Tasks in that column, ordered
   */
  getTasks(column) {
    return this._tasks
      .filter((t) => t.column === column)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Create a new task in the "todo" column. [FR-2: Task Management] [BR-2: UUID] [BR-3: Required Title]
   * @param {string} title - Task title (must be non-empty)
   * @param {string} [description=''] - Optional description
   * @returns {Object} The created task
   */
  createTask(title, description = '') {
    const trimmed = (title || '').trim();
    if (!trimmed) {
      throw new Error('Title must not be empty');
    }

    const todoTasks = this.getTasks('todo');
    const task = {
      id: generateId(),
      title: trimmed,
      description: description.trim(),
      column: 'todo',
      order: todoTasks.length
    };

    this._tasks.push(task);
    this._save();
    this._emit('change');
    return task;
  }

  /**
   * Edit an existing task's title and/or description. [FR-4: Task Editing] [BR-3: Required Title]
   * @param {string} id - Task ID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.title] - New title
   * @param {string} [updates.description] - New description
   */
  editTask(id, { title, description } = {}) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) {
        throw new Error('Title must not be empty');
      }
      task.title = trimmed;
    }

    if (description !== undefined) {
      task.description = description.trim();
    }

    this._save();
    this._emit('change');
  }

  /**
   * Move a task to a different column. [FR-3: Task Movement] [BR-1: Fixed Columns]
   * @param {string} id - Task ID
   * @param {string} targetColumn - Destination column
   * @param {number} [position] - Position in target column (defaults to end)
   */
  moveTask(id, targetColumn, position) {
    if (!VALID_COLUMNS.includes(targetColumn)) {
      throw new Error(`Invalid column: ${targetColumn}`);
    }

    const task = this._tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const sourceColumn = task.column;
    task.column = targetColumn;

    // Normalize source column
    this._normalizeOrder(sourceColumn);

    // Insert at position in target column
    const targetTasks = this._tasks
      .filter((t) => t.column === targetColumn && t.id !== id)
      .sort((a, b) => a.order - b.order);

    const insertAt = position !== undefined ? position : targetTasks.length;
    targetTasks.splice(insertAt, 0, task);
    targetTasks.forEach((t, i) => { t.order = i; });

    this._save();
    this._emit('change');
  }

  /**
   * Delete a task permanently. [FR-4: Task Deletion] [BR-5: Confirmation is UI concern]
   * @param {string} id - Task ID
   */
  deleteTask(id) {
    const index = this._tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }

    const column = this._tasks[index].column;
    this._tasks.splice(index, 1);
    this._normalizeOrder(column);

    this._save();
    this._emit('change');
  }

  /**
   * Reorder a task within its current column. [FR-6: Task Ordering]
   * @param {string} id - Task ID
   * @param {number} newPosition - New position (0-based)
   */
  reorderTask(id, newPosition) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const columnTasks = this._tasks
      .filter((t) => t.column === task.column)
      .sort((a, b) => a.order - b.order);

    // Remove task from current position
    const currentIndex = columnTasks.findIndex((t) => t.id === id);
    columnTasks.splice(currentIndex, 1);

    // Insert at new position
    const clampedPosition = Math.max(0, Math.min(newPosition, columnTasks.length));
    columnTasks.splice(clampedPosition, 0, task);

    // Update order values
    columnTasks.forEach((t, i) => { t.order = i; });

    this._save();
    this._emit('change');
  }
}
