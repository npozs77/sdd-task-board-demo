# User Guide — SDD Task Board

## What is this?

A Kanban-style task board for managing work items. Tasks flow from left to right through three stages: **To Do** → **In Progress** → **Done**.

No accounts, no server, no setup. Your data stays in your browser.

---

## Getting Started

### Running the app

```bash
# Option 1: Any static file server
cd site/demo/src
npx serve .
# Open http://localhost:3000

# Option 2: Python
cd site/demo/src
python3 -m http.server 3000
# Open http://localhost:3000

# Option 3: Open directly
# Double-click src/index.html in your file manager
# (Requires browser ES module support for file:// — most modern browsers work)
```

### First visit

On your first visit, the board loads with 5 sample tasks spread across the three columns. This shows you what a populated board looks like. You can immediately start editing, moving, or deleting these — or clear them and start fresh.

---

## Creating Tasks

1. Click the **+ Add task** button at the bottom of the "To Do" column
2. Enter a title (required) and optionally a description
3. Click **Save**

The new task appears at the bottom of "To Do".

**Tips**:
- Titles can be any length, but keep them concise for readability
- Descriptions support any text (no markdown rendering)
- You can always edit later

---

## Moving Tasks

### Drag and drop

1. Click and hold a task card
2. Drag it to another column (or another position in the same column)
3. Release to drop

The card moves immediately. Columns highlight when you hover over them to show valid drop targets.

### Keyboard

1. Focus a task card (Tab to navigate)
2. Use **Ctrl+Arrow Right** to move it to the next column
3. Use **Ctrl+Arrow Left** to move it to the previous column
4. Use **Ctrl+Arrow Up/Down** to reorder within the same column

---

## Editing Tasks

1. Hover over a task card (or focus it with Tab)
2. Click the **Edit** button that appears
3. Modify the title or description
4. Click **Save**

**Keyboard shortcut**: Focus a card and press **Enter** to open the edit modal.

---

## Deleting Tasks

1. Hover over a task card (or focus it with Tab)
2. Click the **Delete** button
3. Confirm in the dialog that appears

**Warning**: Deletion is permanent. There is no undo.

**Keyboard shortcut**: Focus a card and press **Delete** or **Backspace**.

---

## Data & Privacy

### Where is my data stored?

All data is stored in your browser's **localStorage** under the key `sdd-task-board-state`. It never leaves your machine — no server, no cookies, no analytics.

### Clearing data

To reset the board to sample data:
1. Open browser Developer Tools (F12)
2. Go to Application → Local Storage
3. Delete the `sdd-task-board-state` key
4. Reload the page

### Data limits

localStorage supports approximately 5MB per origin. A typical task (~100 bytes) means you can store ~50,000 tasks before hitting limits. In practice, a board with more than ~100 tasks becomes unwieldy.

---

## Keyboard Reference

| Key | Action |
|-----|--------|
| Tab | Move focus to next card/button |
| Shift+Tab | Move focus to previous card/button |
| Enter | Edit focused task |
| Delete / Backspace | Delete focused task |
| Ctrl+Arrow Right | Move task to next column |
| Ctrl+Arrow Left | Move task to previous column |
| Ctrl+Arrow Up | Move task up in column |
| Ctrl+Arrow Down | Move task down in column |
| Escape | Close any open modal |

---

## Accessibility

This app is designed to be fully usable with:
- **Screen readers**: All elements have descriptive ARIA labels
- **Keyboard only**: Every action is accessible without a mouse
- **High contrast**: Dark theme with contrast ratios exceeding WCAG 2.1 AA requirements

---

## Browser Support

| Browser | Supported? |
|---------|------------|
| Chrome (latest) | ✅ |
| Firefox (latest) | ✅ |
| Safari (latest) | ✅ |
| Edge (latest) | ✅ |
| Internet Explorer | ❌ |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Board is empty on load | Clear localStorage (see "Clearing data") to restore sample data |
| Drag doesn't work | Ensure you're dragging the card body, not the Edit/Delete buttons |
| Changes don't persist across reload | Check if browser is in private/incognito mode (localStorage may be disabled) |
| Tasks disappeared | Another tab may have overwritten localStorage — reload to see current state |
| Page is blank | Check browser console for errors; ensure you're serving via HTTP (not file://) if modules fail |
