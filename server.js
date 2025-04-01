const express = require('express');
const fetchOdds = require('./api/fetchOdds');
const generateParlay = require('./api/generateParlay');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// API endpoint to generate parlays
app.get('/api/generateParlay', async (req, res) => {
  try {
    // Step 1: Fetch MLB odds for today
    const oddsData = await fetchOdds();

    // Step 2: Generate parlays using the Pinnacle prompt
    const parlays = await generateParlay(oddsData);

    // Step 3: Return the parlays
    res.json(parlays);
  } catch (error) {
    console.error('Error generating parlays:', error);
    res.status(500).json({ error: 'Failed to generate parlays' });
  }
});

// Vercel requires a default export for serverless functions
module.exports = app;
