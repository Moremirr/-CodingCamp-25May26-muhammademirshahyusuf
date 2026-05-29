# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side web application built with plain HTML, CSS, and Vanilla JavaScript. It requires no build tools, no server, and no package manager — the user opens `index.html` directly in a browser and the app is fully functional.

The application lets users record expense transactions (name, amount, category), view a running total balance, browse a scrollable transaction list, and see a live pie chart of spending by category. All data is persisted to `localStorage` as JSON. Chart.js is loaded via CDN for the pie chart.

### Key Design Decisions

- **No framework**: Vanilla JS with direct DOM manipulation keeps the codebase minimal and dependency-free per Requirement 7.4.
- **In-memory array as source of truth**: A single `transactions` array in `app.js` is the canonical state. Every mutation syncs to `localStorage` and re-renders the UI.
- **Fail-safe storage**: Storage errors are caught and surfaced to the user without corrupting in-memory state.
- **Chart.js via CDN**: Avoids any local installation while providing a production-quality chart library.

---

## Architecture

The application follows a simple layered architecture:

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│  (structure, CDN script tags, links to css/style.css │
│   and js/app.js)                                     │
└──────────────────────┬──────────────────────────────┘
                       │ DOM
          ┌────────────▼────────────┐
          │       js/app.js         │
          │                         │
          │  ┌─────────────────┐    │
          │  │  State Layer    │    │  ← in-memory `transactions[]`
          │  └────────┬────────┘    │
          │           │             │
          │  ┌────────▼────────┐    │
          │  │  Storage Layer  │    │  ← localStorage read/write
          │  └────────┬────────┘    │
          │           │             │
          │  ┌────────▼────────┐    │
          │  │  UI Layer       │    │  ← DOM rendering functions
          │  └────────┬────────┘    │
          │           │             │
          │  ┌────────▼────────┐    │
          │  │  Chart Layer    │    │  ← Chart.js wrapper
          │  └─────────────────┘    │
          └─────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │     css/style.css       │
          └─────────────────────────┘
```

### Data Flow Summary

1. **App load** → read `localStorage` → populate `transactions[]` → render list, balance, chart
2. **Add transaction** → validate form → push to `transactions[]` → write `localStorage` → re-render list, balance, chart → clear form
3. **Delete transaction** → splice from `transactions[]` → write `localStorage` → re-render list, balance, chart

---

## Components and Interfaces

### HTML Components (`index.html`)

| Component | Element | ID / Class | Purpose |
|---|---|---|---|
| Balance Display | `<div>` | `#balance-display` | Shows total spending |
| Input Form | `<form>` | `#transaction-form` | Collects new transaction data |
| Item Name Field | `<input type="text">` | `#item-name` | Text input, max 100 chars |
| Amount Field | `<input type="number">` | `#item-amount` | Numeric input, 0.01–999999.99 |
| Category Dropdown | `<select>` | `#item-category` | Food / Transport / Fun |
| Submit Button | `<button type="submit">` | — | Triggers form submission |
| Error Container | `<div>` | `#form-errors` | Inline validation messages |
| Transaction List | `<ul>` | `#transaction-list` | Scrollable list of entries |
| Chart Container | `<div>` | `#chart-container` | Wraps canvas + empty state |
| Chart Canvas | `<canvas>` | `#spending-chart` | Chart.js render target |
| Empty Chart Msg | `<p>` | `#chart-empty-msg` | Shown when no transactions |
| Storage Warning | `<div>` | `#storage-warning` | Shown on storage errors |

### JavaScript Modules (all in `js/app.js`)

The file is organized into clearly commented sections rather than ES modules (to support `file://` protocol without a server):

```
js/app.js
├── Constants
├── State
├── Storage Layer
│   ├── loadFromStorage()
│   ├── saveToStorage()
│   └── checkStorageSupport()
├── Validation Layer
│   └── validateForm(name, amount, category)
├── UI Layer
│   ├── renderTransactionList()
│   ├── renderBalance()
│   ├── renderErrors(errors)
│   └── clearErrors()
├── Chart Layer
│   ├── initChart()
│   └── updateChart()
├── Event Handlers
│   ├── handleFormSubmit(event)
│   └── handleDeleteClick(event)
└── Initialization
    └── init()
```

### Function Signatures

```javascript
// Storage Layer
function loadFromStorage(): Transaction[] | null
function saveToStorage(transactions: Transaction[]): boolean
function checkStorageSupport(): boolean

// Validation Layer
// Returns an object mapping field names to error strings (empty = valid)
function validateForm(name: string, amount: string, category: string): ValidationResult

// UI Layer
function renderTransactionList(transactions: Transaction[]): void
function renderBalance(transactions: Transaction[]): void
function renderErrors(errors: ValidationResult): void
function clearErrors(): void
function showStorageWarning(message: string): void
function hideStorageWarning(): void

// Chart Layer
function initChart(): Chart  // creates Chart.js instance
function updateChart(transactions: Transaction[]): void

// Event Handlers
function handleFormSubmit(event: SubmitEvent): void
function handleDeleteClick(event: MouseEvent): void

// Init
function init(): void
```

---

## Data Models

### Transaction Object

```javascript
{
  id: string,        // crypto.randomUUID() or Date.now().toString() fallback
  name: string,      // 1–100 characters, trimmed
  amount: number,    // float, 0.01–999999.99, rounded to 2 decimal places
  category: string   // "Food" | "Transport" | "Fun"
}
```

### ValidationResult Object

```javascript
{
  name: string | null,      // error message or null if valid
  amount: string | null,    // error message or null if valid
  category: string | null   // error message or null if valid
}
```

### localStorage Schema

Key: `"expense_transactions"`  
Value: JSON-serialized array of Transaction objects

```json
[
  { "id": "1717000000000", "name": "Coffee", "amount": 4.50, "category": "Food" },
  { "id": "1717000001000", "name": "Bus fare", "amount": 2.00, "category": "Transport" }
]
```

### In-Memory State

```javascript
let transactions = [];   // single source of truth, array of Transaction objects
let chartInstance = null; // Chart.js Chart instance, initialized once on load
```

---

## HTML Structure

`index.html` is the single entry point. It links the stylesheet, loads Chart.js from CDN, and loads `app.js` at the end of `<body>` so the DOM is ready before any script runs.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense & Budget Visualizer</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

  <!-- Storage / compatibility warning banner (hidden by default) -->
  <div id="storage-warning" class="warning-banner" hidden>
    <p id="storage-warning-msg"></p>
  </div>

  <main class="app-container">

    <!-- Balance Display -->
    <header class="balance-section">
      <h1>Total Spending</h1>
      <p id="balance-display" class="balance-amount">$0.00</p>
    </header>

    <!-- Two-column layout: form + list on left, chart on right -->
    <div class="content-grid">

      <!-- Left column -->
      <section class="left-column">

        <!-- Input Form -->
        <form id="transaction-form" class="transaction-form" novalidate>
          <h2>Add Expense</h2>

          <div class="form-group">
            <label for="item-name">Item Name</label>
            <input type="text" id="item-name" name="item-name"
                   maxlength="100" autocomplete="off"
                   placeholder="e.g. Coffee" />
            <span class="field-error" id="error-name" aria-live="polite"></span>
          </div>

          <div class="form-group">
            <label for="item-amount">Amount ($)</label>
            <input type="number" id="item-amount" name="item-amount"
                   min="0.01" max="999999.99" step="0.01"
                   placeholder="0.00" />
            <span class="field-error" id="error-amount" aria-live="polite"></span>
          </div>

          <div class="form-group">
            <label for="item-category">Category</label>
            <select id="item-category" name="item-category">
              <option value="">-- Select --</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Fun">Fun</option>
            </select>
            <span class="field-error" id="error-category" aria-live="polite"></span>
          </div>

          <button type="submit" class="btn-primary">Add Transaction</button>
        </form>

        <!-- Transaction List -->
        <section class="transaction-section">
          <h2>Transactions</h2>
          <ul id="transaction-list" class="transaction-list" aria-label="Transaction list">
            <!-- Items injected by renderTransactionList() -->
          </ul>
        </section>

      </section>

      <!-- Right column: Chart -->
      <section class="chart-section">
        <h2>Spending by Category</h2>
        <div id="chart-container" class="chart-container">
          <canvas id="spending-chart" aria-label="Spending pie chart" role="img"></canvas>
          <p id="chart-empty-msg" class="chart-empty-msg">No spending data yet.</p>
        </div>
      </section>

    </div>
  </main>

  <!-- Chart.js via CDN (loaded before app.js so Chart is available) -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

### Transaction List Item Template

Each `<li>` rendered by `renderTransactionList` follows this structure:

```html
<li class="transaction-item" data-id="<transaction.id>">
  <span class="transaction-name">Coffee</span>
  <span class="transaction-amount">$4.50</span>
  <span class="transaction-category category-food">Food</span>
  <button class="btn-delete" aria-label="Delete Coffee transaction">✕</button>
</li>
```

The `data-id` attribute is used by `handleDeleteClick` to identify which transaction to remove. Category-specific CSS classes (`category-food`, `category-transport`, `category-fun`) allow color-coding.

---

## CSS Design

### File: `css/style.css`

#### Layout

The app uses CSS Grid for the two-column layout (form+list / chart) and Flexbox for internal component alignment.

```
.app-container          → max-width container, centered, padding
.content-grid           → CSS Grid: 1fr 1fr on wide screens, 1 column on narrow
.left-column            → Flexbox column: form stacked above list
.transaction-list       → fixed max-height with overflow-y: auto (scrollable)
.chart-section          → flex column, chart centered
```

#### Responsive Breakpoint

At `max-width: 700px`, `.content-grid` switches from two columns to a single column so the chart stacks below the form and list.

#### Color Scheme

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#f5f7fa` | Page background |
| `--color-surface` | `#ffffff` | Card/section backgrounds |
| `--color-primary` | `#4f46e5` | Submit button, accents |
| `--color-danger` | `#dc2626` | Delete button, error messages |
| `--color-text` | `#1e293b` | Primary text |
| `--color-muted` | `#64748b` | Labels, secondary text |
| `--color-border` | `#e2e8f0` | Input borders, dividers |
| `--color-food` | `#f59e0b` | Food category badge |
| `--color-transport` | `#3b82f6` | Transport category badge |
| `--color-fun` | `#10b981` | Fun category badge |

These same colors are used for the Chart.js pie chart segments to maintain visual consistency.

#### Typography

- Font family: system-ui stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Base font size: `16px`
- Balance amount: `2.5rem`, bold
- Section headings: `1.25rem`
- Transaction item text: `0.95rem`

#### Key Component Styles

```css
/* Scrollable transaction list */
.transaction-list {
  max-height: 320px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Inline field errors */
.field-error {
  color: var(--color-danger);
  font-size: 0.8rem;
  min-height: 1.2em;  /* prevents layout shift when error appears/disappears */
  display: block;
}

/* Warning banner */
.warning-banner {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 0.75rem 1rem;
}

/* Category badges */
.category-food     { background: var(--color-food); }
.category-transport { background: var(--color-transport); }
.category-fun      { background: var(--color-fun); }
```

---

## JavaScript Design

### File: `js/app.js`

The file uses no ES module syntax (`import`/`export`) to remain compatible with the `file://` protocol. All functions are in the global scope of the IIFE or simply top-level (a wrapping IIFE is optional but recommended to avoid polluting `window`).

#### Constants

```javascript
const STORAGE_KEY = 'expense_transactions';
const CATEGORIES = ['Food', 'Transport', 'Fun'];
const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Fun: '#10b981'
};
const MAX_NAME_LENGTH = 100;
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999999.99;
```

#### State

```javascript
let transactions = [];    // in-memory source of truth
let chartInstance = null; // Chart.js instance, created once in initChart()
```

#### Storage Layer

```javascript
function checkStorageSupport() {
  // Returns true if localStorage is available and writable
  // Uses try/catch to handle SecurityError in some private browsing modes
}

function loadFromStorage() {
  // Returns Transaction[] or null
  // 1. Check storage support; if not, return null
  // 2. Read STORAGE_KEY from localStorage
  // 3. If null/undefined, return null (no saved data)
  // 4. JSON.parse inside try/catch; on SyntaxError return null
  // 5. Validate each item has id (string), name (string), amount (number), category (string in CATEGORIES)
  // 6. If validation fails, return null
  // 7. Return parsed array
}

function saveToStorage(txns) {
  // Returns true on success, false on failure
  // 1. Check storage support; if not, return false
  // 2. JSON.stringify(txns) inside try/catch
  // 3. localStorage.setItem(STORAGE_KEY, json) inside try/catch
  // 4. On any error, return false
  // 5. Return true
}
```

#### Validation Layer

```javascript
function validateForm(name, amount, category) {
  // Returns ValidationResult: { name: string|null, amount: string|null, category: string|null }
  // name checks: trimmed empty → error; length > 100 → error
  // amount checks: empty → error; NaN → error; < MIN_AMOUNT → error; > MAX_AMOUNT → error;
  //   more than 2 decimal places → error
  // category checks: not in CATEGORIES → error
  // Returns null for each field that passes
}
```

#### UI Layer

```javascript
function formatCurrency(amount) {
  // Returns string like "$4.50"
  // Uses toFixed(2) and prepends "$"
}

function renderTransactionList(txns) {
  // Clears #transaction-list innerHTML
  // For each transaction, creates <li> with data-id, name, formatted amount, category badge, delete button
  // Appends to #transaction-list
}

function renderBalance(txns) {
  // Sums all amounts, formats as currency, sets #balance-display textContent
}

function renderErrors(errors) {
  // Sets #error-name, #error-amount, #error-category textContent from errors object
  // Empty string if null (clears the span)
}

function clearErrors() {
  // Calls renderErrors({ name: null, amount: null, category: null })
}

function showStorageWarning(message) {
  // Sets #storage-warning-msg textContent, removes hidden attribute from #storage-warning
}

function hideStorageWarning() {
  // Adds hidden attribute to #storage-warning
}

function renderAll(txns) {
  // Convenience: calls renderTransactionList, renderBalance, updateChart in sequence
}
```

#### Chart Layer

```javascript
function buildChartData(txns) {
  // Aggregates amounts by category
  // Returns { labels: string[], data: number[], colors: string[] }
  // Only includes categories with total > 0
}

function initChart() {
  // Creates new Chart(canvas, { type: 'pie', data: ..., options: ... })
  // Stores instance in chartInstance
  // Shows/hides #chart-empty-msg based on whether data is empty
}

function updateChart(txns) {
  // Calls buildChartData(txns)
  // Updates chartInstance.data.labels, chartInstance.data.datasets[0].data/backgroundColor
  // Calls chartInstance.update()
  // Shows/hides #chart-empty-msg
}
```

#### Event Handlers

```javascript
function handleFormSubmit(event) {
  event.preventDefault();
  clearErrors();

  const name = document.getElementById('item-name').value;
  const amount = document.getElementById('item-amount').value;
  const category = document.getElementById('item-category').value;

  const errors = validateForm(name, amount, category);
  if (errors.name || errors.amount || errors.category) {
    renderErrors(errors);
    return;
  }

  const newTransaction = {
    id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
    name: name.trim(),
    amount: parseFloat(parseFloat(amount).toFixed(2)),
    category
  };

  // Attempt storage BEFORE mutating in-memory state
  const updated = [...transactions, newTransaction];
  const saved = saveToStorage(updated);
  if (!saved) {
    showStorageWarning('Transaction could not be saved. Storage may be full or unavailable.');
    return;
  }

  transactions = updated;
  renderAll(transactions);

  // Clear form
  event.target.reset();
}

function handleDeleteClick(event) {
  const btn = event.target.closest('.btn-delete');
  if (!btn) return;

  const li = btn.closest('.transaction-item');
  const id = li.dataset.id;

  const updated = transactions.filter(t => t.id !== id);
  saveToStorage(updated); // best-effort; deletion failure is non-critical
  transactions = updated;
  renderAll(transactions);
}
```

#### Initialization

```javascript
function init() {
  if (!checkStorageSupport()) {
    showStorageWarning('localStorage is not available. Data will not be saved between sessions.');
  }

  const saved = loadFromStorage();
  if (saved === null && checkStorageSupport()) {
    // Only show warning if storage is supported but data was corrupted
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      showStorageWarning('Previous data could not be loaded and has been cleared.');
    }
  }

  transactions = saved || [];
  initChart();
  renderAll(transactions);

  document.getElementById('transaction-form')
    .addEventListener('submit', handleFormSubmit);

  document.getElementById('transaction-list')
    .addEventListener('click', handleDeleteClick);
}

document.addEventListener('DOMContentLoaded', init);
```

#### Chart.js Integration

Chart.js 4.x is loaded via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
```

The UMD build exposes `Chart` as a global, so no `import` is needed. The pie chart is configured with:

```javascript
{
  type: 'pie',
  data: {
    labels: [],          // populated by buildChartData
    datasets: [{
      data: [],          // populated by buildChartData
      backgroundColor: [] // populated by buildChartData using CATEGORY_COLORS
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}`
        }
      }
    }
  }
}
```

`chartInstance.update()` is called after every data change. The canvas is hidden and `#chart-empty-msg` is shown when `buildChartData` returns an empty dataset.

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid inputs are rejected and state is unchanged

*For any* combination of form inputs where at least one field is invalid (empty name, out-of-range amount, missing category), the `validateForm` function SHALL return at least one error message, and the `transactions` array SHALL remain unchanged after an attempted submission.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Valid submission adds exactly one transaction

*For any* valid (non-empty name ≤ 100 chars, amount in [0.01, 999999.99] with ≤ 2 decimal places, category in {Food, Transport, Fun}), submitting the form SHALL increase the length of the `transactions` array by exactly one, and the new entry SHALL contain the submitted name, amount, and category.

**Validates: Requirements 1.4**

---

### Property 3: Transaction list preserves insertion order with correct fields

*For any* sequence of transactions added to the list, the rendered DOM list SHALL contain each transaction's name, currency-formatted amount, and category label in the same order they were inserted.

**Validates: Requirements 2.1, 2.2**

---

### Property 4: Delete removes exactly the targeted transaction

*For any* non-empty `transactions` array and any valid index into that array, deleting the transaction at that index SHALL produce a `transactions` array of length `n - 1` that does not contain the deleted transaction's `id`, while all other transactions remain present and unchanged.

**Validates: Requirements 2.4**

---

### Property 5: Balance always equals the arithmetic sum of transaction amounts

*For any* `transactions` array (including the empty array), the value displayed by `renderBalance` SHALL equal the sum of all `amount` fields rounded to two decimal places, formatted as `$X.XX`.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

---

### Property 6: Currency formatting produces a valid `$X.XX` string

*For any* non-negative number, the currency formatting function SHALL return a string matching the pattern `^\$\d+\.\d{2}$` (dollar sign, one or more digits, decimal point, exactly two digits).

**Validates: Requirements 3.4**

---

### Property 7: Chart data aggregation reflects only non-zero categories with correct values

*For any* `transactions` array, the chart data aggregation function SHALL return a dataset that (a) includes only categories with at least one transaction, (b) assigns each included category a value equal to the sum of its transactions' amounts, and (c) excludes categories with no transactions.

**Validates: Requirements 4.1**

---

### Property 8: Storage serialization round-trip preserves transaction data

*For any* `transactions` array, calling `saveToStorage` followed by `loadFromStorage` SHALL return an array that is deeply equal to the original (same length, same `id`/`name`/`amount`/`category` values in the same order).

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 9: Corrupted storage data is handled gracefully without throwing

*For any* string stored in `localStorage` that is not valid JSON or does not conform to the transaction schema (e.g., random strings, arrays of non-objects, objects missing required fields), `loadFromStorage` SHALL return `null` or an empty array rather than throwing an exception.

**Validates: Requirements 5.6**

---

### Property 10: Storage write failure prevents transaction from being added

*For any* valid transaction input, if `localStorage.setItem` throws an error (e.g., quota exceeded), the `transactions` array SHALL remain unchanged (the new transaction SHALL NOT be appended), and a visible error message SHALL be present in the DOM.

**Validates: Requirements 5.5**

---

## Error Handling

### Storage Errors

| Scenario | Detection | Response |
|---|---|---|
| `localStorage` not supported | `typeof localStorage === 'undefined'` or try/catch in `checkStorageSupport()` | Show persistent warning banner; app runs in-session without persistence |
| `setItem` throws (quota exceeded) | try/catch around `localStorage.setItem(...)` | Show error message; do NOT push to `transactions[]`; do NOT update UI |
| Stored value is not valid JSON | try/catch around `JSON.parse(...)` | Discard data; initialize empty state; show warning banner |
| Parsed data fails schema validation | Check each item has `id`, `name`, `amount`, `category` with correct types | Discard data; initialize empty state; show warning banner |

### Validation Errors

Validation errors are field-level and displayed inline. The `validateForm` function returns a `ValidationResult` object. The `renderErrors` function maps each non-null error to a `<span>` element adjacent to its field. Errors are cleared on each new submission attempt.

| Field | Invalid Condition | Error Message |
|---|---|---|
| name | Empty or whitespace-only | "Item name is required." |
| name | Exceeds 100 characters | "Item name must be 100 characters or fewer." |
| amount | Empty | "Amount is required." |
| amount | Not a valid number | "Amount must be a number." |
| amount | Less than 0.01 | "Amount must be at least $0.01." |
| amount | Greater than 999,999.99 | "Amount must not exceed $999,999.99." |
| amount | More than 2 decimal places | "Amount may have at most two decimal places." |
| category | No option selected | "Please select a category." |

### Chart Errors

If Chart.js fails to load (CDN unavailable), the `<canvas>` element will be empty. The app will still function for all non-chart features. No explicit error handling is required for CDN failures beyond the browser's natural behavior.

---

## Testing Strategy

### Overview

The testing strategy uses two complementary approaches:
- **Unit/example tests**: Verify specific behaviors, edge cases, and error conditions with concrete inputs.
- **Property-based tests**: Verify universal properties across many generated inputs using a PBT library.

### Property-Based Testing Library

Use **[fast-check](https://github.com/dubzzz/fast-check)** for JavaScript property-based testing. It is the most widely used PBT library for JavaScript/TypeScript, supports all required arbitraries (strings, numbers, arrays, objects), and runs in Node.js without a browser.

Each property test MUST run a minimum of **100 iterations**.

Each property test MUST be tagged with a comment in the format:
```
// Feature: expense-budget-visualizer, Property N: <property_text>
```

### Test File Structure

```
tests/
├── unit/
│   ├── validation.test.js      ← validateForm unit tests
│   ├── storage.test.js         ← loadFromStorage / saveToStorage unit tests
│   ├── balance.test.js         ← renderBalance / formatCurrency unit tests
│   └── chart.test.js           ← chart data aggregation unit tests
└── property/
    ├── validation.property.js  ← Properties 1, 2
    ├── list.property.js        ← Properties 3, 4
    ├── balance.property.js     ← Properties 5, 6
    ├── chart.property.js       ← Property 7
    └── storage.property.js     ← Properties 8, 9, 10
```

### Property Test Mapping

| Property | Test File | fast-check Arbitraries |
|---|---|---|
| 1: Invalid inputs rejected | `validation.property.js` | `fc.string()`, `fc.float()`, `fc.constantFrom(...)` with invalid combinations |
| 2: Valid submission adds transaction | `validation.property.js` | `fc.string({minLength:1, maxLength:100})`, `fc.float({min:0.01, max:999999.99})` |
| 3: Insertion order preserved | `list.property.js` | `fc.array(transactionArbitrary)` |
| 4: Delete removes target | `list.property.js` | `fc.array(transactionArbitrary, {minLength:1})`, `fc.integer` for index |
| 5: Balance equals sum | `balance.property.js` | `fc.array(transactionArbitrary)` |
| 6: Currency format | `balance.property.js` | `fc.float({min:0, max:999999.99})` |
| 7: Chart data aggregation | `chart.property.js` | `fc.array(transactionArbitrary)` |
| 8: Storage round-trip | `storage.property.js` | `fc.array(transactionArbitrary)` |
| 9: Corrupted data handled | `storage.property.js` | `fc.string()`, `fc.jsonValue()` |
| 10: Storage failure prevents add | `storage.property.js` | `transactionArbitrary` with mocked `localStorage` |

### Unit Test Coverage

Unit tests focus on:
- Specific valid and invalid form input examples
- Edge cases: empty array, single transaction, maximum-length name, boundary amounts (0.01, 999999.99)
- Error message text accuracy
- Empty state rendering (balance $0.00, chart empty message visible)
- `localStorage` not supported (mock `window.localStorage` as undefined)
- Chart.js instance creation and update calls

### Integration Points

The pure logic functions (`validateForm`, `loadFromStorage`, `saveToStorage`, chart data aggregation, `formatCurrency`) are designed to be testable in isolation from the DOM. DOM-dependent functions (`renderTransactionList`, `renderBalance`, `renderErrors`) are tested with a lightweight DOM environment (jsdom via Jest or Vitest).
