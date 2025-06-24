# Tally🚧

> **⚠️ Experimental Project**: This is a work-in-progress personal finance app that I'm building for fun and to learn new technologies. It's very much "vibe coded" - expect rough edges, incomplete features, and things that might break. Don't use this for your actual finances yet!

A privacy-first personal finance app that keeps all your data local. Built with React, Rust, and a lot of caffeine.

## 🎯 What I'm Building

The idea is simple: a finance tracker that doesn't send your data anywhere. Everything stays on your device. No accounts, no cloud, no tracking.

**Current vibe:**
- ✅ Basic onboarding flow (mostly works)
- ✅ CSV import with auto-categorization (surprisingly decent)
- ✅ Dark/light themes (because why not)
- ✅ Transaction splitting (for when Amazon orders get weird)
- 🚧 Dashboard (exists but needs love)
- 🚧 Budget tracking (half-baked)
- ❌ Mobile app (maybe someday)
- ❌ Proper error handling (who needs that?)

## 🚀 Try It Out (If You're Brave)

### You'll Need
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (latest)
- A sense of adventure

### Getting Started
```bash
# Clone this experiment
git clone https://github.com/yourusername/personal-finance-tracker.git
cd personal-finance-tracker

# Start the Rust backend
cd backend
cargo run
# Should start on http://localhost:8080

# Start the React frontend
cd frontend
npm install
npm run dev
# Should start on http://localhost:3000
```

Cross your fingers and navigate to `http://localhost:3000`

## 🎨 Design Philosophy (Pretentious Section)

I'm going for an "editorial" look - think fancy magazine rather than typical SaaS app:
- Big, light typography
- Lots of whitespace
- No unnecessary colors or decorations
- Clean, minimal interactions

Basically trying to make budgeting feel less like a chore and more like reading a well-designed publication.

## 🛠️ Tech Stack

**Frontend:**
- React 19 (because I like living dangerously)
- Tailwind CSS (for rapid prototyping)
- Vite (fast refresh is addictive)

**Backend:**
- Rust + Warp (learning Rust one compile error at a time)
- Local file storage (keeping it simple)

## 📁 Project Structure
```
├── backend/           # Rust server (handles CSV processing)
├── frontend/          # React app (where the magic happens)
│   ├── src/components/    # UI components
│   ├── src/hooks/         # Custom React hooks
│   └── src/utils/         # Helper functions
└── README.md          # You are here
```

## 🎯 Current Status

**What Actually Works:**
- Onboarding flow (surprisingly smooth)
- CSV import with decent auto-categorization
- Transaction review and editing
- Theme switching
- Basic dashboard layout

**What's Broken/Missing:**
- Proper error handling
- Data persistence (reloads reset everything)
- Mobile responsiveness (desktop first, oops)
- Tests (I know, I know...)
- Documentation (this README is it)

**What I'm Working On:**
- Making the dashboard actually useful
- Better transaction categorization
- Debt tracking features
- Not breaking things when I add new features

## 🤷‍♂️ Why Build This?

Good question! Mostly because:
1. I wanted to learn Rust
2. Existing finance apps either suck or steal your data
3. I enjoy the pain of building complex UIs
4. Someone on Twitter said it couldn't be done (kidding)

## 🚨 Disclaimers

- **Don't use this for real finances yet** - it's not ready
- **Expect bugs** - there are definitely bugs
- **Things will change** - I'm still figuring out what this should be
- **No warranty** - if this breaks something, that's on you
- **Local storage only** - clear your browser data and poof, it's gone

## 🤝 Contributing

If you want to help with this experiment:
1. Fork it
2. Make it better
3. Send a PR
4. Hope I don't break your changes

No formal process yet - we're keeping it casual.

## 📝 License

MIT License - do whatever you want with this code. See [LICENSE](LICENSE) for the legal stuff.

## 🙏 Inspiration

- Built because existing finance apps are either terrible or invasive
- Design inspired by good magazines and editorial layouts
- Privacy approach inspired by the self-sovereign movement
- Code quality inspired by "good enough to ship"

---

**Current mood:** Cautiously optimistic that this might actually become useful someday.

**Last updated:** When I remembered to update this README (probably weeks ago).

---

*Want to follow along with this experiment? Star the repo or something. No pressure though.*
