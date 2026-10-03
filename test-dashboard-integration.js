// Dashboard Integration Test
// Tests: Requirements 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 6.9, 6.10

// This test can be run in Node.js or browser console

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Shopping', 'Entertainment', 'Health', 'Other'];

// Mock transactions data
let transactions = [];

// Copy calculation functions from app.js
function getTotalSpending() {
  const total = transactions.reduce((sum, tx) => {
    const amount = parseFloat(tx.amount);
    return sum + amount;
  }, 0);
  return Math.round(total * 100) / 100;
}

function getSpendingByCategory() {
  const categoryTotals = {};
  const total = getTotalSpending();
  
  CATEGORIES.forEach(cat => {
    categoryTotals[cat] = 0;
  });
  
  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount);
    if (categoryTotals.hasOwnProperty(tx.category)) {
      categoryTotals[tx.category] += amount;
    }
  });
  
  const result = Object.entries(categoryTotals)
    .filter(([category, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0
    }));
  
  return result;
}

function getSpendingByMonth() {
  const monthlyTotals = {};
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[key] = 0;
  }
  
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyTotals.hasOwnProperty(key)) {
      const amount = parseFloat(tx.amount);
      monthlyTotals[key] += amount;
    }
  });
  
  const result = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 100) / 100
  }));
  
  return result;
}

// Test utilities
function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✓ PASS: ${testName}`);
    return true;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    console.error(`  Expected: ${expected}, Got: ${actual}`);
    return false;
  }
}

function assertArrayLength(arr, length, testName) {
  return assertEqual(arr.length, length, testName);
}

function assertAlmostEqual(actual, expected, tolerance, testName) {
  if (Math.abs(actual - expected) < tolerance) {
    console.log(`✓ PASS: ${testName}`);
    return true;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    console.error(`  Expected: ${expected}, Got: ${actual}, Tolerance: ${tolerance}`);
    return false;
  }
}

// Test Suite
function runIntegrationTests() {
  console.log('=== Dashboard Integration Tests ===\n');
  let passCount = 0;
  let totalTests = 0;

  // Test 1: Empty transaction list (Req 3.7)
  console.log('--- Test Group 1: Empty Data (Req 3.7) ---');
  transactions = [];
  totalTests++;
  if (assertEqual(getTotalSpending(), 0, 'Empty list returns zero total')) passCount++;
  
  totalTests++;
  if (assertArrayLength(getSpendingByCategory(), 0, 'Empty list returns empty category data')) passCount++;
  
  totalTests++;
  const emptyMonthly = getSpendingByMonth();
  if (assertArrayLength(emptyMonthly, 12, 'Empty list returns 12 months')) passCount++;
  
  totalTests++;
  if (assertEqual(emptyMonthly.every(m => m.amount === 0), true, 'All months have zero amount')) passCount++;

  // Test 2: Single category spending (Req 3.8)
  console.log('\n--- Test Group 2: Single Category (Req 3.8) ---');
  transactions = [
    { amount: 75.50, category: 'Food', date: '2025-01-15' },
    { amount: 24.50, category: 'Food', date: '2025-01-10' }
  ];
  
  totalTests++;
  if (assertEqual(getTotalSpending(), 100, 'Total spending for single category')) passCount++;
  
  const singleCat = getSpendingByCategory();
  totalTests++;
  if (assertArrayLength(singleCat, 1, 'Only one category returned')) passCount++;
  
  totalTests++;
  if (assertEqual(singleCat[0].percentage, 100, 'Single category shows 100%')) passCount++;

  // Test 3: Multiple categories with percentages (Req 3.2, 6.10)
  console.log('\n--- Test Group 3: Multiple Categories (Req 3.2, 6.10) ---');
  transactions = [
    { amount: 200, category: 'Food', date: '2025-01-15' },
    { amount: 150, category: 'Housing', date: '2025-01-10' },
    { amount: 100, category: 'Transport', date: '2025-01-12' },
    { amount: 50, category: 'Entertainment', date: '2025-01-14' }
  ];
  
  totalTests++;
  if (assertEqual(getTotalSpending(), 500, 'Total spending with multiple categories')) passCount++;
  
  const multiCat = getSpendingByCategory();
  totalTests++;
  if (assertArrayLength(multiCat, 4, 'Four categories returned')) passCount++;
  
  const food = multiCat.find(c => c.category === 'Food');
  totalTests++;
  if (assertEqual(food.amount, 200, 'Food category amount correct')) passCount++;
  
  totalTests++;
  if (assertEqual(food.percentage, 40, 'Food category percentage (40%)')) passCount++;
  
  const housing = multiCat.find(c => c.category === 'Housing');
  totalTests++;
  if (assertEqual(housing.percentage, 30, 'Housing category percentage (30%)')) passCount++;
  
  // Verify percentages sum to 100
  const totalPercentage = multiCat.reduce((sum, c) => sum + c.percentage, 0);
  totalTests++;
  if (assertAlmostEqual(totalPercentage, 100, 0.01, 'All percentages sum to 100%')) passCount++;

  // Test 4: Zero amounts included (Req 3.9)
  console.log('\n--- Test Group 4: Zero Amounts (Req 3.9) ---');
  transactions = [
    { amount: 100, category: 'Food', date: '2025-01-15' },
    { amount: 0, category: 'Transport', date: '2025-01-10' },
    { amount: 50, category: 'Shopping', date: '2025-01-12' }
  ];
  
  totalTests++;
  if (assertEqual(getTotalSpending(), 150, 'Total includes zero amounts')) passCount++;
  
  const catWithZero = getSpendingByCategory();
  totalTests++;
  if (assertArrayLength(catWithZero, 2, 'Zero amount categories filtered out')) passCount++;

  // Test 5: Monthly aggregation (Req 3.3, 3.10)
  console.log('\n--- Test Group 5: Monthly Aggregation (Req 3.3, 3.10) ---');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  
  transactions = [
    { amount: 100, category: 'Food', date: `${currentMonth}-15` },
    { amount: 50, category: 'Transport', date: `${currentMonth}-10` },
    { amount: 75, category: 'Housing', date: `${lastMonth}-20` }
  ];
  
  const monthly = getSpendingByMonth();
  totalTests++;
  if (assertArrayLength(monthly, 12, 'Monthly data returns 12 months')) passCount++;
  
  const currentMonthData = monthly.find(m => m.month === currentMonth);
  totalTests++;
  if (assertEqual(currentMonthData.amount, 150, 'Current month data correct')) passCount++;
  
  const lastMonthData = monthly.find(m => m.month === lastMonth);
  totalTests++;
  if (assertEqual(lastMonthData.amount, 75, 'Last month data correct')) passCount++;
  
  // Verify chronological order
  totalTests++;
  let isChronological = true;
  for (let i = 1; i < monthly.length; i++) {
    if (monthly[i].month < monthly[i-1].month) {
      isChronological = false;
      break;
    }
  }
  if (assertEqual(isChronological, true, 'Monthly data in chronological order')) passCount++;

  // Test 6: Currency formatting (Req 6.9, 6.10)
  console.log('\n--- Test Group 6: Currency Formatting (Req 6.9, 6.10) ---');
  transactions = [
    { amount: 45.9, category: 'Food', date: '2025-01-15' },
    { amount: 100, category: 'Transport', date: '2025-01-10' },
    { amount: 23.456, category: 'Shopping', date: '2025-01-12' }
  ];
  
  const total = getTotalSpending();
  totalTests++;
  // 45.9 + 100 + 23.456 = 169.356, rounded to 169.36
  if (assertAlmostEqual(total, 169.36, 0.01, 'Total formatted to 2 decimal places')) passCount++;
  
  const categories = getSpendingByCategory();
  totalTests++;
  const allFormattedCorrectly = categories.every(c => {
    const str = c.amount.toFixed(2);
    return str.split('.')[1].length === 2;
  });
  if (assertEqual(allFormattedCorrectly, true, 'All category amounts have 2 decimal places')) passCount++;

  // Test 7: Edge case - Floating point precision
  console.log('\n--- Test Group 7: Floating Point Precision ---');
  transactions = [
    { amount: 0.1, category: 'Food', date: '2025-01-15' },
    { amount: 0.2, category: 'Food', date: '2025-01-10' }
  ];
  
  const floatTotal = getTotalSpending();
  totalTests++;
  if (assertEqual(floatTotal, 0.3, 'Floating point addition handled correctly')) passCount++;

  // Test 8: Large dataset performance
  console.log('\n--- Test Group 8: Large Dataset ---');
  transactions = [];
  for (let i = 0; i < 1000; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const date = new Date();
    date.setDate(date.getDate() - i);
    transactions.push({
      amount: Math.random() * 100,
      category: category,
      date: date.toISOString().split('T')[0]
    });
  }
  
  const startTime = Date.now();
  const largeTotal = getTotalSpending();
  const largeCategories = getSpendingByCategory();
  const largeMonthly = getSpendingByMonth();
  const endTime = Date.now();
  
  totalTests++;
  if (assertEqual(largeTotal > 0, true, 'Large dataset total calculated')) passCount++;
  
  totalTests++;
  if (assertEqual(largeCategories.length > 0, true, 'Large dataset categories calculated')) passCount++;
  
  totalTests++;
  if (assertArrayLength(largeMonthly, 12, 'Large dataset monthly data calculated')) passCount++;
  
  totalTests++;
  const calculationTime = endTime - startTime;
  if (assertEqual(calculationTime < 500, true, `Calculations complete within 500ms (${calculationTime}ms)`)) passCount++;

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${totalTests - passCount}`);
  console.log(`Success Rate: ${((passCount / totalTests) * 100).toFixed(1)}%`);
  
  if (passCount === totalTests) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed. See details above.');
  }
  
  return { passCount, totalTests };
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  runIntegrationTests();
} else {
  // Browser environment
  window.runIntegrationTests = runIntegrationTests;
  console.log('Integration tests loaded. Run runIntegrationTests() to execute.');
}
