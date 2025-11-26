# Personal Finance App

A full-stack personal finance management application with **multi-currency support** powered by the Romanian National Bank (BNR) API and comprehensive unit testing.

## Features

### Core Functionality
- 💰 **Budget tracking** by category with spending limits
- 🔔 **Bill reminders** and recurring bill management
- 📊 **Transaction management** with customizable categories
- 📈 **Visual dashboard** with spending insights and analytics
- 📱 **Mobile-responsive** design

### Multi-Currency Support (NEW!)
- 💱 **Real-time Exchange Rates** from BNR (Banca Națională a României) API
- 🌍 **20+ Currencies** including EUR, USD, GBP, CHF, JPY
- 🔄 **Automatic Conversion** between currencies
- 💸 **Multi-currency Transactions** with original currency preservation
- 📅 **Daily Rate Updates** with intelligent caching
- ⚙️ **User Preference** for display currency

### Testing (NEW!)
- ✅ **56 passing tests** (backend + frontend)
- 🧪 **Jest + Supertest** for API testing
- ⚛️ **React Testing Library** for component testing
- 📊 **50%+ code coverage** on critical paths

## Tech Stack

### Backend
- **Node.js** with Express
- **SQLite3** database
- **BNR API Integration** for exchange rates
- **node-cron** for scheduled rate updates
- **xml2js** for XML parsing
- **Jest + Supertest** for testing

### Frontend
- **React** 18 with Hooks
- **React Router** for navigation
- **Recharts** for data visualization
- **Axios** for API calls
- **Context API** for state management
- **React Testing Library** for testing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Install server dependencies:
```bash
cd server
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
```

### Running the App

1. Start the backend server:
```bash
cd server
npm start       # Production mode
# or
npm run dev     # Development mode with auto-restart
```
Server runs on `http://localhost:5000`

2. In a new terminal, start the React app:
```bash
cd client
npm start
```
Client runs on `http://localhost:3000`

### Running Tests

**Backend tests:**
```bash
cd server
npm test                    # Run all tests
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode
```

**Frontend tests:**
```bash
cd client
npm test
```

## API Endpoints

### Currency Endpoints (NEW!)
- `GET /api/currency/rates` - Get current exchange rates
- `POST /api/currency/convert` - Convert amount between currencies
- `GET /api/currency/preference` - Get user's display currency preference
- `PUT /api/currency/preference` - Update display currency preference
- `GET /api/currency/currencies` - List all available currencies
- `POST /api/currency/update-rates` - Manually trigger rate update

### Core Endpoints
- `GET/POST/PUT/DELETE /api/categories` - Category management
- `GET/POST/PUT/DELETE /api/transactions` - Transaction management
- `GET/POST/PUT/DELETE /api/budgets` - Budget management
- `GET/POST/PUT/DELETE /api/bills` - Bill management
- `GET /api/dashboard/summary` - Dashboard summary
- `GET /api/dashboard/spending-by-category` - Spending breakdown
- `GET /api/dashboard/recent-transactions` - Recent transactions

## Multi-Currency Implementation

### BNR API Integration
Integrates with Romania's official exchange rate feed:
- **Source**: Banca Națională a României (Romanian National Bank)
- **URL**: https://www.bnr.ro/nbrfxrates.xml
- **Update**: Daily at 2:00 AM (via cron job)
- **Base Currency**: RON (Romanian Leu)
- **Supported**: 20+ major world currencies

### Currency Service
The `currencyService.js` provides:
- Fetching rates from BNR XML API
- Database caching for performance
- Currency conversion calculations
- Fallback to cached rates if API unavailable

### Frontend Integration
- Global currency context for app-wide state
- Currency selector in navigation bar
- Automatic amount conversion and formatting
- Preference persistence

## Database Schema

### New Tables
- **exchange_rates**: Cached daily rates from BNR
- **user_preferences**: User settings (display currency, etc.)

### Updated Tables
All monetary tables now include `currency` field:
- **transactions** - With currency code
- **budgets** - With currency code
- **bills** - With currency code

## Project Structure

```
Finance app 4/
├── server/
│   ├── __tests__/          # Unit tests
│   ├── database/           # SQLite DB setup
│   ├── routes/             # API routes
│   ├── services/           # Currency service (NEW!)
│   ├── server.js           # Entry point
│   ├── jest.config.js      # Test config (NEW!)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── __tests__/      # Component tests (NEW!)
│   │   ├── components/     # React components
│   │   ├── context/        # Currency context (NEW!)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── App.js
│   ├── setupTests.js       # Test setup (NEW!)
│   └── package.json
└── README.md
```

## Environment Variables

### Server (.env)
```env
PORT=5000
DB_PATH=./database/finance.db
NODE_ENV=development
```

### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Test Coverage

Total: **56 tests** passing
- Categories API: 9 tests
- Transactions API: 11 tests
- Budgets API: 10 tests
- Bills API: 11 tests
- Dashboard API: 15 tests
- React Components: Basic tests

## License

ISC
