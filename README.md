# SDD Task Board

> **[View the live demo & walkthrough →](https://npozs77.github.io/sdd-aidev-toolkit/demo/)**

A Kanban-style task board built using [Spec-Driven Development](https://npozs77.github.io/sdd-aidev-toolkit) at MVP maturity.

This repository is a **complete showcase** of what SDD produces — from requirements through architecture, construction, testing, and operations documentation. The app is deliberately simple (a task board); the methodology output is the point.

## Quick Start

```bash
# Serve the app
cd src && npx serve .
# Open http://localhost:3000

# Serve the walkthrough
cd walkthrough && npx serve .
# Open http://localhost:3000

# Run tests
npm install   # installs vitest + fast-check (dev deps only)
npm test
```

## What's Here

```
├── src/                  # Application source (6 files, ~710 loc, zero dependencies)
├── tests/                # Unit tests + property-based tests
├── docs/
│   ├── inception/        # Requirements, user stories, architecture, design
│   ├── construction/     # Per-unit functional designs, NFR specs, code summaries
│   ├── operations/       # User guide, developer guide, architecture
│   ├── state.md          # Project progress tracker
│   └── audit.md          # Decision audit trail
├── walkthrough/          # Static HTML walkthrough site
├── project-profile.yaml  # SDD configuration
└── package.json          # Dev dependencies (test runner only)
```

## The App

Three-column Kanban board: **To Do** → **In Progress** → **Done**.

- Drag tasks between columns or use Ctrl+Arrow keys
- Create, edit, delete tasks with modals
- Data persists to localStorage (no server, no account)
- WCAG 2.1 AA accessible (keyboard nav, ARIA, focus management)
- Responsive (desktop → tablet → mobile)
- Zero runtime dependencies — open `src/index.html` and it works

## The Methodology Output

This project was built through the full SDD lifecycle:

| Phase | Artifacts |
|-------|-----------|
| Inception | 11 documents: requirements, business rules, verification Q&A, personas, user stories, HLD, components, dependencies, unit decomposition, execution plan, implementation plan |
| Construction | Per-unit: functional design (numbered pipelines with fail branches) + NFR requirements + code summary. 3 units total. |
| Operations | User guide, developer guide, architecture document |
| Audit | Timestamped gate approvals and phase transitions |

Every requirement traces to code. Every module header lists the requirements it implements. Test suites are organized by requirement ID.

## Browse the Walkthrough

The `walkthrough/` directory is a static site that makes the SDD artifacts browsable with excerpts and links to full specs. Serve it and walk through inception → construction → traceability → audit → operations.

## License

MIT
