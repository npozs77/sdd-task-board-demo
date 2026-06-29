# Architecture — SDD Task Board (Deployed)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Static Host                            │
│           (GitHub Pages / Netlify / any CDN)             │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │   src/           │  │   walkthrough/                │  │
│  │   (App files)    │  │   (Documentation site)       │  │
│  │   6 static files │  │   7 static files             │  │
│  └────────┬─────────┘  └──────────────┬───────────────┘  │
│           │                           │                   │
│           └───────────┬───────────────┘                   │
│                       │                                   │
│              HTTP/2 static delivery                        │
│              No server-side logic                          │
│              No API endpoints                             │
│              No database                                  │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Browser (Client)                        │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  ES Module loader                                    │ │
│  │  app.js → store.js + board.js + controller.js        │ │
│  └─────────────────────────┬───────────────────────────┘ │
│                            │                              │
│  ┌─────────────────────────▼───────────────────────────┐ │
│  │  localStorage                                        │ │
│  │  Key: 'sdd-task-board-state'                         │ │
│  │  Format: JSON { tasks: Task[] }                      │ │
│  │  Size: ~100 bytes per task                           │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Runtime Characteristics

| Property | Value |
|----------|-------|
| Server requirements | None (static file hosting only) |
| Network requests at runtime | Zero (all client-side) |
| Authentication | None |
| Database | None (localStorage only) |
| Build step | None (source = distributable) |
| Total payload | ~35KB (6 JS/CSS/HTML files) |
| Cold start (first paint) | < 100ms |
| Subsequent loads | < 50ms (cached) |

## Data Architecture

```
┌─────────────────────────────────────────────┐
│  In-Memory State (TaskStore)                 │
│                                              │
│  tasks: Task[] ─── sorted by column + order  │
│                                              │
│  Mutations:                                  │
│    create → append + persist                 │
│    edit   → update + persist                 │
│    move   → reassign + normalize + persist   │
│    delete → remove + normalize + persist     │
│    reorder → splice + normalize + persist    │
│                                              │
│  Events:                                     │
│    'change' → Renderer.render()              │
└──────────────────────┬──────────────────────┘
                       │ JSON serialization
                       ▼
┌─────────────────────────────────────────────┐
│  localStorage                                │
│  Key: 'sdd-task-board-state'                 │
│  Value: { "tasks": [ {...}, {...}, ... ] }   │
│  Max: ~5MB (browser limit per origin)        │
│  Practical: ~5000 tasks before limit         │
└─────────────────────────────────────────────┘
```

## Security Model

| Concern | Status | Reason |
|---------|--------|--------|
| XSS | Mitigated | All content via `textContent` (never `innerHTML` with user data) |
| CSRF | N/A | No server, no cookies, no API |
| Data exposure | Minimal | localStorage is origin-scoped, not transmitted |
| Supply chain | N/A | Zero dependencies |
| Authentication bypass | N/A | No authentication exists |

## Monitoring & Observability

| Aspect | Status |
|--------|--------|
| Error reporting | `console.warn` for non-critical (localStorage failures) |
| Performance monitoring | None (not needed for static app) |
| Analytics | None (privacy-respecting demo) |
| Health checks | N/A (no server) |

## Disaster Recovery

| Scenario | Recovery |
|----------|----------|
| Data loss (localStorage cleared) | App reseeds with sample data automatically |
| Hosting outage | Redeploy to any static host (< 1 minute) |
| Code corruption | Restore from git (single branch, no complex deploy) |

## Scaling Considerations

This is a single-user, single-browser application. It does not scale horizontally and is not designed to:

- No multi-user support
- No real-time sync
- No server-side state
- No API to scale

For a production Kanban tool, the architecture would need: WebSocket for real-time, a backend for multi-user state, a database for persistence, and authentication. This demo intentionally avoids all of that to keep focus on methodology output.
