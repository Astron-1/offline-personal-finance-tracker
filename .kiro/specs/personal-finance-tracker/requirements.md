# Requirements Document

## Introduction

The Personal Finance Tracker is a local-first web application that enables users to track personal expenses through manual transaction entry, visualize spending patterns through charts and category summaries, and maintain complete data ownership through browser-based storage with export/import capabilities. The system operates entirely client-side with no backend services or cloud storage.

## Glossary

- **Finance_Tracker**: The complete web application system
- **Transaction**: A financial record containing amount, category, date, and optional note
- **Category**: One of seven predefined expense classifications: Food, Transport, Housing, Shopping, Entertainment, Health, Other
- **Dashboard**: The primary view displaying spending summaries and visualizations
- **Local_Storage**: Browser-based persistent storage (IndexedDB or localStorage)
- **Transaction_List**: The interface component displaying all transactions with edit/delete capabilities
- **Export_File**: A JSON file containing all transaction data
- **Category_Chart**: A bar or pie chart showing spending distribution by category
- **Time_Chart**: A line chart showing spending trends grouped by month
- **Currency_Converter**: Optional feature converting amounts to a second currency using live exchange rates

## Requirements

### Requirement 1: Transaction Management

**User Story:** As a user, I want to add, edit, and delete transactions, so that I can maintain an accurate record of my expenses.

#### Acceptance Criteria

1. WHEN a user submits a new transaction with amount (positive number with up to two decimal places), category (one of the seven predefined values), date (valid calendar date), and optional note (up to 500 characters), THE Finance_Tracker SHALL store the transaction in Local_Storage
2. WHEN a user edits an existing transaction by modifying any of its fields (amount, category, date, or note), THE Finance_Tracker SHALL update the transaction in Local_Storage and refresh all displayed data within 500 milliseconds
3. WHEN a user deletes a transaction by selecting the delete action and confirming the deletion, THE Finance_Tracker SHALL remove the transaction from Local_Storage and refresh all displayed data within 500 milliseconds
4. THE Finance_Tracker SHALL restrict category selection to exactly seven values: Food, Transport, Housing, Shopping, Entertainment, Health, Other
5. WHEN a transaction operation completes successfully, THE Finance_Tracker SHALL display success feedback to the user for at least 2 seconds
6. IF a transaction operation fails, THEN THE Finance_Tracker SHALL display an error message describing the failure for at least 3 seconds
7. IF a user submits a transaction with an invalid amount (non-numeric, negative, or more than two decimal places), THEN THE Finance_Tracker SHALL display an error message indicating the amount validation rule and SHALL NOT store the transaction
8. IF a user submits a transaction with an invalid date (non-existent calendar date or unparseable format), THEN THE Finance_Tracker SHALL display an error message indicating the date must be a valid calendar date and SHALL NOT store the transaction
9. IF Local_Storage write operation fails when storing or updating a transaction, THEN THE Finance_Tracker SHALL display an error message indicating storage failure and SHALL NOT update the displayed data

### Requirement 2: Transaction Viewing

**User Story:** As a user, I want to view all my transactions in a clear list, so that I can review my expense history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions with amount, category, date, and note in descending order by date (most recent first)
2. THE Transaction_List SHALL right-align all amount values
3. THE Transaction_List SHALL display column headers for all transaction fields
4. WHEN no transactions exist, THE Transaction_List SHALL display an empty state message instructing the user how to add their first transaction
5. WHEN a user selects the edit action for a transaction, THE Transaction_List SHALL navigate to an edit interface pre-populated with that transaction's current values
6. WHEN a user selects the delete action for a transaction, THE Transaction_List SHALL display a confirmation prompt before deleting
7. THE Transaction_List SHALL maintain readable layout on viewports with minimum width of 320 pixels

### Requirement 3: Spending Dashboard

**User Story:** As a user, I want to see visual summaries of my spending, so that I can understand my expense patterns.

#### Acceptance Criteria

1. THE Dashboard SHALL calculate the total spending amount as the sum of all transaction amounts and display it formatted to two decimal places
2. THE Dashboard SHALL display a Category_Chart showing spending distribution with both the absolute amount and percentage for each category
3. THE Dashboard SHALL display a Time_Chart showing monthly spending totals for the most recent 12 months in chronological order
4. WHEN viewport width is 1024 pixels or greater, THE Dashboard SHALL position total spend, Category_Chart, and Time_Chart within the first 768 pixels of vertical scroll
5. THE Category_Chart SHALL include a descriptive title and a legend identifying each category
6. THE Time_Chart SHALL include a descriptive title and a legend or axis labels identifying the time period
7. WHEN no transactions exist, THE Dashboard SHALL display the total spending as zero and render both charts with a message indicating no data available
8. WHEN only one category contains transactions, THE Category_Chart SHALL display a single segment representing 100 percent of spending
9. WHEN a transaction has a zero or negative amount, THE Dashboard SHALL include it in the total spending calculation
10. WHEN the current month is incomplete, THE Time_Chart SHALL include the partial month data as the most recent data point

### Requirement 4: Data Persistence and Privacy

**User Story:** As a user, I want my data stored locally in my browser, so that I maintain complete control and privacy over my financial information.

#### Acceptance Criteria

1. THE Finance_Tracker SHALL store all transaction data exclusively in Local_Storage within the user's browser
2. THE Finance_Tracker SHALL NOT transmit transaction data to any backend service or cloud storage
3. THE Finance_Tracker SHALL NOT require user accounts or authentication
4. WHEN the user navigates to the application URL after a previous session, THE Finance_Tracker SHALL load all previously stored transactions from Local_Storage
5. IF Local_Storage is unavailable (blocked by browser settings or unsupported), THEN THE Finance_Tracker SHALL display an error message indicating that the application requires Local_Storage to function
6. IF a Local_Storage write operation fails due to quota exceeded, THEN THE Finance_Tracker SHALL display an error message indicating storage quota limits and suggest exporting data
7. IF loading or parsing transaction data from Local_Storage fails, THEN THE Finance_Tracker SHALL display an error message and initialize with an empty transaction list

### Requirement 5: Data Export and Import

**User Story:** As a user, I want to export and import my data as JSON files, so that I can backup my data and restore it exactly.

#### Acceptance Criteria

1. WHEN a user initiates data export, THE Finance_Tracker SHALL generate an Export_File containing a JSON array where each element includes amount, category, date, and notes fields for each transaction
2. WHEN a user selects an Export_File for import, THE Finance_Tracker SHALL restore all transactions from the file to Local_Storage
3. THE Finance_Tracker SHALL ensure that exporting all transactions followed by importing the resulting Export_File produces a Dashboard state where all transaction amounts, categories, dates, and notes match the pre-export state
4. IF an Export_File is missing required fields (amount, category, date), THEN THE Finance_Tracker SHALL display an error message indicating which fields are missing and SHALL NOT modify Local_Storage
5. IF an Export_File contains data in an incorrect format (non-numeric amount, unrecognized category, malformed date), THEN THE Finance_Tracker SHALL display an error message indicating the format error and SHALL NOT modify Local_Storage
6. WHEN a user imports an Export_File containing transactions that duplicate existing Local_Storage entries, THE Finance_Tracker SHALL add the imported transactions as new entries

### Requirement 6: User Interface Design

**User Story:** As a user, I want a clean and consistent interface, so that the application is pleasant and easy to use.

#### Acceptance Criteria

1. THE Finance_Tracker SHALL use exactly one accent color for primary actions, links, and focus indicators throughout the interface
2. THE Finance_Tracker SHALL use a consistent spacing scale based on Tailwind default values
3. THE Finance_Tracker SHALL use a maximum of three font sizes for body text, headings, and labels
4. THE Transaction_List SHALL align form input fields with labels positioned consistently above or to the left of their corresponding inputs
5. WHEN an interactive element is in default state, THE Finance_Tracker SHALL display it with standard styling
6. WHEN a user hovers over an interactive element, THE Finance_Tracker SHALL display a visual change within 100 milliseconds
7. WHEN an interactive element receives focus, THE Finance_Tracker SHALL display a visible focus indicator
8. WHEN an interactive element is disabled, THE Finance_Tracker SHALL reduce its opacity and prevent interaction
9. THE Finance_Tracker SHALL format currency amounts with exactly two decimal places, thousands separators, and a currency symbol
10. THE Finance_Tracker SHALL apply the same currency format to all monetary values in transaction lists, summaries, and reports

### Requirement 7: Currency Conversion (Optional)

**User Story:** As a user, I want to toggle between my primary currency and a second currency using live exchange rates, so that I can view my spending in different currencies.

#### Acceptance Criteria

1. WHERE currency conversion is enabled, THE Currency_Converter SHALL fetch current exchange rates from the frankfurter.app API via the mcp-server-fetch MCP server with a timeout of 5 seconds
2. WHERE currency conversion is enabled, WHEN the fetched exchange rate is older than 24 hours, THE Currency_Converter SHALL fetch a fresh exchange rate before performing conversion
3. WHERE currency conversion is enabled, WHEN a user toggles to a second currency, THE Dashboard SHALL display all total amounts and category totals converted using the fetched exchange rate rounded to two decimal places
4. WHERE currency conversion is enabled, IF the target currency code is not supported by the frankfurter.app API, THEN THE Finance_Tracker SHALL display an error message and revert to the original currency
5. IF the exchange rate fetch fails (network error, timeout, or API unavailable) or the system is offline, THEN THE Finance_Tracker SHALL display amounts in the original currency with a notification that conversion is unavailable
6. WHERE currency conversion is enabled, THE Currency_Converter SHALL NOT block or delay Dashboard rendering by more than 2 seconds while fetching exchange rates

### Requirement 8: Transaction Parser and Serializer

**User Story:** As a developer, I want reliable parsing and serialization of transaction data, so that export and import operations are robust.

#### Acceptance Criteria

1. WHEN an Export_File is generated, THE Finance_Tracker SHALL serialize all transaction data into valid JSON format where each transaction is an object with amount, category, date, and notes properties
2. WHEN an Export_File is imported, THE Finance_Tracker SHALL parse the JSON data into Transaction objects
3. IF an import file contains invalid JSON syntax, THEN THE Finance_Tracker SHALL return an error message containing the phrase "invalid JSON format" and the parse error details
4. THE Finance_Tracker SHALL ensure that serializing a transaction dataset, then parsing the result, then serializing again produces JSON output byte-identical to the first serialization
