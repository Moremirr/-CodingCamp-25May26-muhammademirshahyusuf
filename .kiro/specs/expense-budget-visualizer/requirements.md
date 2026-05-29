# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses by category, view a running total balance, and visualize spending distribution through a pie chart. The application runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with all data persisted via the browser's Local Storage API. It requires no backend server, no build tools, and no complex setup — making it usable as a standalone web page or browser extension.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category.
- **Category**: One of three predefined spending labels — Food, Transport, or Fun.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Input_Form**: The UI form component used to enter and submit new transactions.
- **Balance_Display**: The UI component at the top of the page that shows the total sum of all transaction amounts.
- **Pie_Chart**: The visual chart component that displays spending distribution by category.
- **Storage**: The browser's Local Storage API used to persist transaction data client-side.
- **Validator**: The client-side logic responsible for checking that all required form fields are filled before submission.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter expense details through a form, so that I can record my spending quickly and accurately.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name (maximum 100 characters), a numeric field for the amount (accepting values between 0.01 and 999,999.99 with up to two decimal places), and a dropdown selector for the category with exactly three options: Food, Transport, and Fun.
2. WHEN the user submits the Input_Form, THE Validator SHALL check that the item name field is not empty, the amount field contains a numeric value between 0.01 and 999,999.99 with no more than two decimal places, and a category option has been selected.
3. IF any required field is empty or invalid at submission time, THEN THE Validator SHALL display an inline error message adjacent to each offending field identifying the specific validation failure, SHALL NOT add a transaction, and SHALL preserve the current values in all fields that passed validation.
4. WHEN all fields are valid and the form is submitted, THE App SHALL add the transaction to the Transaction_List and clear all Input_Form fields to their default empty/unselected state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my recorded expenses in a list, so that I can review and manage my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all recorded transactions in the order they were added, with the most recently added transaction appearing last.
2. THE Transaction_List SHALL show the item name, amount formatted as a currency value with two decimal places and a currency symbol, and the category label for each transaction.
3. WHILE the number of transactions causes the Transaction_List to exceed its fixed display height, THE Transaction_List SHALL be independently scrollable so that all entries remain accessible without affecting the rest of the page layout.
4. WHEN the user activates the delete control on a transaction, THE App SHALL immediately remove that transaction from the Transaction_List, update the Balance_Display, update the Pie_Chart, and remove the transaction from Storage.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending at a glance, so that I can understand how much I have spent overall.

#### Acceptance Criteria

1. THE Balance_Display SHALL be positioned at the top of the page and SHALL show the arithmetic sum of the amounts of all current transactions.
2. WHEN a transaction is added, THE Balance_Display SHALL update its displayed total within the same user interaction cycle, without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update its displayed total within the same user interaction cycle, without requiring a page reload.
4. THE Balance_Display SHALL format the total as a numeric value with exactly two decimal places preceded by a currency symbol (e.g., $0.00).
5. WHEN no transactions exist, THE Balance_Display SHALL show a value of $0.00.

---

### Requirement 4: Spending Distribution Pie Chart

**User Story:** As a user, I want to see a visual breakdown of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Pie_Chart SHALL display one segment per category (Food, Transport, Fun) that has at least one transaction, where each segment's size represents that category's percentage of the total spending amount; categories with no transactions SHALL be excluded from the chart.
2. WHEN a transaction is added, THE Pie_Chart SHALL update to reflect the new spending distribution within 1 second of the transaction being committed.
3. WHEN a transaction is deleted, THE Pie_Chart SHALL update to reflect the revised spending distribution within 1 second of the deletion being committed.
4. WHILE no transactions have been recorded, THE Pie_Chart SHALL display a visible text message indicating that no spending data is available.
5. THE Pie_Chart SHALL be rendered using Chart.js loaded via CDN, requiring no local installation or build step.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my expense data to be saved between sessions, so that I do not lose my records when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the complete updated transaction list to Storage as a serialized JSON string before the UI update is considered complete.
2. WHEN a transaction is deleted, THE App SHALL write the complete updated transaction list to Storage as a serialized JSON string before the UI update is considered complete.
3. WHEN the App loads, THE App SHALL read all previously saved transactions from Storage and render them in the Transaction_List in their original insertion order, update the Balance_Display, and render the Pie_Chart.
4. IF Storage contains no saved data on load, THEN THE App SHALL initialize with an empty Transaction_List, a Balance_Display showing $0.00, and the Pie_Chart empty state.
5. IF a Storage write operation fails (e.g., quota exceeded), THEN THE App SHALL display a visible error message informing the user that the transaction could not be saved and SHALL NOT add the transaction to the Transaction_List.
6. IF the data retrieved from Storage on load is not valid JSON or does not conform to the expected transaction schema, THEN THE App SHALL discard the corrupted data, initialize with an empty state, and display a visible warning message informing the user that previous data could not be loaded.

---

### Requirement 6: Browser Compatibility

**User Story:** As a user, I want the app to work reliably across modern browsers, so that I can use it regardless of my preferred browser.

#### Acceptance Criteria

1. WHEN the App is opened in the latest stable release of Chrome, Firefox, Edge, or Safari at the time of testing, THE App SHALL render without JavaScript console errors, display its full layout within the browser viewport, and allow all interactive controls (form submission, transaction deletion, chart interaction) to respond to user input.
2. THE App SHALL use only Web APIs that are part of the Living Standard or a published W3C/WHATWG specification and are available in the latest stable release of Chrome, Firefox, Edge, and Safari without requiring polyfills.
3. IF the App is opened in a browser that does not support the Local Storage API, THEN THE App SHALL display a visible warning message informing the user that data persistence is unavailable and SHALL continue to function for the current session without persistence.

---

### Requirement 7: Code and File Structure

**User Story:** As a developer, I want the project to follow a clean, minimal file structure, so that the codebase is easy to read and maintain.

#### Acceptance Criteria

1. THE App SHALL contain exactly one stylesheet file, and that file SHALL be located inside a directory named `css/` at the project root.
2. THE App SHALL contain exactly one JavaScript source file authored by the project, and that file SHALL be located inside a directory named `js/` at the project root.
3. WHEN a user opens `index.html` directly in a supported browser (via the file:// protocol or a local HTTP server), THE App SHALL fully render and be interactive without any additional installation, build command, or server process.
4. THE App SHALL not import, require, or load at runtime any JavaScript library that provides a component model, virtual DOM, reactive data binding, or declarative template rendering (including but not limited to React, Vue, Angular, Svelte, and Ember).
5. THE App SHALL not depend on any runtime executable, package manager, or module bundler (such as Node.js, npm scripts, Webpack, or Vite) to function in the browser.
