// api/prefetchOdds.js
import { NextResponse } from 'next';

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('401', { status: 401, statusText: 'Unauthorized' });
  }

  async function fetchOdds() {
    try {
      const apiKey = process.env.ODDS_API_KEY;
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${apiKey}®ions=us&markets=h2h&oddsFormat=decimal`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.statusText}`);
      }

      const oddsData = await response.json();
      console.log('Fetched odds:', oddsData);
      return oddsData;
    } catch (error) {
      console.error('Error in fetchOdds:', error);
      throw error;
    }
  }

  try {
    const odds = await fetchOdds();
    return NextResponse.json({ success: true, data: odds });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
