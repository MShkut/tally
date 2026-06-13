# Tally

> **Beta Software**: This is a privacy-first household budget tracker I'm building to actually use. It's beta - it runs on Docker via self-hosting, but the math is still wonky and there's a ton of polish work ahead. Don't trust it with your financial decisions yet.

A household budget app that runs entirely on your own hardware. No cloud, no tracking, no subscriptions.

## What This Is

Simple: track your household budget without sending your financial data to some random company's servers. Everything stays local on your self-hosted Docker server.

---

**What's actually working:**
- Docker container deployment (nginx + Node.js API + SQLite)
- Password authentication (shared household password)
- Data persistence via Docker volumes
- CSV import with auto-categorization
- Transaction review and editing
- Onboarding flow for household setup
- Dark/light themes
- Gift budget management
- Encrypted data export/import (Argon2id + AES-256-GCM, single account password)
- Period rollover ("Plan Next Period")

**What's broken/incomplete:**
- **Budget math is wrong** - calculations need serious work
- **Transaction categorization** - auto-categorization is improved but still has known issues
- **Mobile UI** - works but needs responsive fixes
- **Error handling** - exists but isn't great
- **Tests** - yeah, I know...
- **Password recovery** - lose it and you're starting over

## Running This Thing

### Docker Deployment (Recommended)

**Prerequisites:**
- Docker and Docker Compose installed
- GitHub account with Personal Access Token (for pulling images)

**Quick Start:**

1. **Authenticate with GitHub Container Registry:**
```bash
docker login ghcr.io
# Username: your-github-username
# Password: GitHub Personal Access Token with 'read:packages' scope
# Create token at: https://github.com/settings/tokens/new
```

2. **Clone repository:**
```bash
git clone https://github.com/mshkut/tally.git
cd tally
```

3. **Start production version:**
```bash
make prod-up
# Or: docker compose up -d
```

4. **Access Tally:**
- Production: `http://your-server-ip:8085`
- Default password: `changeme` (change after first login)

**Update to latest version:**
```bash
make prod-restart
# Or: docker compose pull && docker compose up -d
```

### Development Version

Run production and development simultaneously on the same server:

```bash
# Start development version (port 8086)
make dev-up

# Access at: http://your-server-ip:8086
```

**Available Commands:**
```bash
make              # Show all commands
make prod-restart # Pull latest and restart production
make dev-restart  # Pull latest and restart development
make prod-logs    # View production logs
make dev-logs     # View development logs
make status       # Show container status
```

### Local Development & Testing

**IMPORTANT**: Do not rely on `npm run dev` for testing. The Docker environment behaves differently:
- Docker uses SQLite database in `/data` volume
- Dev mode uses browser localStorage
- nginx reverse proxy in front of API
- Different filesystem paths and permissions

**Always test in a Docker container.** Push to `dev`, let CI build
`ghcr.io/mshkut/tally:dev`, then test on the dev deployment (`make dev-restart`
/ `make dev-up` on the server, port 8086) — that's the only environment that
matches production (SQLite, nginx proxy, real filesystem paths).

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
- Node.js + Express API
- SQLite database
- Docker + nginx (production deployment)

**Deployment:**
- Docker containerization
- GitHub Container Registry (ghcr.io)
- Automatic builds via GitHub Actions
- Data persistence via Docker volumes

## Project Structure

```
├── frontend/              # React app (all application logic)
│   ├── src/components/
│   │   ├── setup/              # Onboarding flow
│   │   ├── overview/           # Dashboard & net worth pages
│   │   ├── actions/            # Import, gifts, planning
│   │   ├── shared/             # Reusable components
│   │   └── routing/            # Router config
│   └── src/utils/              # All the helper functions
├── backend/               # Node.js API server
│   ├── server.js           # Express API
│   ├── database/           # SQLite database layer
│   └── models/             # Data models
├── docker/                # Docker configuration
│   ├── Dockerfile          # Multi-stage build
│   ├── nginx.conf          # Reverse proxy config
│   └── start.sh            # Container startup script
├── .github/workflows/     # CI/CD automation
│   └── docker-build.yml    # Auto-build on push
├── docker-compose.yml     # Production deployment
├── docker-compose.dev.yml # Development override
└── Makefile               # Deployment commands
```

## Current Status (Beta)

**Deployment:** Working on Docker with automatic CI/CD

**What Actually Works:**
- Complete onboarding flow
- CSV transaction import
- Transaction categorization (improved, still has known issues)
- Gift budget management
- Theme switching (dark/light)
- Password authentication
- Encrypted data export/import for backup and restore
- Period rollover ("Plan Next Period")
- Data persistence across restarts
- Multi-user shared household budget
- All navigation working correctly (no logout bugs)

**What's Broken (High Priority):**
1. **Budget calculations** - The math is wrong, needs complete review
2. **Transaction totals** - Categorization math doesn't add up correctly
3. **Auto-categorization** - Suggestion logic needs further improvement
4. **UI consistency** - Needs polish across the board

**What's Missing (Medium Priority):**
- Proper error messages
- Mobile responsiveness (works but needs polish)
- Data validation on CSV import
- Password change mechanism in UI

**What I'm Ignoring (Low Priority):**
- Tests (yeah, I know...)
- Documentation beyond README files
- Comprehensive error logging

## Disclaimers

- **Beta software** - it runs, but the math is wrong
- **Household budget** - designed for shared use, not individual accounts
- **Docker deployment only** - no cloud version available
- **No cloud sync** - data lives on your hardware, nowhere else
- **Shared password** - everyone in your household uses the same password
- **Data persistence** - uses Docker volumes, backup regularly!
- **No password recovery** - lose it and you're starting over

## CI/CD & Updates

Images are automatically built and pushed to GitHub Container Registry when you push to:
- `main` branch → `ghcr.io/mshkut/tally:latest`
- `dev` branch → `ghcr.io/mshkut/tally:dev`

Update your deployment with `make prod-restart` or `make dev-restart`.

## License

MIT License - do whatever you want. See [LICENSE](LICENSE).

---

**Current status:** Running on Docker with CI/CD, but needs math fixes before I trust it with actual budgeting.

**Next phase:** Code cleanup and fixing all the broken calculations.

---

*Self-hosting this? Let me know what breaks. GitHub issues welcome.*
