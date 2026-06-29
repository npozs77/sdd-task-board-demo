/**
 * App Entry Point — Initialization and Wiring
 * Creates Store, Renderer, and Controller instances.
 *
 * Requirements covered:
 * - All (orchestration — connects data, UI, and interaction layers)
 * - NFR-6: Code quality (single responsibility, clear initialization)
 *
 * @see docs/inception/application-design/application-design.md — Component C4
 */

import { TaskStore } from './store.js';
import { BoardRenderer } from './board.js';
import { Controller } from './controller.js';

/**
 * Initialize the task board application.
 * Waits for DOM ready, then wires all components.
 */
function init() {
  const root = document.getElementById('board-root');
  if (!root) {
    console.error('App: #board-root element not found');
    return;
  }

  const store = new TaskStore();
  const renderer = new BoardRenderer(root, store);
  const controller = new Controller(root, store);

  // Expose for debugging (non-production)
  window.__taskBoard = { store, renderer, controller };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
