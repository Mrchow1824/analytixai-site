const axios = require('axios');

// Use environment variable for API key (set in Vercel dashboard)
const API_KEY = process.env.ODDS_API_KEY;
const SPORT = 'baseball_mlb';
const REGIONS = 'us'; // US odds
const MARKETS = 'h2h'; // Money line odds
const ODDS_FORMAT = 'american'; // +150, -110, etc.
const DATE = new Date().toISOString().split('T')[0]; // Today’s date (e.g., 2025-04-01)

const fetchOdds = async () => {
  // Validate API key presence
  if (!API_KEY) {
    throw new Error('ODDS_API_KEY environment variable is not set');
  }

  try {
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

    // Log remaining requests for monitoring
    const remainingRequests = response.headers['x-requests-remaining'];
    console.log(`The Odds API - Remaining Requests: ${remainingRequests}`);

    // Process the odds data
    const games = response.data
      .map(game => {
        // Check if bookmakers and markets exist
        const outcomes = game.bookmakers?.[0]?.markets?.[0]?.outcomes;
        if (!outcomes) {
          console.warn(`No odds available for game: ${game.home_team} vs ${game.away_team}`);
          return null;
        }

        // Map odds to a simpler structure for generateParlay.js
        const oddsMap = {};
        outcomes.forEach(outcome => {
          oddsMap[outcome.name] = outcome.price.toString(); // Convert to string (e.g., "-150")
        });

        return {
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          odds: oddsMap, // e.g., { "Los Angeles Dodgers": "-150", "Arizona Diamondbacks": "+130" }
          commenceTime: game.commence_time,
        };
      })
      .filter(game => game !== null); // Remove games with no odds

    // Check if any games were returned
    if (games.length === 0) {
      throw new Error('No MLB games with odds available for today');
    }

    return games;
  } catch (error) {
    console.error('Error fetching odds:', error.message);
    throw new Error(`Failed to fetch odds: ${error.message}`);
  }
};

module.exports = fetchOdds;
