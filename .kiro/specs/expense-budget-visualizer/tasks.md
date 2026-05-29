# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a pure client-side expense tracker as three files (`index.html`, `css/style.css`, `js/app.js`) with Chart.js loaded via CDN. Tasks are ordered so each step produces runnable, integrated code — no orphaned logic at any checkpoint.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - [x] 1.1 Create the directory layout and `index.html` entry point
    - Create `css/` and `js/` directories at the project root
    - Write `index.html` with `<!DOCTYPE html>`, `<head>` (charset, viewport, title, stylesheet link), and an empty `<body>` that loads Chart.js from `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` followed by `<script src="js/app.js"></script>`
    - Create empty placeholder files `css/style.css` and `js/app.js` so the page loads without 404 errors
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 1.2 Add full semantic HTML structure to `index.html`
    - Add the storage/compatibility warning banner: `<div id="storage-warning" class="warning-banner" hidden>` containing `<p id="storage-warning-msg"></p>`
    - Add `<main class="app-container">` containing:
      - `<header class="balance-section">` with `<h1>Total Spending</h1>` and `<p id="balance-display" class="balance-amount">$0.00</p>`
      - `<div class="content-grid">` with a left column (`<section class="left-column">`) and a right column (`<section class="chart-section">`)
    - Inside the left column add the input form (`<form id="transaction-form" class="transaction-form" novalidate>`) with three `.form-group` divs: text input `#item-name` (maxlength 100), number input `#item-amount` (min 0.01, max 999999.99, step 0.01), select `#item-category` (options: `""`, Food, Transport, Fun), each followed by a `<span class="field-error">` with IDs `error-name`, `error-amount`, `error-category` and `aria-live="polite"`; add `<button type="submit" class="btn-primary">Add Transaction</button>`
    - Below the form add `<section class="transaction-section">` with `<h2>Transactions</h2>` and `<ul id="transaction-list" class="transaction-list" aria-label="Transaction list"></ul>`
    - Inside the right column add `<h2>Spending by Category</h2>`, `<div id="chart-container" class="chart-container">` containing `<canvas id="spending-chart" aria-label="Spending pie chart" role="img"></canvas>` and `<p id="chart-empty-msg" class="chart-empty-msg">No spending data yet.</p>`
    - _Requirements: 1.1, 2.3, 3.1, 4.4, 6.3_

- [x] 2. Implement CSS — layout, typography, and component styles
  - [x] 2.1 Write CSS custom properties, reset, and base typography
    - Declare all CSS custom properties on `:root`: `--color-bg: #f5f7fa`, `--color-surface: #ffffff`, `--color-primary: #4f46e5`, `--color-danger: #dc2626`, `--color-text: #1e293b`, `--color-muted: #64748b`, `--color-border: #e2e8f0`, `--color-food: #f59e0b`, `--color-transport: #3b82f6`, `--color-fun: #10b981`
    - Apply a minimal box-sizing reset (`*, *::before, *::after { box-sizing: border-box; }`) and set `body` background to `var(--color-bg)`, font to the system-ui stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`), base size `16px`, color `var(--color-text)`
    - _Requirements: 7.1_

  - [x] 2.2 Write layout styles — app container, grid, and columns
    - Style `.app-container` as a max-width centered container with horizontal padding
    - Style `.content-grid` as a two-column CSS Grid (`grid-template-columns: 1fr 1fr`, `gap: 2rem`)
    - Style `.left-column` as a Flexbox column (`flex-direction: column`, `gap: 1.5rem`)
    - Style `.chart-section` as a Flexbox column with centered chart content
    - Add responsive breakpoint at `max-width: 700px` that switches `.content-grid` to a single column
    - _Requirements: 7.1_

  - [x] 2.3 Write component styles — balance, form, transaction list, chart, and warning banner
    - Balance: `.balance-section` centered, `#balance-display` at `2.5rem` bold
    - Form: `.transaction-form` on a white card (`background: var(--color-surface)`, border-radius, padding, box-shadow); `.form-group` as flex column with label (`color: var(--color-muted)`, `font-size: 0.875rem`), input/select styled with border `var(--color-border)`, focus ring using `--color-primary`
    - Errors: `.field-error` in `var(--color-danger)`, `font-size: 0.8rem`, `min-height: 1.2em`, `display: block` (prevents layout shift)
    - Submit button: `.btn-primary` with `background: var(--color-primary)`, white text, border-radius, hover/focus states
    - Transaction list: `.transaction-list` with `max-height: 320px`, `overflow-y: auto`, `list-style: none`; `.transaction-item` as a flex row with name, amount, category badge, and delete button; `.btn-delete` in `var(--color-danger)`
    - Category badges: `.category-food { background: var(--color-food); }`, `.category-transport { background: var(--color-transport); }`, `.category-fun { background: var(--color-fun); }` — all with white text, small padding, border-radius
    - Chart: `.chart-container` centered, `.chart-empty-msg` centered muted text
    - Warning banner: `.warning-banner` with `background: #fef3c7`, `border-left: 4px solid #f59e0b`, padding
    - _Requirements: 2.2, 2.3, 4.4, 5.5, 5.6, 6.3_

- [~] 3. Checkpoint — open `index.html` in a browser and verify the static layout renders correctly with no console errors before writing any JavaScript.
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement JavaScript — constants, state, and storage layer
  - [x] 4.1 Write constants and in-memory state in `js/app.js`
    - Wrap everything in an IIFE to avoid polluting `window`
    - Declare constants: `STORAGE_KEY = 'expense_transactions'`, `CATEGORIES = ['Food', 'Transport', 'Fun']`, `CATEGORY_COLORS = { Food: '#f59e0b', Transport: '#3b82f6', Fun: '#10b981' }`, `MAX_NAME_LENGTH = 100`, `MIN_AMOUNT = 0.01`, `MAX_AMOUNT = 999999.99`
    - Declare mutable state: `let transactions = [];` and `let chartInstance = null;`
    - _Requirements: 7.2_

  - [x] 4.2 Implement the storage layer (`checkStorageSupport`, `loadFromStorage`, `saveToStorage`)
    - `checkStorageSupport()`: try writing and removing a test key from `localStorage`; catch `SecurityError` or any exception; return `true`/`false`
    - `loadFromStorage()`: if storage not supported return `null`; read `STORAGE_KEY`; if absent return `null`; `JSON.parse` inside try/catch (return `null` on `SyntaxError`); validate each item has `id` (string), `name` (string), `amount` (finite number), `category` (string in `CATEGORIES`); return `null` if any item fails; return parsed array
    - `saveToStorage(txns)`: if storage not supported return `false`; `JSON.stringify` and `localStorage.setItem` inside try/catch; return `true` on success, `false` on any error
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.3_


- [x] 5. Implement JavaScript — validation layer
  - [x] 5.1 Implement `validateForm(name, amount, category)`
    - Return `{ name: string|null, amount: string|null, category: string|null }`
    - Name checks: trimmed empty → `"Item name is required."`; length > 100 → `"Item name must be 100 characters or fewer."`
    - Amount checks: empty → `"Amount is required."`; `isNaN` → `"Amount must be a number."`; `< MIN_AMOUNT` → `"Amount must be at least $0.01."`; `> MAX_AMOUNT` → `"Amount must not exceed $999,999.99."`; more than 2 decimal places (check string representation) → `"Amount may have at most two decimal places."`
    - Category checks: value not in `CATEGORIES` → `"Please select a category."`
    - Return `null` for each field that passes all checks
    - _Requirements: 1.2, 1.3_

- [ ] 6. Implement JavaScript — UI layer
  - [ ] 6.1 Implement `formatCurrency`, `renderBalance`, `renderErrors`, `clearErrors`, `showStorageWarning`, `hideStorageWarning`
    - `formatCurrency(amount)`: return `'$' + amount.toFixed(2)`
    - `renderBalance(txns)`: sum all `amount` fields, call `formatCurrency`, set `#balance-display` `textContent`
    - `renderErrors(errors)`: set `#error-name`, `#error-amount`, `#error-category` `textContent` to the error string or `''` if `null`
    - `clearErrors()`: call `renderErrors({ name: null, amount: null, category: null })`
    - `showStorageWarning(message)`: set `#storage-warning-msg` `textContent`, remove `hidden` attribute from `#storage-warning`
    - `hideStorageWarning()`: set `hidden` attribute on `#storage-warning`
    - _Requirements: 2.2, 3.1, 3.4, 3.5, 5.5, 5.6, 6.3_

  - [~] 6.2 Implement `renderTransactionList(txns)`
    - Clear `#transaction-list` `innerHTML`
    - For each transaction build an `<li class="transaction-item" data-id="...">` containing:
      - `<span class="transaction-name">` with `transaction.name`
      - `<span class="transaction-amount">` with `formatCurrency(transaction.amount)`
      - `<span class="transaction-category category-{category.toLowerCase()}">` with `transaction.category`
      - `<button class="btn-delete" aria-label="Delete {name} transaction">✕</button>`
    - Append each `<li>` to `#transaction-list`
    - _Requirements: 2.1, 2.2_

  - [~] 6.3 Implement `renderAll(txns)` convenience function
    - Call `renderTransactionList(txns)`, `renderBalance(txns)`, `updateChart(txns)` in sequence
    - _Requirements: 2.4, 3.2, 3.3, 4.2, 4.3_

- [~] 7. Checkpoint — wire up a minimal `init()` that calls `renderAll([])` on `DOMContentLoaded` and verify the page loads with `$0.00` balance, empty list, and no console errors.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement JavaScript — chart layer
  - [ ] 8.1 Implement `buildChartData(txns)`
    - Aggregate `amount` totals per category using `CATEGORIES` as the canonical order
    - Build `labels`, `data`, and `colors` arrays including only categories whose total is `> 0`
    - Return `{ labels, data, colors }`
    - _Requirements: 4.1_

  - [~] 8.2 Implement `initChart()` and `updateChart(txns)`
    - `initChart()`: get `#spending-chart` canvas; create `new Chart(canvas, { type: 'pie', data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: ctx => formatCurrency(ctx.parsed) + ' — ' + ctx.label } } } } })`; store in `chartInstance`; call `updateChart([])` to set initial empty state
    - `updateChart(txns)`: call `buildChartData(txns)`; update `chartInstance.data.labels`, `chartInstance.data.datasets[0].data`, `chartInstance.data.datasets[0].backgroundColor`; call `chartInstance.update()`; if `data` array is empty show `#chart-empty-msg` and hide `#spending-chart`, otherwise hide `#chart-empty-msg` and show `#spending-chart`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_ 

- [ ] 9. Implement JavaScript — event handlers and initialization
  - [~] 9.1 Implement `handleFormSubmit(event)`
    - Call `event.preventDefault()` and `clearErrors()`
    - Read `#item-name`, `#item-amount`, `#item-category` values
    - Call `validateForm`; if any error is non-null call `renderErrors` and return
    - Build `newTransaction` with `id` (`crypto.randomUUID()` or `Date.now().toString()` fallback), trimmed `name`, `parseFloat(parseFloat(amount).toFixed(2))` for `amount`, and `category`
    - Compute `updated = [...transactions, newTransaction]`; call `saveToStorage(updated)`; if it returns `false` call `showStorageWarning(...)` and return without mutating state
    - On success: `transactions = updated`; call `renderAll(transactions)`; call `event.target.reset()`; call `hideStorageWarning()`
    - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.5_

  - [~] 9.2 Implement `handleDeleteClick(event)` with event delegation
    - Use `event.target.closest('.btn-delete')` to find the delete button; return early if not found
    - Get the parent `<li>` via `.closest('.transaction-item')` and read `li.dataset.id`
    - Compute `updated = transactions.filter(t => t.id !== id)`; call `saveToStorage(updated)` (best-effort); set `transactions = updated`; call `renderAll(transactions)`
    - _Requirements: 2.4, 5.2_

  - [~] 9.3 Implement `init()` and `DOMContentLoaded` bootstrap
    - `init()`:
      1. If `!checkStorageSupport()` call `showStorageWarning('localStorage is not available. Data will not be saved between sessions.')`
      2. Call `loadFromStorage()`; if result is `null` and storage is supported and `localStorage.getItem(STORAGE_KEY) !== null`, call `showStorageWarning('Previous data could not be loaded and has been cleared.')`
      3. Set `transactions = saved || []`
      4. Call `initChart()`
      5. Call `renderAll(transactions)`
      6. Attach `handleFormSubmit` to `#transaction-form` `submit` event
      7. Attach `handleDeleteClick` to `#transaction-list` `click` event (delegation)
    - Register `document.addEventListener('DOMContentLoaded', init)`
    - _Requirements: 5.3, 5.4, 5.6, 6.3_

- [ ] 10. Integration — wire all layers together and verify end-to-end flows
  - [~] 10.1 Verify add-transaction flow end-to-end
    - Open `index.html`; submit a valid transaction; confirm the transaction appears in the list, balance updates, pie chart updates, and `localStorage` contains the serialized entry
    - Write an automated integration test (jsdom) that simulates form fill + submit and asserts list length, balance text, and `localStorage` value
    - _Requirements: 1.4, 2.1, 3.2, 4.2, 5.1_

  - [~] 10.2 Verify delete-transaction flow end-to-end
    - Write an automated integration test that pre-populates `transactions`, renders the list, simulates a delete button click, and asserts the item is removed from the DOM, balance recalculates, chart updates, and `localStorage` is updated
    - _Requirements: 2.4, 3.3, 4.3, 5.2_

  - [~] 10.3 Verify page-reload persistence
    - Write an automated test that saves transactions to `localStorage`, calls `init()` on a fresh DOM, and asserts the list, balance, and chart all reflect the saved data
    - _Requirements: 5.3_

- [ ] 11. Error handling and edge cases
  - [~] 11.1 Handle `localStorage` unavailable at startup
    - Confirm `checkStorageSupport()` returns `false` when `localStorage` throws (mock in test); confirm `#storage-warning` becomes visible with the correct message; confirm the app still renders an empty state and accepts transactions in-session
    - _Requirements: 6.3_

  - [~] 11.2 Handle corrupted `localStorage` data on load
    - Write a test that sets `localStorage[STORAGE_KEY]` to an invalid JSON string, calls `init()`, and asserts `transactions` is `[]`, `#balance-display` shows `$0.00`, and `#storage-warning` is visible
    - _Requirements: 5.6_

  - [~] 11.3 Handle `localStorage` quota exceeded on add
    - Write a test that mocks `localStorage.setItem` to throw a `QuotaExceededError`; simulate a valid form submission; assert `transactions` array is unchanged, the new item is absent from the DOM list, and `#storage-warning` is visible
    - _Requirements: 5.5_

  - [~] 11.4 Handle schema-invalid data in `localStorage`
    - Write tests for: array of non-objects, objects missing `id`/`name`/`amount`/`category`, `amount` as a string, `category` not in `CATEGORIES`; assert `loadFromStorage` returns `null` for each case
    - _Requirements: 5.6_

- [~] 12. Final checkpoint — run all tests and verify the complete application
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 3, 7, 12) ensure incremental validation at key milestones
- Property tests use **fast-check** and must run a minimum of 100 iterations each
- Unit/integration tests use **Vitest** (or Jest) with **jsdom** for DOM-dependent tests
- The IIFE wrapper in `app.js` keeps all symbols out of `window` while remaining compatible with the `file://` protocol (no ES module `import`/`export`)
- `crypto.randomUUID()` is available in all target browsers; `Date.now().toString()` is the fallback for older environments

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["4.3", "4.4", "4.5", "4.6", "5.2", "5.3", "5.4"] },
    { "id": 6, "tasks": ["6.1", "8.1"] },
    { "id": 7, "tasks": ["6.2", "8.2"] },
    { "id": 8, "tasks": ["6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "8.3", "8.4"] },
    { "id": 9, "tasks": ["9.1", "9.2"] },
    { "id": 10, "tasks": ["9.3"] },
    { "id": 11, "tasks": ["10.1", "10.2", "10.3", "11.1", "11.2", "11.3", "11.4"] }
  ]
}
```
