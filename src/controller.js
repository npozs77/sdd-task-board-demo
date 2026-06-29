/**
 * Interaction Controller — Drag/Drop, Keyboard, Modals
 * Wires user interactions to Store operations and visual feedback.
 *
 * Requirements covered:
 * - FR-3: Task movement (drag-and-drop system)
 * - FR-4: Task editing/deletion (modals, confirmation dialog)
 * - FR-6: Task ordering (keyboard reorder, drag reorder within column)
 * - FR-7: Visual feedback (drag classes, drop zone activation)
 * - NFR-2: Accessibility (keyboard nav: Tab, Enter, Ctrl+Arrows, Escape)
 * - NFR-4: Performance (event delegation — single listener on root)
 * - BR-3: Required title (modal validation, red border on empty)
 * - BR-5: Deletion confirmation (alertdialog with explicit confirm)
 */

/**
 * Controller manages all user interactions on the board.
 */
export class Controller {
  /**
   * @param {HTMLElement} root - Board root element
   * @param {import('./store.js').TaskStore} store - Data store
   */
  constructor(root, store) {
    this._root = root;
    this._store = store;
    this._draggedTaskId = null;
    this._activeModal = null;

    this._bindEvents();
  }

  /**
   * Attach all event listeners using delegation.
   */
  _bindEvents() {
    this._root.addEventListener('dragstart', (e) => this._onDragStart(e));
    this._root.addEventListener('dragover', (e) => this._onDragOver(e));
    this._root.addEventListener('dragleave', (e) => this._onDragLeave(e));
    this._root.addEventListener('drop', (e) => this._onDrop(e));
    this._root.addEventListener('dragend', (e) => this._onDragEnd(e));
    this._root.addEventListener('click', (e) => this._onClick(e));
    this._root.addEventListener('keydown', (e) => this._onKeyDown(e));
  }

  // ─── Drag & Drop [FR-3: Task Movement] ───

  /** @param {DragEvent} e */
  _onDragStart(e) {
    const card = e.target.closest('.task-card');
    if (!card) return;

    this._draggedTaskId = card.dataset.taskId;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this._draggedTaskId);

    // Activate drop zones (FR-7)
    this._root.querySelectorAll('.column').forEach((col) => {
      col.classList.add('drag-active');
    });
  }

  /** @param {DragEvent} e */
  _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const column = e.target.closest('.column');
    if (column) {
      column.classList.add('drag-over');
    }
  }

  /** @param {DragEvent} e */
  _onDragLeave(e) {
    const column = e.target.closest('.column');
    if (column && !column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  }

  /** @param {DragEvent} e */
  _onDrop(e) {
    e.preventDefault();
    const column = e.target.closest('.column');
    if (!column || !this._draggedTaskId) return;

    const targetColumn = column.dataset.column;

    // Calculate drop position from mouse position relative to cards
    const cards = [...column.querySelectorAll('.task-card:not(.dragging)')];
    let position = cards.length;

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        position = i;
        break;
      }
    }

    try {
      this._store.moveTask(this._draggedTaskId, targetColumn, position);
    } catch (err) {
      console.warn('Controller: move failed', err.message);
    }

    this._cleanup();
  }

  /** @param {DragEvent} e */
  _onDragEnd(e) {
    this._cleanup();
  }

  /**
   * Remove all drag visual states.
   */
  _cleanup() {
    this._draggedTaskId = null;
    this._root.querySelectorAll('.dragging').forEach((el) => {
      el.classList.remove('dragging');
    });
    this._root.querySelectorAll('.drag-active').forEach((el) => {
      el.classList.remove('drag-active');
    });
    this._root.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
  }

  // ─── Click Handlers ───

  /** @param {MouseEvent} e */
  _onClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const taskId = target.dataset.taskId;

    switch (action) {
      case 'add-task':
        this._showAddModal();
        break;
      case 'edit':
        this._showEditModal(taskId);
        break;
      case 'delete':
        this._showDeleteConfirm(taskId);
        break;
    }
  }

  // ─── Keyboard Navigation [NFR-2: Accessibility] ───

  /** @param {KeyboardEvent} e */
  _onKeyDown(e) {
    const card = e.target.closest('.task-card');
    if (!card) return;

    const taskId = card.dataset.taskId;

    if (e.key === 'Enter') {
      e.preventDefault();
      this._showEditModal(taskId);
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this._showDeleteConfirm(taskId);
      return;
    }

    // Ctrl+Arrow for moving tasks between columns
    if (e.ctrlKey || e.metaKey) {
      const task = this._store.getState().find((t) => t.id === taskId);
      if (!task) return;

      const columns = ['todo', 'in-progress', 'done'];
      const currentIndex = columns.indexOf(task.column);

      if (e.key === 'ArrowRight' && currentIndex < columns.length - 1) {
        e.preventDefault();
        this._store.moveTask(taskId, columns[currentIndex + 1]);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        this._store.moveTask(taskId, columns[currentIndex - 1]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._store.reorderTask(taskId, task.order - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._store.reorderTask(taskId, task.order + 1);
      }
    }
  }

  // ─── Modals ───

  /**
   * Show the "Add Task" modal.
   */
  _showAddModal() {
    this._showModal({
      title: 'Add Task',
      fields: [
        { name: 'title', label: 'Title', type: 'input', required: true },
        { name: 'description', label: 'Description', type: 'textarea' }
      ],
      onSubmit: (data) => {
        this._store.createTask(data.title, data.description || '');
      }
    });
  }

  /**
   * Show the "Edit Task" modal pre-filled with current values.
   * @param {string} taskId
   */
  _showEditModal(taskId) {
    const task = this._store.getState().find((t) => t.id === taskId);
    if (!task) return;

    this._showModal({
      title: 'Edit Task',
      fields: [
        { name: 'title', label: 'Title', type: 'input', required: true, value: task.title },
        { name: 'description', label: 'Description', type: 'textarea', value: task.description }
      ],
      onSubmit: (data) => {
        this._store.editTask(taskId, { title: data.title, description: data.description || '' });
      }
    });
  }

  /**
   * Show delete confirmation dialog. [BR-5: Deletion Confirmation]
   * Uses role="alertdialog" for destructive action accessibility.
   * @param {string} taskId
   */
  _showDeleteConfirm(taskId) {
    const task = this._store.getState().find((t) => t.id === taskId);
    if (!task) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
        <h2 id="confirm-title">Delete Task</h2>
        <p id="confirm-desc">Are you sure you want to delete "${task.title}"? This cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn-secondary" data-modal-action="cancel">Cancel</button>
          <button class="btn-primary" style="background:var(--danger);border-color:var(--danger)" data-modal-action="confirm">Delete</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      const action = e.target.closest('[data-modal-action]');
      if (!action && e.target === overlay) {
        overlay.remove();
        return;
      }
      if (!action) return;

      if (action.dataset.modalAction === 'confirm') {
        this._store.deleteTask(taskId);
      }
      overlay.remove();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.remove();
    });

    document.body.appendChild(overlay);
    overlay.querySelector('[data-modal-action="cancel"]').focus();
  }

  /**
   * Generic modal with form fields.
   * @param {{ title: string, fields: Array, onSubmit: Function }} config
   */
  _showModal({ title, fields, onSubmit }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const fieldHtml = fields.map((f) => {
      const val = f.value || '';
      const req = f.required ? 'required' : '';
      if (f.type === 'textarea') {
        return `<label for="modal-${f.name}">${f.label}</label>
          <textarea id="modal-${f.name}" name="${f.name}" ${req}>${val}</textarea>`;
      }
      return `<label for="modal-${f.name}">${f.label}</label>
        <input id="modal-${f.name}" name="${f.name}" type="text" value="${val}" ${req}>`;
    }).join('');

    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-labelledby="modal-title">
        <h2 id="modal-title">${title}</h2>
        <form>
          ${fieldHtml}
          <div class="modal-actions">
            <button type="button" class="btn-secondary" data-modal-action="cancel">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    `;

    const form = overlay.querySelector('form');
    const firstInput = form.querySelector('input, textarea');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {};
      fields.forEach((f) => {
        data[f.name] = form.querySelector(`[name="${f.name}"]`).value;
      });

      // Validate required fields
      for (const f of fields) {
        if (f.required && !data[f.name].trim()) {
          const input = form.querySelector(`[name="${f.name}"]`);
          input.style.borderColor = 'var(--danger)';
          input.focus();
          return;
        }
      }

      try {
        onSubmit(data);
        overlay.remove();
      } catch (err) {
        console.warn('Controller: modal submit failed', err.message);
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
      const action = e.target.closest('[data-modal-action]');
      if (action && action.dataset.modalAction === 'cancel') overlay.remove();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.remove();
    });

    document.body.appendChild(overlay);
    if (firstInput) firstInput.focus();
  }
}
