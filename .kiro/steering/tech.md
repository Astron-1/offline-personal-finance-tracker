# Technical Stack

## Architecture

- **Type**: Client-side single-page web application
- **Deployment**: Static hosting (no backend required)
- **Storage**: Browser-based (IndexedDB or localStorage)

## Planned Technology Stack

### Frontend Framework
- Modern web framework (React, Vue, or vanilla JavaScript)
- Responsive design for mobile and desktop viewports (minimum 320px width)

### Styling
- **Tailwind CSS**: Utility-first CSS framework
  - Use default Tailwind spacing scale
  - Maximum of three font sizes (body, headings, labels)
  - Single accent color for primary actions, links, and focus indicators
  - Consistent component states: default, hover, focus, disabled

### Data Visualization
- Chart library for Category_Chart (bar or pie chart)
- Chart library for Time_Chart (line chart showing 12-month trends)

### Storage
- Browser Local Storage or IndexedDB
- JSON serialization for data persistence
- No external database or cloud storage

### External APIs (Optional Feature)
- **frankfurter.app**: Exchange rate API for currency conversion
  - Accessed via mcp-server-fetch MCP server
  - 5-second timeout
  - 24-hour cache for rates

## Build and Development

Since the project is in specification phase, build tooling has not been established yet.

### Recommended Setup (To Be Determined)
- Modern bundler (Vite, Webpack, or Parcel)
- Development server with hot reload
- Production build with minification
- Static file output for deployment

## Performance Requirements

- Transaction operations complete within 500ms
- UI state changes (hover) within 100ms
- Dashboard rendering within 2 seconds (even with API calls)
- Data export/import with accurate round-trip serialization

## Testing Requirements

- Transaction validation (amount, date, category)
- Storage operations (CRUD, error handling)
- Export/import data integrity (byte-identical serialization)
- UI responsiveness (viewport >= 320px)
- Chart rendering with edge cases (no data, single category)
