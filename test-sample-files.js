/**
 * Tests for Sample JSON Files
 * Verifies that sample-data.json imports correctly
 * and that invalid-data.json and invalid-json.json are properly rejected
 */

const fs = require('fs');
const path = require('path');

// Mock environment (same as test-export-import-pbt.js)
const localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = value; },
  removeItem(key) { delete this.data[key]; },
  clear() { this.data = {}; }
};

global.localStorage = localStorage;

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Shopping', 'Entertainment', 'Health', 'Other'];
let transactions = [];
let messageLog = [];

function showMessage(text, type) {
  messageLog.push({ text, type });
  console.log(`[${type}] ${text}`);
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  }
  
  return true;
}

function importDataSync(jsonString) {
  try {
    let imported;
    try {
      imported = JSON.parse(jsonString);
    } catch (parseError) {
      showMessage(`Import failed: invalid JSON format - ${parseError.message}`, 'error');
      return { success: false, error: `invalid JSON format - ${parseError.message}` };
    }
    
    if (!Array.isArray(imported)) {
      showMessage('Import failed: File must contain an array of transactions', 'error');
      return { success: false, error: 'File must contain an array of transactions' };
    }
    
    const validationErrors = [];
    const validTransactions = [];
    
    imported.forEach((tx, i) => {
      const txNumber = i + 1;
      const missingFields = [];
      const formatErrors = [];
      
      if (tx.amount === undefined || tx.amount === null) {
        missingFields.push('amount');
      }
      if (!tx.category) {
        missingFields.push('category');
      }
      if (!tx.date) {
        missingFields.push('date');
      }
      
      if (missingFields.length > 0) {
        validationErrors.push(`Transaction ${txNumber}: missing required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      const amount = parseFloat(tx.amount);
      if (isNaN(amount)) {
        formatErrors.push(`amount is non-numeric (${tx.amount})`);
      } else if (amount <= 0) {
        formatErrors.push(`amount must be positive (${amount})`);
      } else {
        const amountStr = amount.toString();
        const decimalIndex = amountStr.indexOf('.');
        if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
          formatErrors.push(`amount has more than 2 decimal places (${amount})`);
        }
      }
      
      if (!CATEGORIES.includes(tx.category)) {
        formatErrors.push(`unrecognized category (${tx.category})`);
      }
      
      if (!isValidDate(tx.date)) {
        formatErrors.push(`malformed date (${tx.date})`);
      }
      
      if (tx.notes && tx.notes.length > 500) {
        formatErrors.push(`notes exceed 500 characters (${tx.notes.length} characters)`);
      }
      
      if (formatErrors.length > 0) {
        validationErrors.push(`Transaction ${txNumber}: invalid format - ${formatErrors.join(', ')}`);
        return;
      }
      
      validTransactions.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        amount: amount,
        category: tx.category,
        date: tx.date,
        notes: tx.notes || '',
        createdAt: Date.now()
      });
    });
    
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join('; ');
      showMessage(`Import failed: ${errorMessage}`, 'error');
      return { success: false, error: errorMessage, validationErrors };
    }
    
    const originalLength = transactions.length;
    transactions.push(...validTransactions);
    
    return { success: true, imported: validTransactions.length };
  } catch (error) {
    showMessage(`Import failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

console.log('\n=== SAMPLE FILE TESTS ===\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, testFn) {
  try {
    transactions = [];
    localStorage.clear();
    messageLog = [];
    
    testFn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Valid sample-data.json imports successfully
runTest('sample-data.json imports successfully', () => {
  const json = fs.readFileSync(path.join(__dirname, 'sample-data.json'), 'utf8');
  const result = importDataSync(json);
  
  assert(result.success, 'Import should succeed');
  assert(result.imported === 5, 'Should import 5 transactions');
  assert(transactions.length === 5, 'Should have 5 transactions in memory');
  
  // Verify some specific values
  assert(transactions.some(tx => tx.category === 'Food' && tx.amount === 45.99), 'Should have Food transaction');
  assert(transactions.some(tx => tx.category === 'Housing' && tx.amount === 120.00), 'Should have Housing transaction');
  assert(transactions.some(tx => tx.category === 'Entertainment'), 'Should have Entertainment transaction');
});

// Test 2: Invalid data file is properly rejected
runTest('invalid-data.json is rejected with descriptive errors', () => {
  const json = fs.readFileSync(path.join(__dirname, 'invalid-data.json'), 'utf8');
  const result = importDataSync(json);
  
  assert(!result.success, 'Import should fail');
  assert(result.validationErrors, 'Should have validation errors');
  assert(result.validationErrors.length === 3, 'Should have 3 validation errors');
  
  // Verify specific errors are caught
  const errors = result.validationErrors.join(' ');
  assert(errors.includes('missing required fields: amount'), 'Should catch missing amount');
  assert(errors.includes('non-numeric'), 'Should catch non-numeric amount');
  assert(errors.includes('unrecognized category'), 'Should catch invalid category');
  
  assert(transactions.length === 0, 'No transactions should be imported');
});

// Test 3: Invalid JSON file is rejected
runTest('invalid-json.json is rejected (not an array)', () => {
  const json = fs.readFileSync(path.join(__dirname, 'invalid-json.json'), 'utf8');
  const result = importDataSync(json);
  
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('array'), 'Error should mention array requirement');
  assert(transactions.length === 0, 'No transactions should be imported');
});

// Test 4: Round-trip with sample-data.json
runTest('Exporting and re-importing sample-data.json preserves data', () => {
  // First import
  const json1 = fs.readFileSync(path.join(__dirname, 'sample-data.json'), 'utf8');
  const result1 = importDataSync(json1);
  
  assert(result1.success, 'First import should succeed');
  
  // Export
  const exportData = transactions.map(tx => ({
    amount: tx.amount,
    category: tx.category,
    date: tx.date,
    notes: tx.notes
  }));
  const json2 = JSON.stringify(exportData, null, 2);
  
  // Clear and re-import
  const originalTransactions = [...transactions];
  transactions = [];
  const result2 = importDataSync(json2);
  
  assert(result2.success, 'Second import should succeed');
  assert(transactions.length === originalTransactions.length, 'Transaction count should match');
  
  // Verify all data matches
  for (let i = 0; i < originalTransactions.length; i++) {
    assert(transactions[i].amount === originalTransactions[i].amount, 'Amount should match');
    assert(transactions[i].category === originalTransactions[i].category, 'Category should match');
    assert(transactions[i].date === originalTransactions[i].date, 'Date should match');
    assert(transactions[i].notes === originalTransactions[i].notes, 'Notes should match');
  }
});

console.log(`\n=== RESULTS ===`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`Total tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All sample file tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
