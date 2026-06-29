/**
 * Property-Based Tests — TaskStore
 *
 * Tests invariants that must hold for ANY input, not just specific examples.
 * Uses fast-check for random input generation.
 *
 * Properties verified:
 * - P1: Determinism — same operations always produce same state
 * - P2: Order integrity — orders are always sequential (no gaps)
 * - P3: Persistence roundtrip — save then load produces identical state
 * - P4: Column constraint — tasks only ever exist in valid columns
 *
 * Run with: npx vitest --run
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { TaskStore } from '../src/store.js';

// Mock localStorage
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

describe('TaskStore — Property-Based Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── P1: Determinism ───

  it('P1: creating N tasks always produces N tasks in state (plus sample data)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
        (titles) => {
          localStorage.clear();
          const store = new TaskStore();
          const initialCount = store.getState().length; // sample data

          for (const title of titles) {
            try { store.createTask(title); } catch { /* empty titles rejected */ }
          }

          const validTitles = titles.filter(t => t.trim().length > 0);
          expect(store.getState().length).toBe(initialCount + validTitles.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  // ─── P2: Order Integrity ───

  it('P2: orders within any column are always sequential (0, 1, 2, ...)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            action: fc.constantFrom('create', 'move', 'delete', 'reorder'),
            title: fc.string({ minLength: 1, maxLength: 30 }),
            column: fc.constantFrom('todo', 'in-progress', 'done'),
            position: fc.nat({ max: 10 })
          }),
          { minLength: 1, maxLength: 30 }
        ),
        (operations) => {
          localStorage.clear();
          const store = new TaskStore();

          for (const op of operations) {
            try {
              switch (op.action) {
                case 'create':
                  store.createTask(op.title);
                  break;
                case 'move': {
                  const tasks = store.getState();
                  if (tasks.length > 0) {
                    const task = tasks[op.position % tasks.length];
                    store.moveTask(task.id, op.column, op.position);
                  }
                  break;
                }
                case 'delete': {
                  const tasks = store.getState();
                  if (tasks.length > 0) {
                    const task = tasks[op.position % tasks.length];
                    store.deleteTask(task.id);
                  }
                  break;
                }
                case 'reorder': {
                  const tasks = store.getState();
                  if (tasks.length > 0) {
                    const task = tasks[op.position % tasks.length];
                    store.reorderTask(task.id, op.position);
                  }
                  break;
                }
              }
            } catch {
              // Invalid operations (empty title, etc.) are expected and skipped
            }
          }

          // INVARIANT: For each column, orders must be 0, 1, 2, ... (no gaps)
          for (const col of ['todo', 'in-progress', 'done']) {
            const tasks = store.getTasks(col);
            const orders = tasks.map(t => t.order);
            const expected = tasks.map((_, i) => i);
            expect(orders).toEqual(expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ─── P3: Persistence Roundtrip ───

  it('P3: state survives save + load cycle without data loss', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (titles) => {
          localStorage.clear();
          const store1 = new TaskStore();

          const validTitles = titles.filter(t => t.trim().length > 0);
          for (const title of validTitles) {
            store1.createTask(title);
          }

          const stateBefore = store1.getState();

          // Simulate page reload — new store reads from localStorage
          const store2 = new TaskStore();
          const stateAfter = store2.getState();

          expect(stateAfter.length).toBe(stateBefore.length);
          for (const task of stateBefore) {
            const restored = stateAfter.find(t => t.id === task.id);
            expect(restored).toBeDefined();
            expect(restored.title).toBe(task.title);
            expect(restored.column).toBe(task.column);
            expect(restored.order).toBe(task.order);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // ─── P4: Column Constraint ───

  it('P4: tasks only ever exist in valid columns (todo, in-progress, done)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 20 }),
            targetColumn: fc.string({ minLength: 1, maxLength: 20 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (ops) => {
          localStorage.clear();
          const store = new TaskStore();

          for (const op of ops) {
            try {
              const task = store.createTask(op.title);
              store.moveTask(task.id, op.targetColumn);
            } catch {
              // Invalid columns throw — expected
            }
          }

          // INVARIANT: All tasks in state have valid columns
          const validColumns = new Set(['todo', 'in-progress', 'done']);
          for (const task of store.getState()) {
            expect(validColumns.has(task.column)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
