const generateParlay = async (oddsData) => {
  // Simulate feeding odds into the Pinnacle prompt
  // In a real setup, you'd call xAI's API with the prompt and oddsData
  // For now, we'll return a sample response based on the odds

  // Example oddsData structure:
  // [
  //   { homeTeam: "Los Angeles Dodgers", awayTeam: "Arizona Diamondbacks", odds: [{ name: "Los Angeles Dodgers", price: -150 }, { name: "Arizona Diamondbacks", price: +130 }], commenceTime: "..." },
  //   ...
  // ]

  // Simulate Pinnacle prompt analysis (you'd run this with Grok)
  const parlays = [
    {
      name: "Conservative Parlay (+320)",
      legs: [
        {
          team: "Los Angeles Dodgers",
          odds: "-150",
          winProb: "65%",
          confidence: "High",
          rationale: "Dodgers’ elite pitching overpowers a shaky Arizona lineup."
        },
        {
          team: "New York Yankees",
          odds: "-140",
          winProb: "62%",
          confidence: "High",
          rationale: "Yankees’ Gerrit Cole dominates early against a rebuilding Tigers squad."
        }
      ],
      totalOdds: "+320",
      combinedWinProb: "85%",
      profit: "320",
      summary: "Two locks with top-tier pitching and home-field edge."
    },
    {
      name: "Aggressive Parlay (+850)",
      legs: [
        {
          team: "Atlanta Braves",
          odds: "-130",
          winProb: "60%",
          confidence: "High",
          rationale: "Braves’ offense feasts on Miami’s depleted rotation."
        },
        {
          team: "Houston Astros",
          odds: "+140",
          winProb: "45%",
          confidence: "Medium",
          rationale: "Astros’ road value shines in a tight divisional matchup."
        },
        {
          team: "Chicago Cubs",
          odds: "+150",
          winProb: "42%",
          confidence: "Medium",
          rationale: "Cubs’ young bats exploit Reds’ bullpen fatigue."
        }
      ],
      totalOdds: "+850",
      combinedWinProb: "62%",
      profit: "850",
      summary: "Mixes a favorite with two live underdogs for a juicy payout."
    },
    {
      name: "Moonshot Parlay (+1600)",
      legs: [
        {
          team: "Pittsburgh Pirates",
          odds: "+170",
          winProb: "40%",
          confidence: "Low",
          rationale: "Pirates’ young arms surprise early."
        },
        {
          team: "Oakland A’s",
          odds: "+190",
          winProb: "35%",
          confidence: "Low",
          rationale: "A’s pull an upset with a hot bat."
        },
        {
          team: "Colorado Rockies",
          odds: "+200",
          winProb: "33%",
          confidence: "Low",
          rationale: "Rockies thrive at home against a Padres slump."
        }
      ],
      totalOdds: "+1600",
      combinedWinProb: "45%",
      profit: "1600",
      summary: "Three undervalued underdogs with upset potential—pure adrenaline."
    }
  ];

  return parlays;
};

module.exports = generateParlay;
