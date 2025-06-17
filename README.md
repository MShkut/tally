# Personal Finance Tracker

A privacy-focused, self-hosted personal finance tracking application built with Rust backend and React frontend.

## Core Features
- **Privacy First**: All data stored locally, no cloud dependencies
- **Smart Transaction Categorization**: CSV import with learning-based auto-categorization
- **Comprehensive Financial Planning**: Savings projections, debt management, net worth tracking
- **User-Friendly**: Minimal manual entry after initial setup

## Tech Stack
- **Backend**: Rust (Warp, Tokio)
- **Frontend**: React 19, Tailwind CSS, Vite
- **Icons**: Lucide React
- **Data**: Local file-based storage

## Development

### Backend
```bash
cd backend
cargo run
# Server runs on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

## Project Structure
```
├── backend/           # Rust API server
│   ├── src/          # Source code
│   └── Cargo.toml    # Dependencies
├── frontend/         # React application
│   ├── src/          # Components, hooks, contexts
│   ├── public/       # Static assets
│   └── package.json  # Dependencies
└── README.md
```

## Development Progress
- ✅ Basic onboarding flow components
- ✅ CSV upload with drag-and-drop
- ✅ Icon system for categorization
- ✅ Theme system (dark/light mode)
- ⏳ Transaction categorization engine
- ⏳ Savings projection calculations
- ⏳ Net worth tracking
