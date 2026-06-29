/**
 * Unit Tests — TaskStore
 *
 * Tests behaviour, not implementation details.
 * Each test references the requirement it verifies.
 * Organized by capability area matching the requirements doc.
 *
 * Run with: npx vitest --run (or any ESM-compatible test runner)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskStore } from '../src/store.js';

// Mock localStorage for test isolation
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('TaskStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── FR-2: Task Management ───

  describe('createTask [FR-2]', () => {
    it('creates a task in the todo column with correct fields', () => {
      const store = new TaskStore();
      const task = store.createTask('Buy groceries', 'Milk and eggs');

      expect(task.title).toBe('Buy groceries');
      expect(task.description).toBe('Milk and eggs');
      expect(task.column).toBe('todo');
      expect(task.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(task.order).toBeTypeOf('number');
    });

    it('trims whitespace from title and description', () => {
      const store = new TaskStore();
      const task = store.createTask('  Padded title  ', '  Padded desc  ');

      expect(task.title).toBe('Padded title');
      expect(task.description).toBe('Padded desc');
    });

    it('assigns sequential order values within the column', () => {
      const store = new TaskStore();
      // Clear sample data by creating fresh after clearing
      localStorage.clear();
      const fresh = new TaskStore();
      // Sample data has 3 todo tasks (order 0,1,2)
      const task = fresh.createTask('New task');
      expect(task.order).toBe(3); // after 3 sample tasks
    });
  });

  // ─── BR-3: Required Title ───

  describe('title validation [BR-3]', () => {
    it('rejects empty string title', () => {
      const store = new TaskStore();
      expect(() => store.createTask('')).toThrow('Title must not be empty');
    });

    it('rejects whitespace-only title', () => {
      const store = new TaskStore();
      expect(() => store.createTask('   ')).toThrow('Title must not be empty');
    });

    it('rejects empty title on edit', () => {
      const store = new TaskStore();
      const task = store.createTask('Valid');
      expect(() => store.editTask(task.id, { title: '' })).toThrow('Title must not be empty');
    });

    it('accepts title "0" (not falsy-checking, string-empty-checking)', () => {
      const store = new TaskStore();
      const task = store.createTask('0');
      expect(task.title).toBe('0');
    });
  });

  // ─── FR-3: Task Movement ───

  describe('moveTask [FR-3]', () => {
    it('moves a task to a different column', () => {
      const store = new TaskStore();
      const task = store.createTask('Move me');
      store.moveTask(task.id, 'in-progress');

      const inProgress = store.getTasks('in-progress');
      expect(inProgress.find(t => t.id === task.id)).toBeDefined();
    });

    it('inserts at specified position', () => {
      const store = new TaskStore();
      const t1 = store.createTask('First');
      const t2 = store.createTask('Second');
      store.moveTask(t2.id, 'in-progress');
      store.moveTask(t1.id, 'in-progress', 0); // insert at top

      const tasks = store.getTasks('in-progress');
      expect(tasks[0].id).toBe(t1.id);
    });

    it('appends to end when position is undefined', () => {
      const store = new TaskStore();
      const task = store.createTask('Append me');
      store.moveTask(task.id, 'done');

      const done = store.getTasks('done');
      const moved = done.find(t => t.id === task.id);
      expect(moved.order).toBe(done.length - 1);
    });
  });

  // ─── BR-1: Fixed Columns ───

  describe('column validation [BR-1]', () => {
    it('rejects invalid column name', () => {
      const store = new TaskStore();
      const task = store.createTask('Test');
      expect(() => store.moveTask(task.id, 'archived'))
        .toThrow('Invalid column: archived');
    });

    it('rejects empty string as column', () => {
      const store = new TaskStore();
      const task = store.createTask('Test');
      expect(() => store.moveTask(task.id, ''))
        .toThrow('Invalid column: ');
    });
  });

  // ─── FR-5: Data Persistence ───

  describe('persistence [FR-5, BR-6]', () => {
    it('persists state to localStorage on create', () => {
      const store = new TaskStore();
      store.createTask('Persisted task');

      const stored = JSON.parse(localStorage.getItem('sdd-task-board-state'));
      expect(stored.tasks.find(t => t.title === 'Persisted task')).toBeDefined();
    });

    it('restores state from localStorage on init', () => {
      // Create a task, then instantiate a new store
      const store1 = new TaskStore();
      store1.createTask('Survivor');

      const store2 = new TaskStore();
      const tasks = store2.getState();
      expect(tasks.find(t => t.title === 'Survivor')).toBeDefined();
    });

    it('seeds sample data when localStorage is empty', () => {
      localStorage.clear();
      const store = new TaskStore();
      const tasks = store.getState();

      expect(tasks.length).toBe(5); // BR-4: 5 sample tasks
      expect(tasks.filter(t => t.column === 'todo').length).toBe(3);
      expect(tasks.filter(t => t.column === 'in-progress').length).toBe(1);
      expect(tasks.filter(t => t.column === 'done').length).toBe(1);
    });

    it('seeds sample data when localStorage contains invalid JSON', () => {
      localStorage.setItem('sdd-task-board-state', 'not-json{{{');
      const store = new TaskStore();
      expect(store.getState().length).toBe(5); // falls back to sample data
    });
  });

  // ─── FR-4: Deletion ───

  describe('deleteTask [FR-4]', () => {
    it('removes the task from state', () => {
      const store = new TaskStore();
      const task = store.createTask('Delete me');
      store.deleteTask(task.id);

      expect(store.getState().find(t => t.id === task.id)).toBeUndefined();
    });

    it('normalizes order of remaining tasks in column', () => {
      localStorage.clear();
      const store = new TaskStore();
      // Sample data: 3 todo tasks with order 0, 1, 2
      const todoTasks = store.getTasks('todo');
      store.deleteTask(todoTasks[1].id); // delete middle

      const remaining = store.getTasks('todo');
      expect(remaining.map(t => t.order)).toEqual([0, 1]); // no gaps
    });

    it('throws for non-existent task ID', () => {
      const store = new TaskStore();
      expect(() => store.deleteTask('nonexistent'))
        .toThrow('Task not found: nonexistent');
    });
  });

  // ─── FR-6: Task Ordering ───

  describe('reorderTask [FR-6]', () => {
    it('moves task to a new position within its column', () => {
      localStorage.clear();
      const store = new TaskStore();
      const todoTasks = store.getTasks('todo');
      const last = todoTasks[2]; // order 2

      store.reorderTask(last.id, 0); // move to top

      const reordered = store.getTasks('todo');
      expect(reordered[0].id).toBe(last.id);
    });

    it('clamps negative position to 0', () => {
      localStorage.clear();
      const store = new TaskStore();
      const todoTasks = store.getTasks('todo');
      const task = todoTasks[1]; // order 1

      store.reorderTask(task.id, -5);

      const reordered = store.getTasks('todo');
      expect(reordered[0].id).toBe(task.id);
    });
  });

  // ─── Event System ───

  describe('change events', () => {
    it('emits change event on every mutation', () => {
      const store = new TaskStore();
      const listener = vi.fn();
      store.on('change', listener);

      store.createTask('Test');
      expect(listener).toHaveBeenCalledTimes(1);

      const task = store.getState().find(t => t.title === 'Test');
      store.editTask(task.id, { title: 'Updated' });
      expect(listener).toHaveBeenCalledTimes(2);

      store.deleteTask(task.id);
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('does not emit on read operations', () => {
      const store = new TaskStore();
      const listener = vi.fn();
      store.on('change', listener);

      store.getState();
      store.getTasks('todo');

      expect(listener).not.toHaveBeenCalled();
    });

    it('supports unsubscribing', () => {
      const store = new TaskStore();
      const listener = vi.fn();
      store.on('change', listener);
      store.off('change', listener);

      store.createTask('Test');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
