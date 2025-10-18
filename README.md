# Tally

> **Beta Software**: This is a privacy-first household budget tracker I'm building to actually use. It's beta 0.0.1 - it runs on Start9 OS and Docker, but the math is still wonky and there's a ton of polish work ahead. Don't trust it with your financial decisions yet.

A household budget app that runs entirely on your own hardware. No cloud, no tracking, no subscriptions.

## What This Is

Simple: track your household budget without sending your financial data to some random company's servers. Everything stays local - either in your browser or on your Start9 server.

**What's actually working (beta 0.0.1):**
- Runs on Start9 OS (tested on real hardware!)
- Docker container deployment (nginx + Node.js API)
- Password authentication (shared household password)
- Data persistence via Docker volumes
- CSV import with auto-categorization
- Transaction review and editing
- Onboarding flow for household setup
- Dark/light themes
- Net worth tracking
- Gift budget management
- LAN and Tor access

**What's broken/incomplete:**
- **Budget math is wrong** - calculations need serious work
- **Period rollover doesn't work** - monthly transitions are broken
- **Transaction categorization** - auto-categorization is hit or miss
- **Mobile UI** - works but needs responsive fixes
- **Error handling** - exists but isn't great
- **Tests** - yeah, I know...
- **Password recovery** - lose it and you're starting over

## Running This Thing

### Option 1: Start9 OS (Recommended)

If you have a Start9 server:

```bash
# Build the package
cd startos
make install           # Builds Docker image
start-sdk pack .       # Creates .s9pk package

# Then sideload tally-budget.s9pk through your Start9 web UI
```

See `startos/INSTALL-GUIDE.md` for detailed instructions.

### Option 2: Docker (Quick Testing)

```bash
# Build and run the container
make build      # Build Docker image
make run        # Start container on http://localhost:8080
make logs       # View logs
make stop       # Stop container

# Data persists in Docker volume 'tally-data'
```

### Option 3: Local Development

```bash
# Frontend only (all logic is here)
cd frontend
npm install
npm run dev     # Runs on http://localhost:3000
```

Note: In local dev mode, data is stored in browser localStorage only.

## Design Philosophy

Going for an "editorial" look - like a well-designed magazine instead of typical finance app UI:
- Big, readable typography
- Lots of whitespace
- Minimal colors and decoration
- Clean interactions

Trying to make budget tracking feel less like a chore and more like reading something actually pleasant.

## Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS (editorial theme)
- Browser localStorage (fallback mode)

**Backend:**
- Node.js API (Docker/Start9 container mode)
- Docker + nginx (production deployment)
- No backend in local dev mode (localStorage only)

**Deployment:**
- Start9 OS package (.s9pk)
- Docker containerization
- Data persistence via volumes

## Project Structure

```
├── frontend/          # React app (all application logic)
│   ├── src/components/
│   │   ├── setup/              # Onboarding flow
│   │   ├── overview/           # Dashboard & net worth pages
│   │   ├── actions/            # Import, gifts, planning
│   │   ├── shared/             # Reusable components
│   │   └── routing/            # Router config
│   └── src/utils/              # All the helper functions
├── docker/            # Docker containerization
│   ├── Dockerfile
│   ├── server.js      # Node.js API for container mode
│   ├── nginx.conf
│   └── start.sh       # Container startup
├── startos/           # Start9 OS package
│   ├── manifest.yaml
│   ├── Makefile
│   └── (scripts and docs)
└── Makefile           # Root-level Docker commands
```

## Current Status (Beta 0.0.1)

**Deployment:** Working on Start9 OS and Docker

**What Actually Works:**
- Complete onboarding flow
- CSV transaction import
- Transaction categorization (needs improvement)
- Net worth tracking (assets + liabilities)
- Gift budget management
- Theme switching (dark/light)
- Password authentication
- Data persistence across restarts
- Multi-user shared household budget

**What's Broken (High Priority):**
1. **Budget calculations** - The math is wrong, needs complete review
2. **Period transitions** - Monthly/period rollovers don't work properly
3. **Transaction totals** - Categorization math doesn't add up correctly
4. **Auto-categorization** - Suggestion logic needs improvement
5. **UI consistency** - Needs polish across the board

**What's Missing (Medium Priority):**
- Proper error messages
- Mobile responsiveness (works but needs polish)
- Data validation on CSV import
- Better health check reporting for Start9
- Password change mechanism in UI

**What I'm Ignoring (Low Priority):**
- Tests (yeah, I know...)
- Better icon for Start9 (currently just a blue square with "T")
- Documentation beyond README files

## Disclaimers

- **Beta software** - it runs, but the math is wrong
- **Household budget** - designed for shared use, not individual accounts
- **Start9 or Docker only** - browser localStorage mode is just for development
- **No cloud sync** - data lives on your hardware, nowhere else
- **Shared password** - everyone in your household uses the same password
- **Clear data = game over** - no password recovery, no data recovery (use Start9 backups!)

## License

MIT License - do whatever you want. See [LICENSE](LICENSE).

---

**Current status:** Running on Start9 OS, but needs math fixes before I trust it with actual budgeting.

**Next phase:** Code cleanup and fixing all the broken calculations.

---

*Running this on Start9? Let me know what breaks. Github issues welcome.*
