const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory store for parlay suggestions and their outcomes (for demonstration)
const parlayHistory = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Placeholder function for generating an AI parlay suggestion
function getAISuggestedParlay() {
  // Dummy games data; replace with actual API data if needed.
  const sampleGames = [
    { home_team: 'Lakers', away_team: 'Warriors', commence_time: Date.now() + 3600000 },
    { home_team: 'Celtics', away_team: 'Bucks', commence_time: Date.now() + 7200000 },
    { home_team: 'Patriots', away_team: 'Chiefs', commence_time: Date.now() + 5400000 },
    { home_team: 'Yankees', away_team: 'Red Sox', commence_time: Date.now() + 3600000 }
  ];

  // Randomly choose between 2 and 7 legs for the parlay
  const numLegs = Math.floor(Math.random() * 6) + 2;
  const legs = [];
  for (let i = 0; i < numLegs; i++) {
    // Randomly pick a game and then choose a pick randomly (home or away)
    const game = sampleGames[Math.floor(Math.random() * sampleGames.length)];
    const pick = Math.random() > 0.5 ? game.home_team : game.away_team;
    legs.push({ ...game, pick });
  }

  // Create a dummy win chance (for example purposes)
  const winChance = (Math.random() * 50 + 50).toFixed(2); // between 50% and 100%

  return {
    id: uuidv4(),
    legs,
    winChance
  };
}

// GET endpoint to fetch an AI parlay suggestion
app.get('/api/getParlaySuggestion', (req, res) => {
  const suggestion = getAISuggestedParlay();
  // Save suggestion to history for later analysis
  parlayHistory.push({ ...suggestion, reported: null, timestamp: new Date() });
  res.json(suggestion);
});

// POST endpoint to report the outcome of a parlay suggestion
app.post('/api/reportResult', (req, res) => {
  const { parlayId, win } = req.body;
  // Find the parlay in history
  const parlay = parlayHistory.find(p => p.id === parlayId);
  if (!parlay) {
    return res.status(404).json({ message: 'Parlay suggestion not found' });
  }
  // Update the record with the outcome
  parlay.reported = win;
  res.json({ message: 'Outcome recorded. Thank you for your feedback!' });
});

// Optional endpoint to review parlay history (for admin or analysis)
app.get('/api/parlayHistory', (req, res) => {
  res.json(parlayHistory);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
