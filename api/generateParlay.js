// /api/generateParlay.js

export default function handler(req, res) {
  // Dummy data representing AI-generated parlay picks
  const dummyPicks = [
    {
      legs: [
        { match: "Lakers vs. Celtics", odds: "+150" },
        { match: "Warriors vs. Bulls", odds: "+200" }
      ],
      roi: 45
    },
    {
      legs: [
        { match: "Packers vs. Bears", odds: "-110" },
        { match: "Patriots vs. Jets", odds: "-120" },
        { match: "Giants vs. Cowboys", odds: "+250" }
      ],
      roi: 60
    }
  ];

  res.status(200).json(dummyPicks);
}
