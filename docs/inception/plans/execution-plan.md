# Execution Plan — SDD Task Board

---

## Build & Run

| Decision | Value |
|----------|-------|
| Language | JavaScript (ES2020+, no TypeScript — zero build step) |
| Module system | ES Modules (`type="module"` in script tag) |
| Build tool | None — source is the artifact |
| Run command | `npx serve src/` or open `src/index.html` |
| Prerequisites | Any modern browser (Chrome, Firefox, Safari, Edge) |

## Testing Strategy

| Decision | Value |
|----------|-------|
| Test framework | Vitest (ESM-native, fast, compatible) |
| Test command | `npx vitest --run` |
| Test types | Unit tests (per-requirement), property-based tests (invariants) |
| Test organization | `tests/store.test.js` (unit), `tests/store.property.test.js` (PBT) |
| PBT library | fast-check |
| Coverage target | All business rules + all error cases |

**Approach**:
- Unit tests verify each requirement by ID (describe blocks named `[FR-X]`, `[BR-X]`)
- Property-based tests verify invariants that must hold for ANY input sequence:
  - P1: Task count consistency (creates - deletes = remaining)
  - P2: Order integrity (always sequential 0,1,2... no gaps)
  - P3: Persistence roundtrip (save + load = identical state)
  - P4: Column constraint (tasks only in valid columns, even with random operations)

## Quality Checks

| Check | Tool | Command |
|-------|------|---------|
| Lint | ESLint | `npx eslint src/` |
| Format | Prettier | `npx prettier --check src/` |
| Accessibility | Manual + aXe | Browser extension audit |

## Deployment

| Decision | Value |
|----------|-------|
| Hosting | Any static file server (GitHub Pages, Netlify, `npx serve`) |
| Output | `src/` directory as-is (no build artifact) |
| CDN / Bundling | None (6 files, <35KB total — no optimisation needed) |
| Domain | TBD (will be linked from main SDD Toolkit site) |

## Construction Sequence

| Phase | Unit | Deliverables | Dependencies |
|-------|------|-------------|--------------|
| 1 | Unit 1 — Data Store | `src/store.js`, unit tests, PBT | None |
| 2 | Unit 2 — Board Renderer | `src/board.js`, `src/styles.css`, `src/index.html` | Unit 1 |
| 3 | Unit 3 — Controller + Entry | `src/controller.js`, `src/app.js` | Unit 1, Unit 2 |
| 4 | Walkthrough Site | `walkthrough/` (static HTML) | All units complete |
| 5 | Operations Docs | `docs/operations/` | All units complete |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| HTML5 DnD poor on mobile | Medium | Low | Keyboard shortcuts as fallback; document in known limitations |
| localStorage quota in private mode | Low | Low | Graceful degradation — in-memory fallback |
| ES Modules blocked on file:// | Low | Low | Document: "use a local server" in user guide |
| Demo artifacts don't match real quality | High | High | Use real project docs as template; verify structure matches |
