console.log("Fetching odds from backend...");

async function fetchOdds() {
  try {
    const response = await fetch("/api/odds");

    if (!response.ok) {
      throw new Error("Failed to fetch odds from backend");
    }

    const data = await response.json();
    const picks = data.picks;
    console.log("Smart Picks from backend:", picks);

    const container = document.getElementById("autoParlay");

    picks.forEach((pick) => {
      if (
        pick &&
        Array.isArray(pick.teams) &&
        pick.teams.length === 2 &&
        pick.bookmaker &&
        Array.isArray(pick.pick) &&
        pick.pick.length > 0 &&
        pick.pick[0].name &&
        typeof pick.pick[0].point !== "undefined" &&
        typeof pick.pick[0].price !== "undefined"
      ) {
        const match = document.createElement("div");
        match.className = "game";
        match.innerHTML = `
          <p><strong>${pick.teams[0]}</strong> vs <strong>${pick.teams[1]}</strong></p>
          <p>Book: ${pick.bookmaker}</p>
          <p><em>${pick.pick[0].name} ${pick.pick[0].point} (${pick.pick[0].price > 0 ? '+' : ''}${pick.pick[0].price})</em></p>
        `;
        container.appendChild(match);
      } else {
        console.warn("Skipped incomplete pick:", pick);
      }
    });
  } catch (error) {
    console.error("Error loading picks:", error);
  }
}

fetchOdds();
