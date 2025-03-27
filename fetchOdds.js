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

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
