# Implementation Plan — SDD Task Board

## Build & Compile

| Decision | Value |
|----------|-------|
| Language | JavaScript ES2020+ (strict mode via modules) |
| Build tool | None — source IS the distributable |
| Build command | N/A (open index.html or serve directory) |
| Output artifact | `src/` directory (6 files, ~35KB) |
| Build prerequisites | Modern browser only |
| Entry point | `src/index.html` (loads `src/app.js` as module) |

## Testing Strategy

| Decision | Value |
|----------|-------|
| Test framework | Vitest 3.x (ESM-native) |
| Test command | `npx vitest --run` |
| PBT framework | fast-check |
| Test organization | `tests/store.test.js` (25 unit tests), `tests/store.property.test.js` (4 PBT) |

**Approach**:
- Unit tests organized by requirement ID in describe blocks
- Property-based tests verify system invariants with random operation sequences
- No integration tests (app is small enough that unit + PBT covers all paths)
- No E2E tests (would require browser automation — overkill for demo)

**Property tests**:
| Property | Invariant |
|----------|-----------|
| P1 — Determinism | N creates → exactly N tasks added to state |
| P2 — Order integrity | Orders within any column are always 0, 1, 2, ... |
| P3 — Persistence roundtrip | Save + reload → identical state |
| P4 — Column constraint | Tasks only ever exist in valid columns |

## Packaging & Distribution

| Decision | Value |
|----------|-------|
| Package format | Static files (no npm package) |
| Distribution | GitHub repository (public) |
| Install command | `git clone` + `npx serve src/` |
| No bundling | 6 files, <35KB — HTTP/2 handles fine |

**What gets distributed**:
- `src/` — application source (6 files)
- `tests/` — test suite (2 files)
- `docs/` — full SDD artifact set (all inception + construction + operations)
- `walkthrough/` — browsable walkthrough site
- `project-profile.yaml` — SDD configuration

## File Inventory

```
sdd-task-board/
├── src/
│   ├── index.html          # App shell
│   ├── styles.css          # All CSS (custom props, grid, a11y, responsive)
│   ├── app.js              # Entry point
│   ├── store.js            # Data layer
│   ├── board.js            # Render layer
│   └── controller.js       # Interaction layer
├── tests/
│   ├── store.test.js       # 25 unit tests by requirement
│   └── store.property.test.js  # 4 property-based invariants
├── docs/
│   ├── inception/          # Requirements, design, decomposition
│   ├── construction/       # Per-unit functional designs + code summaries
│   ├── operations/         # User guide + developer guide
│   ├── state.md            # Project progress tracker
│   └── audit.md            # Decision audit trail
├── walkthrough/            # Static HTML walkthrough site
└── project-profile.yaml    # SDD configuration
```
