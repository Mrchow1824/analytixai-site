export default async function handler(req, res) {
  const apiKey = process.env.ODDS_API_KEY;
  const sport = req.query.sport || "basketball_nba";
  const region = "us";
  const market = "h2h,spreads,totals";

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=${region}&markets=${market}&oddsFormat=american`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "API fetch failed" });
    }

    const raw = await response.json();

    // Process and return only the best lines per market
    const cleaned = raw.map(game => {
      const bestMarkets = {};

      // Loop over desired market types
      ["h2h", "spreads", "totals"].forEach(type => {
        game.bookmakers.forEach(book => {
          const market = book.markets.find(m => m.key === type);
          if (!market) return;

          market.outcomes.forEach(outcome => {
            const key = `${type}-${outcome.name}`;
            if (
              !bestMarkets[key] ||
              Math.abs(outcome.price) > Math.abs(bestMarkets[key].price)
            ) {
              bestMarkets[key] = {
                ...outcome,
                sportsbook: book.title,
                market: type,
              };
            }
          });
        });
      });

      return {
        id: game.id,
        teams: game.teams,
        home_team: game.home_team,
        commence_time: game.commence_time,
        bestMarkets,
      };
    });

    res.status(200).json(cleaned);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
