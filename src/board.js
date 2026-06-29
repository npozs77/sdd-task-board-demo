/**
 * Board Renderer — DOM Construction and Updates
 * Builds the board UI from store state, subscribes to changes.
 *
 * Requirements covered:
 * - FR-1: Board structure (3 columns rendered from COLUMNS config)
 * - FR-7: Visual feedback (drop zones, drag state classes, empty state)
 * - NFR-1: Zero dependencies (pure DOM API)
 * - NFR-2: Accessibility (ARIA roles, labels, heading hierarchy, tabindex)
 * - NFR-3: Responsive layout (CSS Grid, handled in styles.css)
 * - NFR-4: Performance (DocumentFragment for batch DOM writes)
 * - NFR-6: Code quality (JSDoc, ≤50 line functions, meaningful names)
 */

const COLUMNS = [
  { id: 'todo', name: 'To Do', cssClass: 'column--todo' },           // FR-1, BR-1
  { id: 'in-progress', name: 'In Progress', cssClass: 'column--in-progress' }, // FR-1, BR-1
  { id: 'done', name: 'Done', cssClass: 'column--done' }             // FR-1, BR-1
];

/**
 * BoardRenderer builds and updates the task board DOM.
 * Subscribes to store 'change' events for reactive updates.
 */
export class BoardRenderer {
  /**
   * @param {HTMLElement} root - Container element
   * @param {import('./store.js').TaskStore} store - Data store
   */
  constructor(root, store) {
    if (!root) {
      throw new Error('Board root element not found');
    }
    this._root = root;
    this._store = store;
    this._handleChange = () => this.render();

    this._store.on('change', this._handleChange);
    this.render();
  }

  /**
   * Full re-render of the board from current state.
   * Uses DocumentFragment for batch DOM updates. [NFR-4: Performance]
   */
  render() {
    const fragment = document.createDocumentFragment();
    const board = document.createElement('div');
    board.className = 'board';
    board.setAttribute('role', 'region');
    board.setAttribute('aria-label', 'Task Board');

    for (const col of COLUMNS) {
      board.appendChild(this._renderColumn(col));
    }

    fragment.appendChild(board);
    this._root.innerHTML = '';
    this._root.appendChild(fragment);
  }

  /**
   * Render a single column with its tasks.
   * @param {{ id: string, name: string, cssClass: string }} col
   * @returns {HTMLElement}
   */
  _renderColumn(col) {
    const tasks = this._store.getTasks(col.id);

    const section = document.createElement('section');
    section.className = `column ${col.cssClass}`;
    section.dataset.column = col.id;
    section.setAttribute('aria-label', col.name);

    // Header
    const header = document.createElement('h2');
    header.className = 'column-header';
    header.innerHTML = `${col.name} <span class="count">(${tasks.length})</span>`;
    section.appendChild(header);

    // Task list
    const list = document.createElement('div');
    list.className = 'column-tasks';
    list.setAttribute('role', 'list');

    if (tasks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'column-empty';
      empty.textContent = 'No tasks';
      list.appendChild(empty);
    } else {
      for (const task of tasks) {
        list.appendChild(this._renderCard(task));
      }
    }

    section.appendChild(list);

    // Drop zone indicator (FR-7)
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.setAttribute('aria-hidden', 'true');
    dropZone.textContent = 'Drop here';
    section.appendChild(dropZone);

    // Add task button (only in "todo" column)
    if (col.id === 'todo') {
      const addBtn = document.createElement('button');
      addBtn.className = 'btn-add-task';
      addBtn.textContent = '+ Add task';
      addBtn.setAttribute('aria-label', 'Add new task');
      addBtn.dataset.action = 'add-task';
      section.appendChild(addBtn);
    }

    return section;
  }

  /**
   * Render a single task card.
   * @param {Object} task - Task data
   * @returns {HTMLElement}
   */
  _renderCard(task) {
    const article = document.createElement('article');
    article.className = 'task-card';
    article.dataset.taskId = task.id;
    article.setAttribute('role', 'listitem');
    article.setAttribute('draggable', 'true');
    article.setAttribute('aria-label', task.title || '[Untitled]');
    article.setAttribute('tabindex', '0');

    // Title
    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title || '[Untitled]';
    article.appendChild(title);

    // Description
    if (task.description) {
      const desc = document.createElement('p');
      desc.className = 'task-description';
      desc.textContent = task.description;
      article.appendChild(desc);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${task.title}`);
    editBtn.dataset.action = 'edit';
    editBtn.dataset.taskId = task.id;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete ${task.title}`);
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.taskId = task.id;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    article.appendChild(actions);

    return article;
  }

  /**
   * Cleanup: remove event listener and clear DOM.
   */
  destroy() {
    this._store.off('change', this._handleChange);
    this._root.innerHTML = '';
  }
}
