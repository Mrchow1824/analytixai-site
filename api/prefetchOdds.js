const fetchOdds = require('./fetchOdds');

module.exports = async (req, res) => {
  try {
    const odds = await fetchOdds();
    res.status(200).json({ message: 'Odds pre-fetched successfully', odds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
