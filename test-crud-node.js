/**
 * Node.js Test Suite for Transaction CRUD and localStorage Operations
 * Tests Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8, 1.9, 4.1, 4.2, 4.4, 4.5, 4.6, 4.7
 */

// Simulate localStorage for Node.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Setup global environment
global.localStorage = new LocalStorageMock();
global.document = {
  getElementById: () => ({
    innerHTML: '',
    appendChild: () => {},
    textContent: ''
  }),
  createElement: () => ({
    className: '',
    textContent: ''
  }),
  addEventListener: () => {}
};

// Load app.js code inline (extract the key functions)
const CATEGORIES = ['Food', 'Transport', 'Housing', 'Shopping', 'Entertainment', 'Health', 'Other'];
const STORAGE_KEY = 'finance_tracker_transactions';
let transactions = [];

// Copy functions from app.js
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function loadTransactions() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    
    const parsed = JSON.parse(json);
    
    if (!Array.isArray(parsed)) {
      console.error('Stored data is not an array');
      return [];
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load transactions:', error);
    return [];
  }
}

function saveTransactions(transactions) {
  try {
    const json = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, json);
    return { success: true };
  } catch (error) {
    console.error('Failed to save transactions:', error);
    
    if (error.name === 'QuotaExceededError') {
      return { success: false, error: { type: 'QUOTA_EXCEEDED', message: 'Storage limit reached' } };
    } else {
      return { success: false, error: { type: 'WRITE_FAILED', message: 'Failed to save data' } };
    }
  }
}

function validateTransaction(transaction) {
  const errors = [];
  
  // Amount validation
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
  
  // Category validation
  if (!transaction.category) {
    errors.push({ field: 'category', message: 'Category is required', code: 'REQUIRED' });
  } else if (!CATEGORIES.includes(transaction.category)) {
    errors.push({ field: 'category', message: 'Invalid category. Must be one of: ' + CATEGORIES.join(', '), code: 'INVALID_CATEGORY' });
  }
  
  // Date validation
  if (!transaction.date) {
    errors.push({ field: 'date', message: 'Date is required', code: 'REQUIRED' });
  } else {
    const dateObj = new Date(transaction.date);
    if (isNaN(dateObj.getTime())) {
      errors.push({ field: 'date', message: 'Date must be a valid calendar date', code: 'INVALID_DATE' });
    }
  }
  
  // Notes validation
  if (transaction.notes && transaction.notes.length > 500) {
    errors.push({ field: 'notes', message: 'Notes must be 500 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
  }
  
  return errors;
}

function addTransaction(transaction) {
  const errors = validateTransaction(transaction);
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  const newTransaction = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    amount: parseFloat(transaction.amount),
    category: transaction.category,
    date: transaction.date,
    notes: transaction.notes || '',
    createdAt: Date.now()
  };
  
  transactions.push(newTransaction);
  const saveResult = saveTransactions(transactions);
  
  if (saveResult.success) {
    return { success: true, transaction: newTransaction };
  }
  
  transactions.pop();
  return saveResult;
}

function updateTransaction(id, updates) {
  const index = transactions.findIndex(tx => tx.id === id);
  if (index === -1) {
    return { success: false, error: 'Transaction not found' };
  }
  
  const updated = { 
    ...transactions[index], 
    amount: parseFloat(updates.amount),
    category: updates.category,
    date: updates.date,
    notes: updates.notes || ''
  };
  
  const errors = validateTransaction(updated);
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  const original = transactions[index];
  transactions[index] = updated;
  
  const saveResult = saveTransactions(transactions);
  
  if (saveResult.success) {
    return { success: true, transaction: updated };
  }
  
  transactions[index] = original;
  return saveResult;
}

function deleteTransaction(id) {
  const index = transactions.findIndex(tx => tx.id === id);
  if (index === -1) {
    return { success: false, error: 'Transaction not found' };
  }
  
  const removed = transactions.splice(index, 1)[0];
  const saveResult = saveTransactions(transactions);
  
  if (saveResult.success) {
    return { success: true };
  }
  
  transactions.splice(index, 0, removed);
  return saveResult;
}

function getAllTransactions() {
  return [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Run tests
console.log('='.repeat(60));
console.log('Transaction CRUD & localStorage Operations Test Suite');
console.log('='.repeat(60));
console.log();

// Storage Tests
console.log('STORAGE FUNCTIONS:');
test('isStorageAvailable returns true', () => {
  assert(isStorageAvailable() === true, 'Storage should be available');
});

test('saveTransactions and loadTransactions round-trip', () => {
  const testData = [{
    id: 'test1',
    amount: 45.99,
    category: 'Food',
    date: '2024-01-15',
    notes: 'Test',
    createdAt: Date.now()
  }];
  
  const saveResult = saveTransactions(testData);
  assert(saveResult.success, 'Save should succeed');
  
  const loaded = loadTransactions();
  assertEquals(JSON.stringify(loaded), JSON.stringify(testData), 'Loaded data should match saved');
});

test('loadTransactions with no data returns empty array', () => {
  localStorage.removeItem(STORAGE_KEY);
  const result = loadTransactions();
  assertEquals(result.length, 0, 'Should return empty array');
});

test('loadTransactions with corrupted JSON returns empty array', () => {
  localStorage.setItem(STORAGE_KEY, '{invalid json]');
  const result = loadTransactions();
  assertEquals(result.length, 0, 'Should return empty array for corrupted data');
});

test('loadTransactions with non-array data returns empty array', () => {
  localStorage.setItem(STORAGE_KEY, '{"not": "array"}');
  const result = loadTransactions();
  assertEquals(result.length, 0, 'Should return empty array for non-array');
});

console.log();

// Validation Tests
console.log('VALIDATION FUNCTIONS:');
test('validateTransaction accepts valid transaction', () => {
  const valid = {
    amount: 45.99,
    category: 'Food',
    date: '2024-01-15',
    notes: 'Test'
  };
  const errors = validateTransaction(valid);
  assertEquals(errors.length, 0, 'Valid transaction should have no errors');
});

test('validateTransaction rejects negative amount', () => {
  const invalid = {
    amount: -10,
    category: 'Food',
    date: '2024-01-15',
    notes: ''
  };
  const errors = validateTransaction(invalid);
  assert(errors.some(e => e.field === 'amount'), 'Should have amount error');
});

test('validateTransaction rejects amount with >2 decimals', () => {
  const invalid = {
    amount: 10.999,
    category: 'Food',
    date: '2024-01-15',
    notes: ''
  };
  const errors = validateTransaction(invalid);
  assert(errors.some(e => e.field === 'amount'), 'Should reject >2 decimal places');
});

test('validateTransaction rejects invalid category', () => {
  const invalid = {
    amount: 10,
    category: 'InvalidCategory',
    date: '2024-01-15',
    notes: ''
  };
  const errors = validateTransaction(invalid);
  assert(errors.some(e => e.field === 'category'), 'Should have category error');
});

test('validateTransaction accepts all valid categories', () => {
  CATEGORIES.forEach(cat => {
    const tx = { amount: 10, category: cat, date: '2024-01-15', notes: '' };
    const errors = validateTransaction(tx);
    assert(!errors.some(e => e.field === 'category'), `Should accept ${cat}`);
  });
});

test('validateTransaction rejects invalid date', () => {
  const invalid = {
    amount: 10,
    category: 'Food',
    date: 'invalid-date',
    notes: ''
  };
  const errors = validateTransaction(invalid);
  assert(errors.some(e => e.field === 'date'), 'Should have date error');
});

test('validateTransaction rejects notes >500 chars', () => {
  const invalid = {
    amount: 10,
    category: 'Food',
    date: '2024-01-15',
    notes: 'a'.repeat(501)
  };
  const errors = validateTransaction(invalid);
  assert(errors.some(e => e.field === 'notes'), 'Should have notes error');
});

test('validateTransaction accepts notes with exactly 500 chars', () => {
  const valid = {
    amount: 10,
    category: 'Food',
    date: '2024-01-15',
    notes: 'a'.repeat(500)
  };
  const errors = validateTransaction(valid);
  assert(!errors.some(e => e.field === 'notes'), 'Should accept 500 chars');
});

console.log();

// CRUD Tests
console.log('CRUD OPERATIONS:');
test('addTransaction adds valid transaction', () => {
  transactions = [];
  localStorage.removeItem(STORAGE_KEY);
  
  const tx = { amount: 45.99, category: 'Food', date: '2024-01-15', notes: 'Test' };
  const result = addTransaction(tx);
  
  assert(result.success, 'Add should succeed');
  assert(result.transaction.id, 'Should generate ID');
  assertEquals(transactions.length, 1, 'Should have 1 transaction');
});

test('addTransaction persists to localStorage', () => {
  const loaded = loadTransactions();
  assertEquals(loaded.length, 1, 'Transaction should be in localStorage');
});

test('addTransaction rejects invalid transaction', () => {
  const originalLength = transactions.length;
  const invalid = { amount: -10, category: 'Food', date: '2024-01-15', notes: '' };
  const result = addTransaction(invalid);
  
  assert(!result.success, 'Should fail');
  assert(result.errors.length > 0, 'Should return errors');
  assertEquals(transactions.length, originalLength, 'Should not add to array');
});

test('updateTransaction updates existing transaction', () => {
  const txId = transactions[0].id;
  const updates = { amount: 50, category: 'Transport', date: '2024-01-16', notes: 'Updated' };
  const result = updateTransaction(txId, updates);
  
  assert(result.success, 'Update should succeed');
  assertEquals(transactions[0].amount, 50, 'Amount should be updated');
  assertEquals(transactions[0].category, 'Transport', 'Category should be updated');
});

test('updateTransaction fails for non-existent ID', () => {
  const result = updateTransaction('nonexistent', { amount: 10, category: 'Food', date: '2024-01-15', notes: '' });
  assert(!result.success, 'Should fail for non-existent ID');
});

test('deleteTransaction removes transaction', () => {
  const txId = transactions[0].id;
  const result = deleteTransaction(txId);
  
  assert(result.success, 'Delete should succeed');
  assertEquals(transactions.length, 0, 'Should be empty');
  
  const loaded = loadTransactions();
  assertEquals(loaded.length, 0, 'Delete should persist');
});

test('deleteTransaction fails for non-existent ID', () => {
  const result = deleteTransaction('nonexistent');
  assert(!result.success, 'Should fail for non-existent ID');
});

test('getAllTransactions sorts by date descending', () => {
  transactions = [
    { id: '1', amount: 10, category: 'Food', date: '2024-01-15', notes: '', createdAt: Date.now() },
    { id: '2', amount: 20, category: 'Food', date: '2024-01-20', notes: '', createdAt: Date.now() },
    { id: '3', amount: 30, category: 'Food', date: '2024-01-10', notes: '', createdAt: Date.now() }
  ];
  
  const sorted = getAllTransactions();
  assertEquals(sorted[0].id, '2', 'Most recent should be first');
  assertEquals(sorted[2].id, '3', 'Oldest should be last');
});

console.log();

// Summary
console.log('='.repeat(60));
console.log(`Tests Passed: ${passed}`);
console.log(`Tests Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('✓ All tests passed!');
  process.exit(0);
} else {
  console.log('✗ Some tests failed');
  process.exit(1);
}
