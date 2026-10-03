# Implementation Plan: Personal Finance Tracker

## Overview

Build a vanilla JavaScript personal finance tracker with 3 files (index.html, styles.css, app.js). No frameworks, no build tools. All data stored in localStorage with Chart.js for visualizations via CDN.

## Tasks

- [x] 1. Create HTML structure and load dependencies
  - Create index.html with complete UI markup (transaction form, list view, dashboard sections)
  - Link Tailwind CSS and Chart.js via CDN in HTML head
  - Include all form inputs, buttons, tables, and canvas elements for charts
  - Add basic styles.css for any custom styling needed beyond Tailwind
  - _Requirements: 1.4, 2.3, 2.7, 6.1, 6.2, 6.3, 6.4, 6.9_

- [x] 2. Implement transaction CRUD and localStorage operations
  - Write functions for add, update, delete, and retrieve transactions
  - Implement validateTransaction with all validation rules (amount, category, date, notes)
  - Write loadTransactions and saveTransactions with error handling
  - Handle storage errors (unavailable, quota exceeded, parse failures)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8, 1.9, 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

- [x] 3. Build transaction list UI with edit/delete
  - Write renderTransactionList to display all transactions sorted by date descending
  - Implement handleEditTransaction to populate form with existing data
  - Implement handleDeleteTransaction with confirmation prompt
  - Display empty state when no transactions exist
  - Show success/error messages with appropriate timing
  - _Requirements: 1.5, 1.6, 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 4. Implement dashboard calculations and charts
  - Write getTotalSpending, getSpendingByCategory, and getSpendingByMonth functions
  - Render Category_Chart (pie chart) using Chart.js with legend and title
  - Render Time_Chart (line chart) for 12-month trends with axis labels
  - Handle edge cases (no data, single category, zero amounts)
  - Format all currency values to 2 decimal places
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 6.9, 6.10_

- [x] 5. Build export/import functionality
  - Implement exportData to serialize transactions as JSON and trigger download
  - Implement importData to parse JSON file and validate structure
  - Validate required fields (amount, category, date) and formats
  - Handle invalid JSON syntax with descriptive error messages
  - Ensure round-trip integrity (export → import preserves all data)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1, 8.2, 8.3, 8.4_

- [x] 6. Wire everything together and add initialization
  - Write init function to load transactions and render initial view
  - Setup all event listeners (form submit, edit, delete, export, import, navigation)
  - Implement view switching between transaction list and dashboard
  - Add hover states and focus indicators for interactive elements
  - Test responsive layout at 320px minimum width
  - _Requirements: 3.4, 6.5, 6.6, 6.7, 6.8_

## Notes

- Currency conversion (Requirement 7) is optional and not included in this task list
- All code goes in single app.js file - no classes, just functions grouped by responsibility
- Test manually by opening index.html directly in browser (no server needed)
- Property-based tests can be added later using fast-check via CDN

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3", "4", "5"] },
    { "id": 3, "tasks": ["6"] }
  ]
}
```
