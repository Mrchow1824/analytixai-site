// /api/generateParlay.js

export default async function handler(req, res) {
  try {
    // 1. Fetch live odds from your fetchOdds API
    //    (If your site is 'analytixai.bet', you might do:
    //    `https://analytixai.bet/api/fetchOdds?sport=basketball_nba`)
    const oddsResponse = await fetch(`${process.env.VERCEL_URL}/api/fetchOdds?sport=basketball_nba`);
    const oddsData = await oddsResponse.json();

    // 2. Build some simple logic to pick games for a parlay
    //    Example: choose 2 random games
    const picks = [];
    for (let i = 0; i < 2; i++) {
      const randomIndex = Math.floor(Math.random() * oddsData.length);
      const game = oddsData[randomIndex];
      picks.push({
        match: game.teams,
        // For demonstration, we’re hardcoding +150. Ideally, parse real odds from game.bookmakers
        odds: "+150"
      });
    }

    // 3. Construct your parlay object
    const parlay = {
      legs: picks,
      roi: 45  // Dummy ROI calculation for now
    };

    // 4. Return an array of parlays or a single parlay
    res.status(200).json([parlay]);
  } catch (error) {
    console.error("Error generating parlay picks:", error);
    res.status(500).json({ error: error.message });
  }
}
