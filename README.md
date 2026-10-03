# Personal Finance Tracker

A simple, local-first expense tracking web app. No accounts, no servers, no tracking.

## Features

- ✅ **Track Expenses** - Add, edit, and delete transactions with amount, category, date, and notes
- 📊 **Visual Dashboard** - See spending by category (pie chart) and monthly trends (line chart)
- 🔒 **100% Private** - All data stays in your browser, nothing sent to any server
- 💾 **Export/Import** - Backup your data as JSON files anytime
- 📱 **Responsive** - Works on desktop and mobile (320px+ width)

## Quick Start

1. Open `index.html` in any modern web browser
2. Start adding your expenses
3. That's it!

No installation, no setup, no configuration needed.

## How to Use

### Add a Transaction
1. Fill in the amount, category, date, and optional note
2. Click "Add Transaction"

### View Dashboard
1. Click "Dashboard" in the top navigation
2. See your total spending, category breakdown, and monthly trends

### Backup Your Data
1. Click "Export Data" to download a JSON file
2. Click "Import Data" to restore from a JSON file

## Categories

- 🍔 Food
- 🚗 Transport
- 🏠 Housing
- 🛍️ Shopping
- 🎬 Entertainment
- ⚕️ Health
- 📌 Other

## Technical Details

- **No Backend** - Pure client-side application
- **Storage** - Browser localStorage (5-10MB available)
- **Framework** - Vanilla JavaScript (no React/Vue/etc.)
- **Styling** - Tailwind CSS via CDN
- **Charts** - Chart.js via CDN

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Privacy

Your financial data never leaves your device. No accounts, no servers, no analytics, no tracking. This app runs entirely in your browser.

## Data Format

Exported JSON structure:
```json
[
  {
    "amount": 45.99,
    "category": "Food",
    "date": "2024-01-15",
    "notes": "Groceries"
  }
]
```

## License

Free to use, modify, and distribute.
