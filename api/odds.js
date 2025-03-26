
export default async function handler(req, res) {
  const apiKey = "3daa707ceb363f36b79f44bedc6abe2f";
  const sport = "basketball_ncaab"; // Change this to any sport you'd like
  const region = "us";
  const market = "spreads";

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=${region}&markets=${market}`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "API fetch failed" });
    }

    const data = await response.json();
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

    res.status(200).json({ picks });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
