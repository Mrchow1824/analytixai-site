
// fetchOdds.js
console.log("Fetching live odds...");

const apiKey = "3daa707ceb363f36b79f44bedc6abe2f";
const sport = "basketball_ncaab"; // You can change to basketball_nba, baseball_mlb, etc.
const region = "us";
const market = "spreads"; // spreads | totals | h2h

async function fetchOdds() {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=${region}&markets=${market}`
    );

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    console.log("Live odds data:", data);

    // For now, just return the first 3 matchups with key info
    const picks = data.slice(0, 3).map((game) => {
      const book = game.bookmakers[0];
      const market = book.markets[0];
      return {
        teams: game.teams,
        commence_time: game.commence_time,
        bookmaker: book.title,
        pick: market.outcomes
      };
    });

    console.log("Smart Picks Preview:", picks);
    return picks;

  } catch (error) {
    console.error("Error fetching odds:", error);
  }
}

fetchOdds();
