// /api/fetchOdds.js

export default async function handler(req, res) {
  try {
    // 1. Read the sport from query params or default to 'basketball_nba'
    const sport = req.query.sport || 'basketball_nba';
    
    // 2. Construct the API endpoint
    //    Check The Odds API docs for other params like region (us, uk), oddsFormat, etc.
    const apiKey = process.env.ODDS_API_KEY; // Make sure this is set in Vercel
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    
    // 3. Fetch data from The Odds API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch odds: ${response.statusText}`);
    }
    
    // 4. Parse the JSON data
    const data = await response.json();
    
    // 5. (Optional) Filter or process the data for your needs
    //    For example, we can pick a few games or transform the structure.
    const processed = data.map(game => {
      return {
        gameId: game.id,
        teams: game.away_team + ' vs. ' + game.home_team,
        bookmakers: game.bookmakers.map(bm => ({
          name: bm.key,
          markets: bm.markets
        }))
      };
    });
    
    // 6. Return the processed data
    res.status(200).json(processed);
  } catch (error) {
    console.error('Error in fetchOdds:', error);
    res.status(500).json({ error: error.message });
  }
}
