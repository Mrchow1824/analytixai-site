console.log("Initializing the baddest odds fetcher ever...");

// Utility Functions
const formatPrice = (price) => (price > 0 ? `+${price}` : `${price}`);

// Calculate implied probability from odds (for confidence score)
const calculateConfidence = (price) => {
  const decimalOdds = price > 0 ? (price / 100) + 1 : (100 / -price) + 1;
  const probability = Math.round((1 / decimalOdds) * 100);
  return Math.min(Math.max(probability, 10), 90); // Clamp between 10-90% for realism
};

const isValidPick = (pick) => {
  return (
    pick &&
    Array.isArray(pick.teams) &&
    pick.teams.length === 2 &&
    typeof pick.bookmaker === "string" &&
    Array.isArray(pick.pick) &&
    pick.pick.length > 0 &&
    pick.pick.every(
      (p) =>
        typeof p.name === "string" &&
        typeof p.point !== "undefined" &&
        typeof p.price === "number"
    )
  );
};

const createGameElement = (pick, isHot = false) => {
  const confidence = calculateConfidence(pick.pick[0].price);
  const match = document.createElement("div");
  match.className = `game ${isHot ? "hot-pick" : ""}`;
  match.innerHTML = `
    <p><strong>${pick.teams[0]}</strong> vs <strong>${pick.teams[1]}</strong></p>
    <p>Book: ${pick.bookmaker}</p>
    <p><em>${pick.pick[0].name} ${pick.pick[0].point} (${formatPrice(pick.pick[0].price)})</em></p>
    <p class="confidence">Confidence: ${confidence}% ${isHot ? "🔥 HOT" : ""}</p>
    <button class="favorite-btn" data-pick='${JSON.stringify(pick)}'>⭐</button>
  `;
  return match;
};

// Fetch with retry logic
async function fetchOddsWithRetry(maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching odds (attempt ${attempt}/${maxRetries})...`);
      const response = await fetch("/api/odds", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.picks || !Array.isArray(data.picks)) {
        throw new Error("Invalid picks data structure");
      }

      return data.picks;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) {
        throw new Error("Max retries reached. Unable to fetch odds.");
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Smart filtering and sorting
const processPicks = (picks) => {
  // Filter out invalid picks
  const validPicks = picks.filter(isValidPick);

  // Sort by confidence (highest first)
  validPicks.sort((a, b) => {
    const confA = calculateConfidence(a.pick[0].price);
    const confB = calculateConfidence(b.pick[0].price);
    return confB - confA;
  });

  // Mark the top pick as "hot" (highest confidence)
  if (validPicks.length > 0) {
    validPicks[0].isHot = true;
  }

  return validPicks.slice(0, 5); // Limit to top 5 picks
};

// Local storage for favorites
const loadFavorites = () => JSON.parse(localStorage.getItem("favorites") || "[]");
const saveFavorite = (pick) => {
  const favorites = loadFavorites();
  if (!favorites.some((f) => f.teams.join() === pick.teams.join())) {
    favorites.push(pick);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
};
const removeFavorite = (pick) => {
  const favorites = loadFavorites().filter((f) => f.teams.join() !== pick.teams.join());
  localStorage.setItem("favorites", JSON.stringify(favorites));
};

// Main display function
async function loadAndDisplayOdds() {
  const container = document.getElementById("autoParlay");
  if (!container) {
    console.error("Container #autoParlay not found in DOM");
    return;
  }

  container.innerHTML = "<p class='loading'>Loading the baddest picks...</p>";

  try {
    const rawPicks = await fetchOddsWithRetry();
    const processedPicks = processPicks(rawPicks);
    console.log("Processed Smart Picks:", processedPicks);

    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    processedPicks.forEach((pick) => {
      const element = createGameElement(pick, pick.isHot);
      fragment.appendChild(element);
    });

    container.appendChild(fragment);

    if (container.children.length === 0) {
      container.innerHTML = "<p>No valid picks right now. Check back soon!</p>";
    }

    // Add favorite button listeners
    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      const pick = JSON.parse(btn.dataset.pick);
      btn.addEventListener("click", () => {
        btn.classList.toggle("favorited");
        if (btn.classList.contains("favorited")) {
          saveFavorite(pick);
          btn.textContent = "★";
        } else {
          removeFavorite(pick);
          btn.textContent = "⭐";
        }
      });
    });

  } catch (error) {
    console.error("Failed to load picks:", error);
    container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

// Real-time refresh (every 5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastFetch = 0;
function startRealTimeUpdates() {
  const refreshIfNeeded = () => {
    const now = Date.now();
    if (now - lastFetch >= REFRESH_INTERVAL) {
      lastFetch = now;
      loadAndDisplayOdds();
    }
  };
  setInterval(refreshIfNeeded, 60000); // Check every minute
}

// Kick off on load and set up updates
document.addEventListener("DOMContentLoaded", () => {
  loadAndDisplayOdds();
  startRealTimeUpdates();
});

// Manual refresh button
document.getElementById("refreshOdds")?.addEventListener("click", () => {
  lastFetch = 0; // Force immediate refresh
  loadAndDisplayOdds();
});
