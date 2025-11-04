// Backend currency conversion utility
// Uses frankfurter.app API (free, no API key needed)

const https = require('https');

const BASE_URL = 'https://api.frankfurter.app';

// In-memory cache for exchange rates (1 hour TTL)
const rateCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rate from frankfurter.app
 * @param {string} from - Source currency code (e.g., 'CAD')
 * @param {string} to - Target currency code (e.g., 'USD')
 * @returns {Promise<number>} Exchange rate
 */
async function fetchExchangeRate(from, to) {
  // Same currency, no conversion needed
  if (from.toUpperCase() === to.toUpperCase()) {
    return 1.0;
  }

  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();
  const cacheKey = `${fromUpper}-${toUpper}`;

  // Check cache
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[CURRENCY] Using cached rate ${fromUpper}→${toUpper}: ${cached.rate}`);
    return cached.rate;
  }

  console.log(`[CURRENCY] Fetching exchange rate ${fromUpper}→${toUpper}...`);

  const url = `/latest?from=${fromUpper}&to=${toUpper}`;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.frankfurter.app',
      path: url,
      method: 'GET',
      headers: { 'User-Agent': 'Tally-Budget/1.0' }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`Currency API error: ${res.statusCode} ${res.statusMessage}`);
          }

          const jsonData = JSON.parse(data);

          if (!jsonData.rates || !jsonData.rates[toUpper]) {
            throw new Error(`No exchange rate available for ${fromUpper}→${toUpper}`);
          }

          const rate = jsonData.rates[toUpper];

          // Cache the result
          rateCache.set(cacheKey, { rate, timestamp: Date.now() });

          console.log(`[CURRENCY] ✅ Fetched rate ${fromUpper}→${toUpper}: ${rate}`);
          resolve(rate);
        } catch (parseError) {
          // If cached value exists (even if expired), use it as fallback
          if (cached) {
            console.log(`[CURRENCY] Parse error, using expired cache as fallback: ${cached.rate}`);
            resolve(cached.rate);
          } else {
            reject(parseError);
          }
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[CURRENCY] Request failed for ${fromUpper}→${toUpper}:`, error.message);

      // If cached value exists (even if expired), use it as fallback
      if (cached) {
        console.log(`[CURRENCY] Using expired cache as fallback: ${cached.rate}`);
        resolve(cached.rate);
      } else {
        reject(new Error(`Currency conversion unavailable: ${error.message}`));
      }
    });

    req.setTimeout(10000, () => {
      req.destroy();
      const error = new Error('Request timeout');

      // If cached value exists (even if expired), use it as fallback
      if (cached) {
        console.log(`[CURRENCY] Timeout, using expired cache as fallback: ${cached.rate}`);
        resolve(cached.rate);
      } else {
        reject(error);
      }
    });

    req.end();
  });
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} from - Source currency code
 * @param {string} to - Target currency code
 * @returns {Promise<number>} Converted amount
 */
async function convert(amount, from, to) {
  const rate = await fetchExchangeRate(from, to);
  return amount * rate;
}

/**
 * Clear exchange rate cache
 */
function clearCache() {
  rateCache.clear();
  console.log('[CURRENCY] Exchange rate cache cleared');
}

module.exports = {
  fetchExchangeRate,
  convert,
  clearCache
};
