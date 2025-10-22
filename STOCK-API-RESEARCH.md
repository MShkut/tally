# Stock API Research for Net Worth Feature

## Research Date: October 21, 2025

## Current Implementation
- AlphaVantage API with user-provided API key
- Requires free registration at alphavantage.co
- Free tier: 25 API calls/day, 5 calls/minute

## Alternative Options Researched

### Best Alternative: Yahoo Finance (yfinance)
**Pros:**
- ✅ **No API key required** - Zero registration
- ✅ **No official rate limits** - Essentially unlimited for reasonable use
- ✅ **Free forever** - No paid tiers
- ✅ **Well-maintained** - Latest version 0.2.66 (Sept 2025)
- ✅ **Simple integration** - Python library, could use backend proxy
- ✅ **Real-time data** - Current stock prices
- ✅ **Privacy-friendly** - No user accounts needed

**Cons:**
- ⚠️ Unofficial API - Uses Yahoo Finance's public endpoints
- ⚠️ Yahoo may throttle excessive requests (no hard limits documented)
- ⚠️ No official support or SLA
- ⚠️ Could break if Yahoo changes their endpoints
- ❌ Python-based - Would need backend integration (current app is Node.js)

### Other Options Considered

#### 1. Financial Modeling Prep (FMP)
- Free tier: 250 calls/day
- Requires API key (free registration)
- Good documentation
- More stable than yfinance

#### 2. Polygon.io
- Free tier available
- Real-time data
- Requires registration
- Limited free calls

#### 3. Finnhub
- Free stock API
- Requires API key
- Real-time market data
- 60 calls/minute free tier

#### 4. IEX Cloud
- Free tier available
- Institutional-grade data
- Requires registration
- Limited free calls

#### 5. Twelve Data
- Free tier: 800 calls/day
- Requires API key
- Good for beginners

## Recommendation

### Option 1: Keep AlphaVantage (RECOMMENDED)
**Reasoning:**
- Already implemented
- Free forever with API key
- 25 calls/day is sufficient for net worth tracking (not day trading)
- User controls their own API key (privacy)
- Official API with documentation and support
- Stable and reliable

**When it works:**
- User checks net worth once/day: 1 call/day
- User has 10 stock positions: 10 calls to refresh all
- Well within 25/day limit for personal finance use case

### Option 2: Add Yahoo Finance as No-Key Alternative
**Implementation:**
- Add backend proxy endpoint that calls yfinance
- Users can choose: "Use API Key (AlphaVantage)" or "No API Key (Yahoo Finance)"
- Yahoo option: easier but unofficial
- AlphaVantage option: requires key but more stable

**Pros:**
- Best of both worlds
- Users without API key can still use feature
- Power users can use AlphaVantage for stability

**Cons:**
- More code to maintain
- Two different data sources to handle
- Yahoo option could break without notice

### Option 3: Switch to FMP or Finnhub
**Not recommended because:**
- Still requires API key (no improvement over AlphaVantage)
- Similar or lower rate limits
- No significant advantage for our use case

## Implementation Plan (If Changing)

### To Add Yahoo Finance Backend:

1. **Backend Changes (Node.js):**
   - Add endpoint: `/api/stock-price?symbol=AAPL&source=yahoo`
   - Install node library that wraps Yahoo Finance API
   - Add caching to avoid excessive calls

2. **Frontend Changes:**
   - Update AlphaVantageSettingsModal to include source selection
   - Add toggle: "Data Source: AlphaVantage / Yahoo Finance"
   - When Yahoo selected, hide API key field
   - Update stock price fetch calls to use selected source

3. **User Experience:**
   - Default to Yahoo (no setup required)
   - Option to switch to AlphaVantage for stability
   - Show warning: "Yahoo Finance is unofficial and may stop working"

## Final Recommendation

**Keep AlphaVantage as primary option** because:
1. It's already implemented and working
2. 25 calls/day is plenty for net worth tracking (not day trading)
3. Official API with support and documentation
4. User owns their API key (privacy/control)
5. Free forever
6. More stable than scraping Yahoo

**Optional: Add Yahoo Finance as fallback** for users who don't want to register for API key, but make AlphaVantage the recommended option.

For a privacy-focused budgeting app on Start9, having users manage their own API keys (AlphaVantage) aligns better with the self-hosted philosophy than relying on unofficial scraped endpoints (Yahoo).
