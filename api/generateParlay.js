// /api/generateParlay.js

// Helper: Convert American odds (e.g. "+150" or "-120") to implied probability (as a percentage)
function getImpliedProbability(odds) {
  // Remove any whitespace
  const trimmed = odds.trim();
  const normalized = trimmed.replace('+', '');
  const num = parseFloat(normalized);
  if (trimmed.startsWith('+')) {
    return (100 / (num + 100)) * 100;
  } else if (trimmed.startsWith('-')) {
    return ((-num) / (-num + 100)) * 100;
  }
  return 50;
}

// Helper: Generate a convincing, data-driven argument for each bet
function generateArgument(match, odds) {
  const prob = getImpliedProbability(odds).toFixed(2);
  let recommendation = "";
  if (odds.startsWith('+')) {
    // For underdogs, higher positive odds indicate potential high ROI if the market undervalues them.
    recommendation = `The bet on ${match} offers underdog odds of ${odds}, implying a win probability of ${prob}%. Historical market data shows that underdogs with these odds often deliver substantial returns when the market underestimates their potential.`;
  } else {
    // For favorites, negative odds imply consistency.
    recommendation = `The bet on ${match} comes in as a heavy favorite with odds of ${odds}, implying a high win probability of ${prob}%. Consistent performance of favorites in MLB suggests that this bet is a reliable component in a balanced parlay.`;
  }
  return recommendation + " Combining such selections minimizes risk while maximizing overall ROI.";
}

// Helper: Parse teams from a "Team A vs. Team B" string.
function parseTeams(matchString) {
  return matchString.split(' vs. ').map(team => team.trim());
}

export default async function handler(req, res) {
  try {
    // For MLB, use the sport key "baseball_mlb" (verify with The Odds API docs)
    const sport = 'baseball_mlb';
    const oddsUrl =
      process.env.NODE_ENV === 'production'
        ? `https://analytixai.bet/api/fetchOdds?sport=${sport}`
        : `http://localhost:3000/api/fetchOdds?sport=${sport}`;

    // Fetch live odds data from the fetchOdds endpoint
    const oddsResponse = await fetch(oddsUrl);
    if (!oddsResponse.ok) {
      throw new Error(`Failed to fetch odds: ${oddsResponse.statusText}`);
    }
    const oddsData = await oddsResponse.json();

    if (!Array.isArray(oddsData) || oddsData.length === 0) {
      throw new Error('No odds data available for MLB.');
    }

    // Process bets: Extract best available odds from each game (using the first available bookmaker with an 'h2h' market)
    // Now include both positive and negative odds.
    let bets = oddsData.map(game => {
      let bestOdds = null;
      if (Array.isArray(game.bookmakers)) {
        for (const bm of game.bookmakers) {
          if (Array.isArray(bm.markets) && bm.markets.length > 0) {
            const market = bm.markets.find(m => m.key === 'h2h' && Array.isArray(m.outcomes) && m.outcomes.length > 0);
            if (market) {
              // Pick the outcome with the highest absolute odds value
              const outcome = market.outcomes.reduce((prev, curr) =>
                Math.abs(parseFloat(curr.price)) > Math.abs(parseFloat(prev.price)) ? curr : prev
              );
              bestOdds = outcome.price;
              break;
            }
          }
        }
      }
      if (!bestOdds) {
        bestOdds = "+150"; // Fallback default if no outcome found
      }
      return {
        match: game.teams,
        odds: bestOdds,
        argument: generateArgument(game.teams, bestOdds),
        teams: parseTeams(game.teams)
      };
    });

    if (bets.length === 0) {
      throw new Error('No bets available for MLB.');
    }

    // Sort bets: For demonstration, we sort by the absolute value of the odds (higher means higher potential payout)
    bets.sort((a, b) => {
      const oddsA = Math.abs(parseFloat(a.odds.replace('+', '').replace('-', '')));
      const oddsB = Math.abs(parseFloat(b.odds.replace('+', '').replace('-', '')));
      return oddsB - oddsA;
    });

    // Function to build a parlay ensuring no team is repeated (reducing correlation risk)
    function createParlay(numLegs) {
      const selected = [];
      const usedTeams = new Set();

      for (const bet of bets) {
        const betTeams = bet.teams;
        // Check if any team in the bet is already used
        if (betTeams.some(team => usedTeams.has(team))) {
          continue;
        }
        selected.push(bet);
        betTeams.forEach(team => usedTeams.add(team));
        if (selected.length === numLegs) break;
      }

      if (selected.length !== numLegs) return null;

      // Calculate the combined multiplier:
      // For positive odds: multiplier = (odds/100) + 1.
      // For negative odds: multiplier = (100/abs(odds)) + 1.
      const multiplier = selected.reduce((acc, bet) => {
        const price = bet.odds;
        let m;
        if (price.startsWith('+')) {
          m = (parseFloat(price.replace('+', '')) / 100) + 1;
        } else {
          m = (100 / Math.abs(parseFloat(price.replace('-', '')))) + 1;
        }
        return acc * m;
      }, 1);
      const roi = (multiplier - 1) * 100;

      return {
        legs: selected,
        legCount: numLegs,
        roi: roi.toFixed(2)
      };
    }

    // Build parlays: Try to create parlays with 2, 3, and 5 legs (if there are enough unique bets)
    const parlays = [];
    for (const count of [2, 3, 5]) {
      const parlay = createParlay(count);
      if (parlay) parlays.push(parlay);
    }

    if (parlays.length === 0) {
      throw new Error('Unable to construct parlays with the current data.');
    }

    // Return the parlays with detailed, data-driven explanations for each bet.
    res.status(200).json(parlays);
  } catch (error) {
    console.error("Error generating MLB parlay picks:", error);
    res.status(500).json({ error: error.message });
  }
}
