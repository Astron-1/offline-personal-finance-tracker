# Manual UI Testing Guide for Transaction List

## Prerequisites
Open `index.html` in a web browser (Chrome, Firefox, or Edge)

## Test Cases

### Test 1: Empty State Display (Requirement 2.4)
**Steps:**
1. Open the application with no existing data
2. Observe the transaction list section

**Expected Result:**
- Should display an icon and message "No transactions yet"
- Should show instructions "Add your first transaction using the form above to get started tracking your expenses."

**Status:** ✓ PASS if empty state message is visible

---

### Test 2: Add Transaction and View in List (Requirements 2.1, 2.2)
**Steps:**
1. Fill in the transaction form:
   - Amount: 50.99
   - Category: Food
   - Date: Today's date
   - Notes: "Groceries"
2. Click "Add Transaction"
3. Observe the transaction list

**Expected Result:**
- Success message "Transaction added successfully" appears for 2+ seconds
- Transaction appears in the table with:
  - Date in first column
  - Category badge in second column
  - Amount right-aligned in third column showing "$50.99"
  - Notes in fourth column showing "Groceries"
  - Edit and Delete buttons in fifth column

**Status:** ✓ PASS if transaction displays correctly with all fields

---

### Test 3: Multiple Transactions - Date Descending Sort (Requirement 2.1)
**Steps:**
1. Add three transactions with different dates:
   - Transaction 1: Date 2025-01-10, Amount $25.00
   - Transaction 2: Date 2025-01-20, Amount $75.00
   - Transaction 3: Date 2025-01-15, Amount $50.00
2. Observe the order in the transaction list

**Expected Result:**
- Transactions should appear in this order (most recent first):
  1. 2025-01-20 ($75.00)
  2. 2025-01-15 ($50.00)
  3. 2025-01-10 ($25.00)

**Status:** ✓ PASS if transactions are sorted by date descending

---

### Test 4: Edit Transaction - Form Prepopulation (Requirement 2.5)
**Steps:**
1. Click "Edit" button on any transaction
2. Observe the form at the top

**Expected Result:**
- Form title changes to "Edit Transaction"
- Submit button text changes to "Update Transaction"
- Cancel button appears
- All form fields are filled with the transaction's data:
  - Amount field shows the transaction amount
  - Category dropdown shows the transaction category
  - Date field shows the transaction date
  - Notes field shows the transaction notes
- Page scrolls to the form

**Status:** ✓ PASS if all fields are correctly populated

---

### Test 5: Edit Transaction - Update and Save (Requirements 1.2, 1.5)
**Steps:**
1. Click "Edit" on a transaction
2. Change the amount to a different value
3. Click "Update Transaction"
4. Observe the transaction list

**Expected Result:**
- Success message "Transaction updated successfully" appears for 2+ seconds
- Form resets to "Add Transaction" mode
- Transaction in the list shows the updated amount
- Transaction list refreshes within 500ms

**Status:** ✓ PASS if transaction updates correctly

---

### Test 6: Edit Transaction - Cancel (No Save)
**Steps:**
1. Click "Edit" on a transaction
2. Change some field values
3. Click "Cancel" button
4. Observe the form and transaction list

**Expected Result:**
- Form resets to "Add Transaction" mode
- Form fields are cleared
- Date field resets to today
- Transaction in the list remains unchanged (original values preserved)
- No success/error message appears

**Status:** ✓ PASS if changes are discarded

---

### Test 7: Delete Transaction - Confirmation Prompt (Requirement 2.6)
**Steps:**
1. Click "Delete" button on any transaction
2. Observe the confirmation dialog

**Expected Result:**
- Browser confirmation dialog appears
- Message says "Are you sure you want to delete this transaction? This action cannot be undone."

**Status:** ✓ PASS if confirmation prompt appears

---

### Test 8: Delete Transaction - Confirm Deletion (Requirements 1.3, 1.5)
**Steps:**
1. Click "Delete" on a transaction
2. Click "OK" in the confirmation dialog
3. Observe the transaction list

**Expected Result:**
- Success message "Transaction deleted successfully" appears for 2+ seconds
- Transaction is removed from the list
- Other transactions remain visible
- List refreshes within 500ms

**Status:** ✓ PASS if transaction is deleted

---

### Test 9: Delete Transaction - Cancel Deletion (Requirement 2.6)
**Steps:**
1. Click "Delete" on a transaction
2. Click "Cancel" in the confirmation dialog
3. Observe the transaction list

**Expected Result:**
- No message appears
- Transaction remains in the list (not deleted)
- No changes to the transaction list

**Status:** ✓ PASS if transaction is not deleted

---

### Test 10: Success Message Timing (Requirement 1.5)
**Steps:**
1. Add a new transaction
2. Start a timer when the success message appears
3. Wait until the message disappears

**Expected Result:**
- Success message displays for at least 2 seconds
- Message fades out smoothly
- Message disappears after 2 seconds

**Status:** ✓ PASS if message displays for 2+ seconds

---

### Test 11: Error Message Timing (Requirement 1.6)
**Steps:**
1. Try to add a transaction with invalid data (e.g., negative amount)
2. Start a timer when the error message appears
3. Wait until the message disappears

**Expected Result:**
- Error message displays for at least 3 seconds
- Message is styled differently from success (red background)
- Message disappears after 3 seconds

**Status:** ✓ PASS if message displays for 3+ seconds

---

### Test 12: Right-Aligned Amount Column (Requirement 2.2)
**Steps:**
1. Add multiple transactions with varying amounts (e.g., $5.00, $150.99, $1,234.56)
2. Observe the Amount column alignment

**Expected Result:**
- All amount values are right-aligned
- Decimal points line up vertically
- All amounts show exactly 2 decimal places
- Dollar sign precedes each amount

**Status:** ✓ PASS if amounts are right-aligned

---

### Test 13: Table Headers Display (Requirement 2.3)
**Steps:**
1. Add at least one transaction
2. Observe the table headers

**Expected Result:**
- Table has headers for all columns:
  - Date
  - Category
  - Amount
  - Notes
  - Actions
- Headers are styled differently from table rows (bold, uppercase, smaller font)

**Status:** ✓ PASS if all headers are visible

---

### Test 14: Responsive Layout at 320px (Requirement 2.7)
**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar and set viewport to 320px width
3. Observe the transaction list

**Expected Result:**
- Table remains readable (may scroll horizontally)
- No content is cut off
- All columns are accessible
- Layout maintains structure at 320px minimum width

**Status:** ✓ PASS if layout works at 320px

---

## Summary
Check all test cases above. The transaction list UI should:
- Display empty state when no transactions exist
- Show transactions in a table sorted by date descending
- Right-align amount values
- Allow editing transactions with form prepopulation
- Allow deleting transactions with confirmation
- Display success messages for 2+ seconds
- Display error messages for 3+ seconds
- Maintain responsive layout down to 320px width

All requirements validated:
- 1.2, 1.3, 1.5, 1.6 (Transaction operations and messaging)
- 2.1, 2.2, 2.4, 2.5, 2.6 (Transaction list display and interactions)
