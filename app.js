// Personal Finance Tracker - Main Application
// A simple local-first expense tracking web application

// ============ CONSTANTS ============

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Shopping', 'Entertainment', 'Health', 'Other'];
const STORAGE_KEY = 'finance_tracker_transactions';

// ============ STATE ============

let transactions = [];
let currentView = 'list';
let editingId = null;

// ============ STORAGE FUNCTIONS ============

/**
 * Check if localStorage is available
 * Validates: Requirement 4.5
 */
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

/**
 * Load transactions from localStorage
 * Validates: Requirements 4.4, 4.7
 * @returns {Array} Array of transaction objects
 */
function loadTransactions() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    
    const parsed = JSON.parse(json);
    
    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      console.error('Stored data is not an array');
      showMessage('Stored data is corrupted. Starting with empty transaction list.', 'error');
      return [];
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load transactions:', error);
    showMessage('Stored data is corrupted. Starting with empty transaction list.', 'error');
    return [];
  }
}

/**
 * Save transactions to localStorage
 * Validates: Requirements 4.1, 4.4, 4.6, 1.9
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Result object with success flag and optional error
 */
function saveTransactions(transactions) {
  try {
    const json = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, json);
    return { success: true };
  } catch (error) {
    console.error('Failed to save transactions:', error);
    
    if (error.name === 'QuotaExceededError') {
      showMessage('Storage limit reached. Export your data and delete old transactions to free space.', 'error');
      return { success: false, error: { type: 'QUOTA_EXCEEDED', message: 'Storage limit reached' } };
    } else {
      showMessage('Failed to save data.', 'error');
      return { success: false, error: { type: 'WRITE_FAILED', message: 'Failed to save data' } };
    }
  }
}

// ============ VALIDATION FUNCTIONS ============

/**
 * Check if a date string represents a valid calendar date
 * Handles impossible dates like Feb 30, April 31, etc.
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid calendar date
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  // For YYYY-MM-DD format, verify the parsed date matches the input
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  } n  
  return true;
}

/**
 * Validate entire transaction object
 * Validates: Requirements 1.7, 1.8, 1.4
 * @param {Object} transaction - Transaction object to validate
 * @returns {Array} Array of error objects (empty if valid)
 */
function validateTransaction(transaction) {
  const errors = [];
  
  // Amount validation (Requirement 1.7)
  if (transaction.amount === undefined || transaction.amount === null || transaction.amount === '') {
    errors.push({ field: 'amount', message: 'Amount is required', code: 'REQUIRED' });
  } else {
    const amount = parseFloat(transaction.amount);
    
    if (isNaN(amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a valid number', code: 'INVALID_FORMAT' });
    } else if (amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be positive', code: 'OUT_OF_RANGE' });
    } else {
      // Check for max 2 decimal places
      const amountStr = amount.toString();
      const decimalIndex = amountStr.indexOf('.');
      if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
        errors.push({ field: 'amount', message: 'Amount must have max 2 decimal places', code: 'INVALID_FORMAT' });
      }
    }
  }
  
  // Category validation (Requirement 1.4)
  if (!transaction.category) {
    errors.push({ field: 'category', message: 'Category is required', code: 'REQUIRED' });
  } else if (!CATEGORIES.includes(transaction.category)) {
    errors.push({ field: 'category', message: 'Invalid category. Must be one of: ' + CATEGORIES.join(', '), code: 'INVALID_CATEGORY' });
  }
  
  // Date validation (Requirement 1.8)
  if (!transaction.date) {
    errors.push({ field: 'date', message: 'Date is required', code: 'REQUIRED' });
  } else {
    const dateObj = new Date(transaction.date);
    if (isNaN(dateObj.getTime())) {
      errors.push({ field: 'date', message: 'Date must be a valid calendar date', code: 'INVALID_DATE' });
    }
  }
  
  // Notes validation (max 500 characters)
  if (transaction.notes && transaction.notes.length > 500) {
    errors.push({ field: 'notes', message: 'Notes must be 500 characters or less', code: 'MAX_LENGTH_EXCEEDED' });
  }
  
  return errors;
}

// ============ TRANSACTION CRUD FUNCTIONS ============

/**
 * Add new transaction
 * Validates: Requirements 1.1, 1.5, 1.6
 * @param {Object} transaction - Transaction data to add
 * @returns {Object} Result object with success flag, transaction, or errors
 */
function addTransaction(transaction) {
  const errors = validateTransaction(transaction);
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  // Create new transaction with generated ID and timestamp
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
    showMessage('Transaction added successfully', 'success');
    return { success: true, transaction: newTransaction };
  }
  
  // Rollback if save failed
  transactions.pop();
  return saveResult;
}

/**
 * Update existing transaction
 * Validates: Requirements 1.2, 1.5, 1.6
 * @param {string} id - Transaction ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object} Result object with success flag, transaction, or errors
 */
function updateTransaction(id, updates) {
  const index = transactions.findIndex(tx => tx.id === id);
  if (index === -1) {
    return { success: false, error: 'Transaction not found' };
  }
  
  // Preserve existing fields and apply updates
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
  
  // Store original for rollback
  const original = transactions[index];
  transactions[index] = updated;
  
  const saveResult = saveTransactions(transactions);
  
  if (saveResult.success) {
    showMessage('Transaction updated successfully', 'success');
    return { success: true, transaction: updated };
  }
  
  // Rollback if save failed
  transactions[index] = original;
  return saveResult;
}

/**
 * Delete transaction
 * Validates: Requirements 1.3, 1.5, 1.6
 * @param {string} id - Transaction ID to delete
 * @returns {Object} Result object with success flag or error
 */
function deleteTransaction(id) {
  const index = transactions.findIndex(tx => tx.id === id);
  if (index === -1) {
    return { success: false, error: 'Transaction not found' };
  }
  
  // Store removed transaction for potential rollback
  const removed = transactions.splice(index, 1)[0];
  const saveResult = saveTransactions(transactions);
  
  if (saveResult.success) {
    showMessage('Transaction deleted successfully', 'success');
    return { success: true };
  }
  
  // Rollback if save failed
  transactions.splice(index, 0, removed);
  return saveResult;
}

/**
 * Get all transactions sorted by date descending
 * Validates: Requirement 2.1
 * @returns {Array} Sorted array of transactions (most recent first)
 */
function getAllTransactions() {
  return [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ============ EXPORT/IMPORT FUNCTIONS ============

/**
 * Export all transactions as JSON file
 * Validates: Requirements 5.1, 8.1
 * Serializes transactions and triggers browser download
 */
function exportData() {
  try {
    // Serialize transactions to JSON (Requirement 8.1)
    // Each transaction has amount, category, date, and notes properties
    const exportData = transactions.map(tx => ({
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      notes: tx.notes
    }));
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    showMessage('Data exported successfully', 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showMessage('Export failed. Please try again.', 'error');
  }
}

/**
 * Import transactions from JSON file
 * Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 8.2, 8.3
 * @param {File} file - JSON file to import
 */
function importData(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const json = e.target.result;
      
      // Parse JSON (Requirement 8.2, 8.3)
      let imported;
      try {
        imported = JSON.parse(json);
      } catch (parseError) {
        // Requirement 8.3: Return error with "invalid JSON format" and parse error details
        showMessage(`Import failed: invalid JSON format - ${parseError.message}`, 'error');
        return;
      }
      
      // Validate structure - must be an array (Requirement 5.4)
      if (!Array.isArray(imported)) {
        showMessage('Import failed: File must contain an array of transactions', 'error');
        return;
      }
      
      // Validate each transaction (Requirements 5.4, 5.5)
      const validationErrors = [];
      const validTransactions = [];
      
      imported.forEach((tx, i) => {
        const txNumber = i + 1;
        const missingFields = [];
        const formatErrors = [];
        
        // Check required fields (Requirement 5.4)
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
          return; // Skip to next transaction
        }
        
        // Check field formats (Requirement 5.5)
        
        // Amount format validation
        const amount = parseFloat(tx.amount);
        if (isNaN(amount)) {
          formatErrors.push(`amount is non-numeric (${tx.amount})`);
        } else if (amount <= 0) {
          formatErrors.push(`amount must be positive (${amount})`);
        } else {
          // Check decimal places
          const amountStr = amount.toString();
          const decimalIndex = amountStr.indexOf('.');
          if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
            formatErrors.push(`amount has more than 2 decimal places (${amount})`);
          }
        }
        
        // Category format validation
        if (!CATEGORIES.includes(tx.category)) {
          formatErrors.push(`unrecognized category (${tx.category})`);
        }
        
        // Date format validation
        if (!isValidDate(tx.date)) {
          formatErrors.push(`malformed date (${tx.date})`);
        }
        
        // Notes length validation
        if (tx.notes && tx.notes.length > 500) {
          formatErrors.push(`notes exceed 500 characters (${tx.notes.length} characters)`);
        }
        
        if (formatErrors.length > 0) {
          validationErrors.push(`Transaction ${txNumber}: invalid format - ${formatErrors.join(', ')}`);
          return; // Skip to next transaction
        }
        
        // Transaction is valid, add it to valid list
        validTransactions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          amount: amount,
          category: tx.category,
          date: tx.date,
          notes: tx.notes || '',
          createdAt: Date.now()
        });
      });
      
      // If any validation errors, display them and abort (Requirements 5.4, 5.5)
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.length > 3 
          ? validationErrors.slice(0, 3).join('; ') + ` (and ${validationErrors.length - 3} more errors)`
          : validationErrors.join('; ');
        showMessage(`Import failed: ${errorMessage}`, 'error');
        return;
      }
      
      // Add imported transactions to existing data (Requirement 5.6)
      // This adds them as new entries, even if they duplicate existing ones
      transactions.push(...validTransactions);
      
      // Save to localStorage
      const saveResult = saveTransactions(transactions);
      
      if (saveResult.success) {
        showMessage(`Imported ${validTransactions.length} transactions successfully`, 'success');
        
        // Refresh UI if rendering functions are available
        if (typeof renderTransactionList === 'function') {
          renderTransactionList();
        }
        if (typeof renderDashboard === 'function' && currentView === 'dashboard') {
          renderDashboard();
        }
      } else {
        // Rollback on save failure
        transactions.splice(transactions.length - validTransactions.length, validTransactions.length);
        showMessage('Import failed: Could not save to storage', 'error');
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      showMessage(`Import failed: ${error.message}`, 'error');
    }
  };
  
  reader.onerror = () => {
    showMessage('Import failed: Could not read file', 'error');
  };
  
  reader.readAsText(file);
}

// ============ CALCULATION FUNCTIONS ============

/**
 * Calculate total spending from all transactions
 * Validates: Requirements 3.1, 3.9, 6.9
 * @returns {number} Total spending amount formatted to 2 decimal places
 */
function getTotalSpending() {
  const total = transactions.reduce((sum, tx) => {
    const amount = parseFloat(tx.amount);
    // Include zero and negative amounts per Requirement 3.9
    return sum + amount;
  }, 0);
  
  // Format to exactly 2 decimal places (Requirement 6.9)
  return Math.round(total * 100) / 100;
}

/**
 * Aggregate spending by category with amounts and percentages
 * Validates: Requirements 3.2, 6.10
 * @returns {Array} Array of objects with category, amount, and percentage
 */
function getSpendingByCategory() {
  const categoryTotals = {};
  const total = getTotalSpending();
  
  // Initialize all categories with 0
  CATEGORIES.forEach(cat => {
    categoryTotals[cat] = 0;
  });
  
  // Sum transactions by category
  transactions.forEach(tx => {
    const amount = parseFloat(tx.amount);
    if (categoryTotals.hasOwnProperty(tx.category)) {
      categoryTotals[tx.category] += amount;
    }
  });
  
  // Calculate percentages and format amounts
  const result = Object.entries(categoryTotals)
    .filter(([category, amount]) => amount > 0) // Only include categories with spending
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100, // Format to 2 decimal places
      percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0 // Round to 2 decimal places
    }));
  
  return result;
}

/**
 * Aggregate spending by month for the last 12 months
 * Validates: Requirements 3.3, 3.10, 6.10
 * @returns {Array} Array of objects with month and amount, ordered chronologically
 */
function getSpendingByMonth() {
  const monthlyTotals = {};
  const now = new Date();
  
  // Initialize last 12 months with 0
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[key] = 0;
  }
  
  // Sum transactions by month
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Only include if within last 12 months
    if (monthlyTotals.hasOwnProperty(key)) {
      const amount = parseFloat(tx.amount);
      monthlyTotals[key] += amount;
    }
  });
  
  // Convert to array format for charts, ordered chronologically
  const result = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 100) / 100 // Format to 2 decimal places
  }));
  
  return result;
}

// ============ CHART RENDERING FUNCTIONS ============

// Store chart instances globally for cleanup
let categoryChartInstance = null;
let timeChartInstance = null;

/**
 * Render category spending chart (pie chart)
 * Validates: Requirements 3.2, 3.5, 3.7, 3.8
 * @param {Array} data - Category spending data from getSpendingByCategory()
 */
function renderCategoryChart(data) {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart instance to prevent memory leaks
  if (categoryChartInstance) {
    categoryChartInstance.destroy();
    categoryChartInstance = null;
  }
  
  // Handle no data case (Requirement 3.7)
  if (data.length === 0) {
    // Clear canvas and display message
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Create pie chart with Chart.js
  categoryChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(d => `${d.category} ($${d.amount.toFixed(2)}, ${d.percentage.toFixed(1)}%)`),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: [
          '#FF6384', // Food - Pink
          '#36A2EB', // Transport - Blue
          '#FFCE56', // Housing - Yellow
          '#4BC0C0', // Shopping - Teal
          '#9966FF', // Entertainment - Purple
          '#FF9F40', // Health - Orange
          '#C9CBCF'  // Other - Gray
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        // Descriptive title (Requirement 3.5)
        title: {
          display: true,
          text: 'Spending by Category',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        // Legend identifying each category (Requirement 3.5)
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(i);
                  
                  return {
                    text: label,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = data[context.dataIndex].category;
              const amount = data[context.dataIndex].amount;
              const percentage = data[context.dataIndex].percentage;
              return `${label}: $${amount.toFixed(2)} (${percentage.toFixed(1)}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Render monthly spending trend chart (line chart)
 * Validates: Requirements 3.3, 3.6, 3.7, 3.10
 * @param {Array} data - Monthly spending data from getSpendingByMonth()
 */
function renderTimeChart(data) {
  const canvas = document.getElementById('time-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart instance to prevent memory leaks
  if (timeChartInstance) {
    timeChartInstance.destroy();
    timeChartInstance = null;
  }
  
  // Handle no data case (Requirement 3.7)
  if (data.length === 0 || data.every(d => d.amount === 0)) {
    // Clear canvas and display message
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Format month labels for display (e.g., "2025-01" -> "Jan 2025")
  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  // Create line chart with Chart.js
  timeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => formatMonthLabel(d.month)),
      datasets: [{
        label: 'Monthly Spending',
        data: data.map(d => d.amount),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4, // Smooth curve
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#36A2EB',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        // Descriptive title (Requirement 3.6)
        title: {
          display: true,
          text: 'Monthly Spending Trend (Last 12 Months)',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        // Legend (Requirement 3.6)
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Spending: $${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        // X-axis with month labels (Requirement 3.6)
        x: {
          display: true,
          title: {
            display: true,
            text: 'Month',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            display: false
          }
        },
        // Y-axis with amount labels (Requirement 3.6)
        y: {
          display: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount ($)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

/**
 * Render complete dashboard with all charts and totals
 * Validates: Requirements 3.1, 3.2, 3.3
 */
function renderDashboard() {
  // Calculate and display total spending (Requirement 3.1)
  const total = getTotalSpending();
  const totalElement = document.getElementById('total-spending');
  if (totalElement) {
    totalElement.textContent = `$${total.toFixed(2)}`;
  }
  
  // Get aggregated data
  const categoryData = getSpendingByCategory();
  const monthlyData = getSpendingByMonth();
  
  // Render charts (Requirements 3.2, 3.3)
  renderCategoryChart(categoryData);
  renderTimeChart(monthlyData);
}

// ============ UI HELPER FUNCTIONS ============

/**
 * Show temporary message to user
 * Validates: Requirements 1.5, 1.6
 * @param {string} text - Message text
 * @param {string} type - Message type ('success' or 'error')
 */
function showMessage(text, type) {
  const container = document.getElementById('message-container');
  const duration = type === 'error' ? 3000 : 2000; // 3s for errors, 2s for success
  
  const div = document.createElement('div');
  div.className = `p-4 rounded shadow-lg ${type === 'error' ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-green-100 text-green-700 border border-green-400'}`;
  div.textContent = text;
  
  container.innerHTML = '';
  container.appendChild(div);
  
  setTimeout(() => {
    container.innerHTML = '';
  }, duration);
}

/**
 * Display validation errors inline in the form
 * @param {Array} errors - Array of error objects
 */
function displayValidationErrors(errors) {
  // Clear all previous errors
  ['amount', 'category', 'date', 'notes'].forEach(field => {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }
  });
  
  // Display new errors
  errors.forEach(error => {
    const errorElement = document.getElementById(`${error.field}-error`);
    if (errorElement) {
      errorElement.textContent = error.message;
      errorElement.classList.remove('hidden');
    }
  });
  
  // Also show a summary message
  if (errors.length > 0) {
    showMessage('Please fix the validation errors before submitting', 'error');
  }
}

/**
 * Clear all validation error messages
 */
function clearValidationErrors() {
  ['amount', 'category', 'date', 'notes'].forEach(field => {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.add('hidden');
    }
  });
}

// ============ UI RENDERING FUNCTIONS ============

/**
 * Render transaction list table
 * Validates: Requirements 2.1, 2.2, 2.4
 * @returns {void}
 */
function renderTransactionList() {
  const container = document.getElementById('transaction-list');
  const sorted = getAllTransactions();
  
  // Display empty state when no transactions exist (Requirement 2.4)
  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center py-12 px-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
        <p class="text-sm text-gray-600 max-w-sm mx-auto">Add your first transaction using the form above to start tracking your expenses.</p>
      </div>
    `;
    return;
  }
  
  // Get category emoji mapping
  const categoryEmojis = {
    'Food': '🍔',
    'Transport': '🚗',
    'Housing': '🏠',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Health': '⚕️',
    'Other': '📌'
  };
  
  const categoryColors = {
    'Food': 'bg-orange-100 text-orange-800',
    'Transport': 'bg-blue-100 text-blue-800',
    'Housing': 'bg-purple-100 text-purple-800',
    'Shopping': 'bg-pink-100 text-pink-800',
    'Entertainment': 'bg-indigo-100 text-indigo-800',
    'Health': 'bg-green-100 text-green-800',
    'Other': 'bg-gray-100 text-gray-800'
  };
  
  // Render table with all transactions (Requirements 2.1, 2.2)
  const html = `
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr class="border-b border-gray-200">
          <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
          <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
          <th class="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
          <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
          <th class="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-100">
        ${sorted.map(tx => `
          <tr class="hover:bg-gray-50 transition-colors duration-100">
            <td class="py-4 px-6 text-sm text-gray-900">${tx.date}</td>
            <td class="py-4 px-6">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryColors[tx.category] || 'bg-gray-100 text-gray-800'}">
                <span class="mr-1">${categoryEmojis[tx.category] || '📌'}</span>
                ${tx.category}
              </span>
            </td>
            <td class="py-4 px-6 text-right">
              <span class="text-base font-semibold text-gray-900 currency">$${parseFloat(tx.amount).toFixed(2)}</span>
            </td>
            <td class="py-4 px-6 text-sm text-gray-600 max-w-xs truncate">${tx.notes || '—'}</td>
            <td class="py-4 px-6 text-right space-x-2">
              <button 
                onclick="handleEditTransaction('${tx.id}')" 
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                aria-label="Edit transaction"
              >
                <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button 
                onclick="handleDeleteTransaction('${tx.id}')" 
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                aria-label="Delete transaction"
              >
                <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// ============ EVENT HANDLER FUNCTIONS ============

/**
 * Handle edit button click
 * Validates: Requirement 2.5
 * Populates form with existing transaction data
 * @param {string} id - Transaction ID to edit
 * @returns {void}
 */
function handleEditTransaction(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) {
    showMessage('Transaction not found', 'error');
    return;
  }
  
  // Set editing state
  editingId = id;
  
  // Populate form fields with transaction data
  document.getElementById('amount').value = tx.amount;
  document.getElementById('category').value = tx.category;
  document.getElementById('date').value = tx.date;
  document.getElementById('notes').value = tx.notes;
  
  // Update form UI for editing mode
  document.getElementById('form-title').textContent = 'Edit Transaction';
  document.getElementById('submit-btn').textContent = 'Update Transaction';
  document.getElementById('cancel-edit-btn').classList.remove('hidden');
  
  // Clear any existing validation errors
  clearValidationErrors();
  
  // Scroll to form
  document.getElementById('transaction-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Handle delete button click
 * Validates: Requirement 2.6
 * Shows confirmation prompt before deleting
 * @param {string} id - Transaction ID to delete
 * @returns {void}
 */
function handleDeleteTransaction(id) {
  // Show custom modal instead of native confirm
  const modal = document.getElementById('delete-modal');
  modal.classList.remove('hidden');
  
  // Store the transaction ID for confirmation
  modal.dataset.transactionId = id;
}

/**
 * Confirm and execute deletion
 * @param {string} id - Transaction ID to delete
 * @returns {void}
 */
function confirmDelete() {
  const modal = document.getElementById('delete-modal');
  const id = modal.dataset.transactionId;
  
  // Hide modal
  modal.classList.add('hidden');
  
  // Delete the transaction
  const result = deleteTransaction(id);
  
  if (result.success) {
    // Re-render the transaction list after successful deletion
    renderTransactionList();
  }
  // Error message is already shown by deleteTransaction function
}

/**
 * Cancel deletion
 * @returns {void}
 */
function cancelDelete() {
  const modal = document.getElementById('delete-modal');
  modal.classList.add('hidden');
  delete modal.dataset.transactionId;
}

/**
 * Handle form submission (add or update transaction)
 * Validates: Requirements 1.1, 1.2, 1.5, 1.6
 * @param {Event} e - Form submit event
 * @returns {void}
 */
function handleFormSubmit(e) {
  e.preventDefault();
  
  // Clear previous validation errors
  clearValidationErrors();
  
  // Gather form data
  const transaction = {
    amount: document.getElementById('amount').value,
    category: document.getElementById('category').value,
    date: document.getElementById('date').value,
    notes: document.getElementById('notes').value
  };
  
  let result;
  
  // Update existing transaction or add new one
  if (editingId) {
    result = updateTransaction(editingId, transaction);
  } else {
    result = addTransaction(transaction);
  }
  
  if (result.success) {
    // Reset form and editing state
    e.target.reset();
    editingId = null;
    
    // Reset form UI to add mode
    document.getElementById('form-title').textContent = 'Add Transaction';
    document.getElementById('submit-btn').textContent = 'Add Transaction';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Re-render transaction list
    renderTransactionList();
    
    // Success message is already shown by addTransaction/updateTransaction
  } else {
    // Display validation errors inline
    if (result.errors) {
      displayValidationErrors(result.errors);
    }
    // Error message is already shown by addTransaction/updateTransaction or showMessage
  }
}

/**
 * Handle cancel edit button click
 * Resets form to add mode without saving changes
 * @returns {void}
 */
function handleCancelEdit() {
  // Reset editing state
  editingId = null;
  
  // Clear form
  document.getElementById('transaction-form').reset();
  
  // Reset form UI to add mode
  document.getElementById('form-title').textContent = 'Add Transaction';
  document.getElementById('submit-btn').textContent = 'Add Transaction';
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  
  // Set default date to today
  document.getElementById('date').valueAsDate = new Date();
  
  // Clear validation errors
  clearValidationErrors();
}

/**
 * Setup all event listeners
 * @returns {void}
 */
function setupEventListeners() {
  // Form submission
  document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
  
  // Cancel edit button
  document.getElementById('cancel-edit-btn').addEventListener('click', handleCancelEdit);
  
  // Delete modal buttons
  document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
  document.getElementById('cancel-delete-btn').addEventListener('click', cancelDelete);
  
  // Close modal when clicking outside
  document.getElementById('delete-modal').addEventListener('click', (e) => {
    if (e.target.id === 'delete-modal') {
      cancelDelete();
    }
  });
  
  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
  
  // Import file input
  const importFile = document.getElementById('import-file');
  if (importFile) {
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        importData(file);
      }
      // Reset input so the same file can be imported again
      e.target.value = '';
    });
  }
  
  // Navigation buttons
  document.getElementById('nav-list').addEventListener('click', () => {
    document.getElementById('list-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('about-view').classList.add('hidden');
    currentView = 'list';
    
    // Update active button styles
    updateNavButtons('nav-list');
  });
  
  document.getElementById('nav-dashboard').addEventListener('click', () => {
    document.getElementById('list-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('about-view').classList.add('hidden');
    currentView = 'dashboard';
    renderDashboard();
    
    // Update active button styles
    updateNavButtons('nav-dashboard');
  });
  
  document.getElementById('nav-about').addEventListener('click', () => {
    document.getElementById('list-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('about-view').classList.remove('hidden');
    currentView = 'about';
    
    // Update active button styles
    updateNavButtons('nav-about');
  });
  
  // CTA button in About page
  const ctaBtn = document.getElementById('cta-transactions');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      document.getElementById('nav-list').click();
    });
  }
}

/**
 * Update navigation button styles
 * @param {string} activeId - ID of the active button
 */
function updateNavButtons(activeId) {
  const buttons = ['nav-list', 'nav-dashboard', 'nav-about'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (btnId === activeId) {
        btn.classList.remove('bg-gray-100', 'text-gray-700');
        btn.classList.add('bg-blue-600', 'text-white');
      } else {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
      }
    }
  });
}

// ============ INITIALIZATION ============

/**
 * Initialize application
 * Validates: Requirement 4.5
 */
function init() {
  // Check storage availability (Requirement 4.5)
  if (!isStorageAvailable()) {
    showMessage('This application requires browser storage to function. Please enable storage in browser settings.', 'error');
    // Disable all form inputs and buttons
    document.querySelectorAll('input, button, select').forEach(el => {
      el.disabled = true;
    });
    return;
  }
  
  // Load data (Requirement 4.4)
  transactions = loadTransactions();
  
  // Setup event listeners
  setupEventListeners();
  
  // Render initial view
  renderTransactionList();
  
  // Set default date to today
  const dateInput = document.getElementById('date');
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }
  
  console.log('Personal Finance Tracker initialized');
  console.log(`Loaded ${transactions.length} transactions from storage`);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
