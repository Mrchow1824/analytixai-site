export default async function handler(req, res) {
  const apiKey = process.env.ODDS_API_KEY;
  const sport = req.query.sport || "basketball_ncaab";
  const region = "us";
  const market = "spreads";

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=${region}&markets=${market}&oddsFormat=american`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "API fetch failed" });
    }

    const data = await response.json();

    const picks = data.slice(0, 3).map((game) => {
      const bookmaker = game.bookmakers?.[0];
      const market = bookmaker?.markets?.[0];

      return {
        teams: game.teams,
        commence_time: game.commence_time,
        bookmaker: bookmaker?.title || "Unknown",
        pick: market?.outcomes?.map((o) => ({
          name: o.name,
          point: o.point,
          price: o.price
        })) || []
      };
    });

    res.status(200).json({ picks });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
