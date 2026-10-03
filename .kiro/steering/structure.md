# Project Structure

## Repository Organization

```
kiro-project/
├── .kiro/                          # Kiro IDE configuration
│   ├── hooks/                      # Agent automation hooks
│   ├── specs/                      # Feature specifications
│   │   └── personal-finance-tracker/
│   │       ├── .config.kiro        # Spec workflow configuration
│   │       ├── requirements.md     # Detailed requirements document
│   │       └── design.md           # Design document (pending)
│   └── steering/                   # AI guidance documents
│       ├── product.md              # Product overview
│       ├── tech.md                 # Technical stack information
│       └── structure.md            # This file
└── .sf/                            # Salesforce metadata (unrelated to main project)
```

## Planned Application Structure

The application structure has not been implemented yet. Based on the requirements, here's the recommended organization:

```
src/
├── components/                     # UI components
│   ├── TransactionList.jsx        # Transaction viewing and management
│   ├── TransactionForm.jsx        # Add/edit transaction forms
│   ├── Dashboard.jsx              # Spending summaries and charts
│   ├── CategoryChart.jsx          # Category distribution visualization
│   ├── TimeChart.jsx              # Monthly spending trends
│   └── CurrencyConverter.jsx      # Currency toggle (optional)
├── services/                       # Business logic
│   ├── storage.js                 # Local storage operations
│   ├── transactions.js            # Transaction CRUD operations
│   ├── parser.js                  # JSON export/import serialization
│   └── currency.js                # Exchange rate API integration (optional)
├── utils/                          # Helper functions
│   ├── validators.js              # Input validation
│   ├── formatters.js              # Currency and date formatting
│   └── calculations.js            # Spending totals and aggregations
├── constants/                      # Application constants
│   └── categories.js              # Seven predefined categories
└── App.jsx                        # Root component
```

## Key Architectural Patterns

### Data Flow
1. **Local Storage Layer**: All persistence through browser storage
2. **Service Layer**: Business logic for transactions, validation, and calculations
3. **Component Layer**: React/Vue components for UI rendering
4. **No Backend**: All operations client-side only

### Component Responsibilities
- **TransactionList**: Display, edit, delete transactions; sorted by date descending
- **Dashboard**: Calculate totals, render charts, handle currency toggle
- **Charts**: Visualize category distribution and monthly trends
- **Forms**: Validate and submit transaction data

### Data Models

**Transaction Object**:
```javascript
{
  amount: number,      // Positive number, max 2 decimal places
  category: string,    // One of 7 predefined categories
  date: string,        // Valid calendar date
  notes: string        // Optional, max 500 characters
}
```

**Categories** (Predefined):
- Food
- Transport
- Housing
- Shopping
- Entertainment
- Health
- Other

## File Naming Conventions

- Components: PascalCase (e.g., `TransactionList.jsx`)
- Services/Utils: camelCase (e.g., `storage.js`, `formatters.js`)
- Constants: camelCase files, UPPER_CASE exports
- Tests: `*.test.js` or `*.spec.js` alongside source files

## Configuration Files (To Be Added)

- `package.json`: Dependencies and scripts
- `tailwind.config.js`: Tailwind CSS customization
- `.gitignore`: Exclude node_modules, build artifacts
- `vite.config.js` or equivalent: Build configuration
- `.env.example`: Environment variables template (if needed)
