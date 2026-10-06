# Personas — SDD Task Board

---

## P1 — Solo Developer (primary)

**Name**: Casey
**Role**: Full-stack developer managing personal and client projects
**Context**: Works across 3–5 active projects. Uses browser-based tools daily. Needs quick task visibility without heavyweight project management tools. Prefers keyboard-heavy workflows.

**Goals**:
- See all active work at a glance without opening a separate app
- Move tasks through stages with minimal friction (drag or keyboard)
- Not lose state when switching between browser tabs or closing the browser
- Accessible interface that works with screen reader when needed

**Frustrations**:
- Heavyweight tools (Jira, Asana) are overkill for solo/small work
- Sticky notes lose state when the browser refreshes
- Most task boards require accounts, servers, or setup
- Touch/mouse-only interfaces slow down keyboard-first users

---

## P2 — Technical Evaluator (secondary)

**Name**: Morgan
**Role**: Developer or tech lead evaluating SDD Toolkit
**Context**: Browsing the demo to understand what SDD produces. Not using the task board for real work — using it to assess methodology quality. Looks at the code, the docs, the architecture.

**Goals**:
- See evidence that the methodology produces rigorous, traceable outputs
- Understand how requirements flow through to implementation
- Assess whether SDD would scale to their own (larger) projects
- Find the demo credible — not a toy, not an over-engineered exercise

**Frustrations**:
- Demos that show bullet lists but no real depth
- "Best practices" that are all theory, no evidence
- Code without traceability to requirements
- Missing operational docs (how to run, how to extend)

---

## P3 — Accessibility User (tertiary)

**Name**: Alex
**Role**: Developer who relies on keyboard navigation and screen readers
**Context**: Uses the task board as a real tool. Needs full functionality without mouse interaction. Evaluates whether accessible design was an afterthought or built-in.

**Goals**:
- Complete all workflows via keyboard (create, move, edit, delete)
- Understand board state via screen reader announcements
- Navigate efficiently between columns and cards
- Receive clear focus indicators showing current position

**Frustrations**:
- Drag-and-drop with no keyboard alternative
- Missing ARIA labels that make screen readers useless
- Focus traps with no escape mechanism
- Visual-only feedback (colour changes without text alternatives)
