Personal Finance Tracker
A privacy-first, self-hosted personal finance application that helps you take control of your financial future. Built with modern web technologies and designed with an editorial-quality interface.
🌟 Key Features
Privacy-First Design

100% Local Data: All financial information stays on your device
No Cloud Dependencies: Works entirely offline after initial setup
Self-Hosted: Complete control over your financial data
No Tracking: Zero analytics, telemetry, or data collection

Smart Financial Management

Intelligent Transaction Categorization: CSV import with machine learning-based auto-categorization
Flexible Budget Periods: 1-12 month planning cycles that match your life
Compound Growth Projections: Visualize your financial future with interactive charts
Debt Management: Track payoff timelines and optimization strategies
Net Worth Monitoring: Comprehensive asset and liability tracking

Exceptional User Experience

Editorial Design: Clean, typography-driven interface inspired by premium publications
Dark/Light Themes: Seamless theme switching with system preference detection
Responsive Design: Works beautifully on desktop, tablet, and mobile
Minimal Setup: Complete onboarding in under 10 minutes

🚀 Quick Start
Prerequisites

Node.js (v18 or higher)
Rust (latest stable)

Development Setup

Clone the repository
bashgit clone https://github.com/yourusername/personal-finance-tracker.git
cd personal-finance-tracker

Start the backend server
bashcd backend
cargo run
# Server runs on http://localhost:8080

Start the frontend development server
bashcd frontend
npm install
npm run dev
# App runs on http://localhost:3000

Open your browser and navigate to http://localhost:3000

📊 Core Functionality
Onboarding Flow

Household Setup: Define who this budget is for and choose your planning timeframe
Income Configuration: Add all income sources with flexible frequency options
Savings Strategy: Set savings rate and allocate toward specific goals
Budget Planning: Create monthly expense categories with smart suggestions
Net Worth Assessment: Document assets and liabilities for complete financial picture

Transaction Management

CSV Import: Support for major banks and credit card providers
Smart Categorization: Learn from your decisions to automatically categorize future transactions
Transaction Splitting: Break down complex purchases (Amazon orders, restaurant bills, etc.)
Duplicate Detection: Intelligent handling of transactions across multiple accounts
Manual Entry: Clean interface for adding transactions by hand

Financial Insights

Budget Health: Real-time tracking of spending vs. budget across categories
Savings Progress: Visual progress toward financial goals with timeline projections
Net Worth Trends: Track wealth accumulation over time
Debt Payoff: Calculate optimal payment strategies and payoff timelines

🎨 Design Philosophy
This application follows an editorial design system that treats financial planning with the sophistication it deserves:

Typography-Driven: Large, light headlines with generous spacing
Minimal Color Palette: Clean blacks, whites, and grays for timeless elegance
No Decoration: Focus on content, not interface chrome
Clean Interactions: Subtle hover states and clear affordances

🏗️ Architecture
Frontend (/frontend)

React 19: Modern React with concurrent features
Tailwind CSS: Utility-first styling with custom editorial theme
Vite: Fast development server and optimized builds
Lucide Icons: Consistent, beautiful iconography

Backend (/backend)

Rust: High-performance, memory-safe server
Warp: Lightweight web framework
Tokio: Async runtime for concurrent operations
Local Storage: File-based data persistence

Project Structure
├── backend/           # Rust API server
│   ├── src/          # Server source code
│   └── Cargo.toml    # Rust dependencies
├── frontend/         # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   ├── public/       # Static assets
│   └── package.json  # Node.js dependencies
└── README.md
🔧 Development Features
Component Architecture

Onboarding Flow: Multi-step setup with progress tracking
Dashboard: Editorial-style financial overview
Transaction Import: Drag-and-drop CSV processing with column mapping
Theme System: Comprehensive dark/light mode support
Responsive Design: Mobile-first approach with desktop enhancements

Key Hooks & Utilities

useOnboarding: Manages multi-step setup flow
useTransactionStore: Handles transaction data and categorization learning
useTheme: Theme switching and persistence
themeUtils: Editorial design system utilities

🗺️ Roadmap
✅ Completed

Complete onboarding flow with flexible budget periods
Transaction CSV import with intelligent categorization
Editorial design system implementation
Dark/light theme system
Responsive dashboard layout

🚧 In Progress

Enhanced transaction categorization with machine learning
Debt management tools and payoff calculators
Advanced budget analytics and projections
Multi-user support with account management

🔮 Planned

Mobile app (React Native)
Start9 server integration
Bitcoin/Lightning network support
Advanced investment tracking
Tax optimization tools

🤝 Contributing
We welcome contributions! Please see our Contributing Guide for details.
Development Workflow

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Make your changes with tests
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

Inspired by the privacy-first movement and self-sovereign financial tools
Design influenced by high-quality editorial publications
Built with love for the open-source community
