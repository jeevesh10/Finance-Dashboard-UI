# Finance Dashboard UI

A frontend-only finance dashboard built with vanilla HTML/CSS/JavaScript and mock data.

The project is designed so you can run it in two ways:
- Open `index.html` directly in a browser (double-click)
- Or use Vite scripts (`npm run dev`, `npm run build`) if needed

## Features

- **Dashboard overview**
  - Summary cards: Total Balance, Total Income, Total Expenses
  - Time-based chart: monthly balance trend
  - Categorical chart: spending breakdown by category

- **Transactions section**
  - Table with date, category, type, note, amount
  - Search by note/category
  - Base filters: type, category
  - Sorting: date and amount

- **Advanced filtering and grouping**
  - Date range: from/to
  - Amount range: min/max
  - Group by: category or month
  - Quick reset for advanced filters

- **Role-based UI simulation**
  - Role toggle: `viewer` / `admin`
  - Viewer: read-only
  - Admin: add and edit transactions

- **Insights**
  - Highest spending category
  - Month-over-month net comparison
  - Average expense observation

- **Enhancements**
  - Dark mode slider (persisted)
  - Smooth transitions/animations
  - Export filtered transactions to CSV/JSON
  - Import transactions from CSV/JSON
  - Responsive layout + empty states

## File Structure

- `index.html` - entry file for direct browser usage
- `app.js` - application logic and state management
- `styles.css` - UI styling, responsive layout, dark theme
- `src/*` - Vite TypeScript version kept for build workflow

## How to Run

### Option 1: Direct open (recommended for this submission)
1. Open `index.html` in your browser.
2. If you made recent changes, refresh once with `Ctrl + F5`.

### Option 2: Vite
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Build:
   ```bash
   npm run build
   ```
4. Preview build:
   ```bash
   npm run preview
   ```

## State Management Approach

- Single centralized state object in `app.js`
- UI is rendered from state
- Events update state, persist to `localStorage`, and re-render
- Scroll/focus preservation prevents jump while typing in search

## Notes

- Data is mocked and backend-independent.
- Import expects valid CSV/JSON transaction format.
- Export always uses the currently filtered transaction set.
