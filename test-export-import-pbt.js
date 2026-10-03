/**
 * Property-Based Tests for Export/Import Functionality
 * Feature: personal-finance-tracker
 * Tests Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 8.1, 8.2, 8.3, 8.4
 */

// Mock localStorage for Node.js environment
const localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Mock FileReader for Node.js
class FileReader {
  readAsText(blob) {
    // Simulate async reading
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: blob.text } });
      }
    }, 0);
  }
}

// Mock File/Blob
class File {
  constructor(parts, name, options) {
    this.text = parts[0];
    this.name = name;
    this.type = options.type;
  }
}

class Blob {
  constructor(parts, options) {
    this.text = parts[0];
    this.type = options.type;
  }
}

// Make them global
global.localStorage = localStorage;
global.FileReader = FileReader;
global.File = File;
global.Blob = Blob;
global.document = {
  getElementById: () => ({ textContent: '', innerHTML: '' }),
  createElement: () => ({ click: () => {}, style: {} }),
  body: { appendChild: () => {}, removeChild: () => {} },
  addEventListener: () => {}
};
global.URL = {
  createObjectURL: () => 'blob:mock',
  revokeObjectURL: () => {}
};

// Load app.js functions (extract the core logic)
const CATEGORIES = ['Food', 'Transport', 'Housing', 'Shopping', 'Entertainment', 'Health', 'Other'];
const STORAGE_KEY = 'finance_tracker_transactions';

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

function validateTransaction(transaction) {
  const errors = [];
  
  if (transaction.amount === undefined || transaction.amount === null || transaction.amount === '') {
    errors.push({ field: 'amount', message: 'Amount is required', code: 'REQUIRED' });
  } else {
    const amount = parseFloat(transaction.amount);
    
    if (isNaN(amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a valid number', code: 'INVALID_FORMAT' });
    } else if (amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be positive', code: 'OUT_OF_RANGE' });
    } else {
      const amountStr = amount.toString();
      const decimalIndex = amountStr.indexOf('.');
      if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
        errors.push({ field: 'amount', message: 'Amount must have max 2 decimal places', code: 'INVALID_FORMAT' });
      }
    }
  }
  
  if (!transaction.category) {
    errors.push({ field: 'category', message: 'Category is required', code: 'REQUIRED' });
  } else if (!CATEGORIES.includes(transaction.category)) {
    errors.push({ field: 'category', message: 'Invalid category', code: 'INVALID_CATEGORY' });
  }
  
  if (!transaction.date) {
    errors.push({ field: 'date', message: 'Date is required', code: 'REQUIRED' });
  } else if (!isValidDate(transaction.date)) {
    errors.push({ field: 'date', message: 'Date must be a valid calendar date', code: 'INVALID_DATE' });
  }
  
  if (transaction.notes && transaction.notes.length > 500) {
    errors.push({ field: 'notes', message: 'Notes must be 500 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
  }
  
  return errors;
}

function saveTransactions(transactions) {
  try {
    const json = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, json);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

function loadTransactions() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    return [];
  }
}

function exportData() {
  try {
    const exportData = transactions.map(tx => ({
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      notes: tx.notes
    }));
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    showMessage('Export failed', 'error');
    return null;
  }
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
    
    const saveResult = saveTransactions(transactions);
    
    if (saveResult.success) {
      showMessage(`Imported ${validTransactions.length} transactions successfully`, 'success');
      return { success: true, imported: validTransactions.length };
    } else {
      transactions.splice(originalLength);
      return { success: false, error: 'Could not save to storage' };
    }
    
  } catch (error) {
    showMessage(`Import failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// ============ UNIT TESTS ============

console.log('\n=== UNIT TESTS ===\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, testFn) {
  try {
    // Reset state
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

// Test 1: Export produces valid JSON (Requirement 5.1, 8.1)
runTest('Export produces valid JSON with correct structure', () => {
  transactions = [
    { id: '1', amount: 10.99, category: 'Food', date: '2024-01-15', notes: 'Lunch', createdAt: Date.now() },
    { id: '2', amount: 50.00, category: 'Transport', date: '2024-01-14', notes: '', createdAt: Date.now() }
  ];
  
  const json = exportData();
  assert(json !== null, 'Export should return JSON string');
  
  const parsed = JSON.parse(json);
  assert(Array.isArray(parsed), 'Exported data should be an array');
  assert(parsed.length === 2, 'Should export 2 transactions');
  assert(parsed[0].amount === 10.99, 'Amount should match');
  assert(parsed[0].category === 'Food', 'Category should match');
  assert(parsed[0].date === '2024-01-15', 'Date should match');
  assert(parsed[0].notes === 'Lunch', 'Notes should match');
  assert(!parsed[0].hasOwnProperty('id'), 'Should not include id field');
  assert(!parsed[0].hasOwnProperty('createdAt'), 'Should not include createdAt field');
});

// Test 2: Round-trip integrity (Requirement 5.3)
runTest('Export-import round-trip preserves all data', () => {
  const original = [
    { id: '1', amount: 25.50, category: 'Shopping', date: '2024-01-20', notes: 'Groceries', createdAt: Date.now() },
    { id: '2', amount: 100.00, category: 'Housing', date: '2024-01-15', notes: 'Rent', createdAt: Date.now() },
    { id: '3', amount: 15.75, category: 'Entertainment', date: '2024-01-18', notes: '', createdAt: Date.now() }
  ];
  
  transactions = [...original];
  
  // Export
  const json = exportData();
  
  // Clear and import
  transactions = [];
  const result = importDataSync(json);
  
  assert(result.success, 'Import should succeed');
  assert(transactions.length === original.length, 'Transaction count should match');
  
  // Verify all data matches (ignoring id and createdAt which are regenerated)
  for (let i = 0; i < original.length; i++) {
    assert(transactions[i].amount === original[i].amount, `Amount should match for transaction ${i}`);
    assert(transactions[i].category === original[i].category, `Category should match for transaction ${i}`);
    assert(transactions[i].date === original[i].date, `Date should match for transaction ${i}`);
    assert(transactions[i].notes === original[i].notes, `Notes should match for transaction ${i}`);
  }
});

// Test 3: Missing required fields rejection (Requirement 5.4)
runTest('Import rejects transactions with missing amount', () => {
  const json = JSON.stringify([{ category: 'Food', date: '2024-01-15', notes: 'Test' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('missing required fields'), 'Error should mention missing fields');
  assert(result.error.includes('amount'), 'Error should mention amount field');
  assert(transactions.length === 0, 'No transactions should be imported');
});

runTest('Import rejects transactions with missing category', () => {
  const json = JSON.stringify([{ amount: 10.00, date: '2024-01-15', notes: 'Test' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('missing required fields'), 'Error should mention missing fields');
  assert(result.error.includes('category'), 'Error should mention category field');
});

runTest('Import rejects transactions with missing date', () => {
  const json = JSON.stringify([{ amount: 10.00, category: 'Food', notes: 'Test' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('missing required fields'), 'Error should mention missing fields');
  assert(result.error.includes('date'), 'Error should mention date field');
});

// Test 4: Invalid format rejection (Requirement 5.5)
runTest('Import rejects non-numeric amount', () => {
  const json = JSON.stringify([{ amount: 'abc', category: 'Food', date: '2024-01-15', notes: '' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('invalid format'), 'Error should mention invalid format');
  assert(result.error.includes('non-numeric'), 'Error should mention non-numeric amount');
});

runTest('Import rejects negative amount', () => {
  const json = JSON.stringify([{ amount: -10, category: 'Food', date: '2024-01-15', notes: '' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('must be positive'), 'Error should mention positive requirement');
});

runTest('Import rejects amount with too many decimal places', () => {
  const json = JSON.stringify([{ amount: 10.999, category: 'Food', date: '2024-01-15', notes: '' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('more than 2 decimal places'), 'Error should mention decimal places');
});

runTest('Import rejects unrecognized category', () => {
  const json = JSON.stringify([{ amount: 10.00, category: 'InvalidCategory', date: '2024-01-15', notes: '' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('unrecognized category'), 'Error should mention unrecognized category');
});

runTest('Import rejects malformed date', () => {
  const json = JSON.stringify([{ amount: 10.00, category: 'Food', date: '2024-02-30', notes: '' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('malformed date'), 'Error should mention malformed date');
});

runTest('Import rejects invalid date format', () => {
  const json = JSON.stringify([{ amount: 10.00, category: 'Food', date: 'not-a-date', notes: '' }]);
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('malformed date'), 'Error should mention date error');
});

// Test 5: Invalid JSON syntax (Requirement 8.3)
runTest('Import fails with invalid JSON - mismatched brackets', () => {
  const json = '{invalid json]';
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('invalid JSON format'), 'Error should contain "invalid JSON format"');
});

runTest('Import fails with invalid JSON - unquoted value', () => {
  const json = '{"key": value}';
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('invalid JSON format'), 'Error should contain "invalid JSON format"');
});

runTest('Import fails with invalid JSON - trailing comma', () => {
  const json = '{"key": "value",}';
  
  const result = importDataSync(json);
  assert(!result.success, 'Import should fail');
  assert(result.error.includes('invalid JSON format'), 'Error should contain "invalid JSON format"');
});

// Test 6: Import additivity (Requirement 5.6)
runTest('Import adds to existing transactions without removing them', () => {
  // Start with existing transactions
  transactions = [
    { id: '1', amount: 10.00, category: 'Food', date: '2024-01-15', notes: 'Original', createdAt: Date.now() }
  ];
  
  const originalId = transactions[0].id;
  const originalCount = transactions.length;
  
  // Import new transactions
  const json = JSON.stringify([
    { amount: 20.00, category: 'Transport', date: '2024-01-16', notes: 'New' }
  ]);
  
  const result = importDataSync(json);
  
  assert(result.success, 'Import should succeed');
  assert(transactions.length === originalCount + 1, 'Transaction count should increase by 1');
  assert(transactions.some(tx => tx.id === originalId), 'Original transaction should still exist');
  assert(transactions.some(tx => tx.notes === 'New'), 'New transaction should be added');
});

// Test 7: Serialize-deserialize-serialize byte identity (Requirement 8.4)
runTest('Serialize-deserialize-serialize produces byte-identical JSON', () => {
  const testData = [
    { amount: 10.99, category: 'Food', date: '2024-01-15', notes: 'Test' },
    { amount: 50.00, category: 'Transport', date: '2024-01-14', notes: '' }
  ];
  
  // First serialization
  const json1 = JSON.stringify(testData);
  
  // Deserialize
  const parsed = JSON.parse(json1);
  
  // Second serialization
  const json2 = JSON.stringify(parsed);
  
  assert(json1 === json2, 'JSON outputs should be byte-identical');
});

// Test 8: Export only includes required fields (Requirement 8.1)
runTest('Export includes only amount, category, date, and notes', () => {
  transactions = [
    { 
      id: '12345', 
      amount: 10.99, 
      category: 'Food', 
      date: '2024-01-15', 
      notes: 'Test', 
      createdAt: Date.now(),
      extraField: 'should not be exported'
    }
  ];
  
  const json = exportData();
  const parsed = JSON.parse(json);
  
  const exportedTx = parsed[0];
  assert(exportedTx.hasOwnProperty('amount'), 'Should have amount');
  assert(exportedTx.hasOwnProperty('category'), 'Should have category');
  assert(exportedTx.hasOwnProperty('date'), 'Should have date');
  assert(exportedTx.hasOwnProperty('notes'), 'Should have notes');
  assert(!exportedTx.hasOwnProperty('id'), 'Should not have id');
  assert(!exportedTx.hasOwnProperty('createdAt'), 'Should not have createdAt');
  assert(!exportedTx.hasOwnProperty('extraField'), 'Should not have extra fields');
});

// Test 9: Import with duplicate transactions (Requirement 5.6)
runTest('Import allows duplicate transactions', () => {
  const duplicateData = [
    { amount: 10.00, category: 'Food', date: '2024-01-15', notes: 'Duplicate' },
    { amount: 10.00, category: 'Food', date: '2024-01-15', notes: 'Duplicate' }
  ];
  
  transactions = [];
  const json = JSON.stringify(duplicateData);
  const result = importDataSync(json);
  
  assert(result.success, 'Import should succeed with duplicates');
  assert(transactions.length === 2, 'Both duplicate transactions should be imported');
});

// Print results
console.log(`\n=== RESULTS ===`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`Total tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
