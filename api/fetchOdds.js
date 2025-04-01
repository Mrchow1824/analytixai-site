const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Use environment variable for API key
const API_KEY = process.env.ODDS_API_KEY;
const SPORT = 'baseball_mlb';
const REGIONS = 'us'; // US odds
const MARKETS = 'h2h'; // Money line odds
const ODDS_FORMAT = 'american'; // +150, -110, etc.
const DATE = new Date().toISOString().split('T')[0]; // Today’s date (e.g., 2025-04-01)
const CACHE_FILE = '/tmp/oddsCache.json'; // Use /tmp for Vercel
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const fetchOdds = async () => {
  if (!API_KEY) {
    throw new Error('ODDS_API_KEY environment variable is not set');
  }

  // Check if cache exists and is fresh
  try {
    const startCacheRead = Date.now();
    const cacheData = await fs.readFile(CACHE_FILE, 'utf8');
    const cache = JSON.parse(cacheData);
    const cacheAge = Date.now() - cache.timestamp;
    console.log(`Cache read time: ${Date.now() - startCacheRead}ms`);

    if (cache.date === DATE && cacheAge < CACHE_DURATION) {
      console.log('Returning cached odds data');
      return cache.odds;
    }
  } catch (error) {
    console.log('No valid cache found, fetching new odds:', error.message);
  }

  // Fetch new odds from The Odds API
  try {
    const startApiCall = Date.now();
    const response = await axios.get(
      `https://api.the-odds-api.com/v4/sports/${SPORT}/odds`,
      {
        params: {
          apiKey: API_KEY,
          regions: REGIONS,
          markets: MARKETS,
          oddsFormat: ODDS_FORMAT,
          date: DATE,
        },
      }
    );
    console.log(`The Odds API fetch time: ${Date.now() - startApiCall}ms`);

    // Log remaining requests for monitoring
    const remainingRequests = response.headers['x-requests-remaining'];
    console.log(`The Odds API - Remaining Requests: ${remainingRequests}`);

    // Process the odds data
    const games = response.data
      .map(game => {
        const outcomes = game.bookmakers?.[0]?.markets?.[0]?.outcomes;
        if (!outcomes) {
          console.warn(`No odds available for game: ${game.home_team} vs ${game.away_team}`);
          return null;
        }

        const oddsMap = {};
        outcomes.forEach(outcome => {
          oddsMap[outcome.name] = outcome.price.toString();
        });

        return {
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          odds: oddsMap,
          commenceTime: game.commence_time,
        };
      })
      .filter(game => game !== null);

    // If no games are available, return an empty array
    if (games.length === 0) {
      console.warn('No MLB games with odds available for today');
      return [];
    }

    // Cache the odds data
    const startCacheWrite = Date.now();
    const cacheData = {
      date: DATE,
      timestamp: Date.now(),
      odds: games,
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log(`Cache write time: ${Date.now() - startCacheWrite}ms`);
    console.log('Odds cached successfully');

    return games;
  } catch (error) {
    console.error('Error fetching odds:', error.message);
    throw new Error(`Failed to fetch odds: ${error.message}`);
  }
};

module.exports = fetchOdds;
