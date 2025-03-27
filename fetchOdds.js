console.log("Initializing Analytix AI: Precision Betting Engine v3.0...");

// Utility Functions
const formatPrice = (price) => (price > 0 ? `+${price}` : `${price}`);
const getTodayKey = () => new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// Enhanced confidence with historical adjustment
const calculateConfidence = (price, historicalSuccess = 0.5) => {
  const decimalOdds = price > 0 ? price / 100 + 1 : 100 / -price + 1;
  const rawProb = 1 / decimalOdds;
  // Adjust based on historical success (0-1 scale)
  const adjustedProb = rawProb * (0.8 + historicalSuccess * 0.4); // Weight history
  return Math.round(Math.min(Math.max(adjustedProb * 100, 20), 98)); // Clamp 20-98%
};

// Strict pick validation
const isValidPick = (pick) => {
  return (
    pick &&
    Array.isArray(pick.teams) &&
    pick.teams.length === 2 &&
    pick.teams.every((t) => typeof t === "string" && t.trim().length > 0) &&
    typeof pick.bookmaker === "string" &&
    pick.bookmaker.trim().length > 0 &&
    Array.isArray(pick.pick) &&
    pick.pick.length > 0 &&
    pick.pick.every(
      (p) =>
        typeof p.name === "string" &&
        p.name.trim().length > 0 &&
        typeof p.point !== "undefined" &&
        Number.isFinite(p.price) &&
        p.price !== 0
    )
  );
};

// Create game element with tracking features
const createGameElement = (pick, isHot = false, historicalSuccess = 0.5) => {
  const confidence = calculateConfidence(pick.pick[0].price, historicalSuccess);
  const match = document.createElement("div");
  match.className = `game ${isHot ? "hot-pick" : ""}`;
  match.dataset.pickId = `${pick.teams.join("-")}-${Date.now()}`; // Unique ID
  match.innerHTML = `
    <div class="game-header">
      <p><strong>${pick.teams[0]}</strong> vs <strong>${pick.teams[1]}</strong></p>
      <span class="bookmaker">${pick.bookmaker}</span>
    </div>
    <div class="pick-details">
      <p class="pick-line">${pick.pick[0].name} <span>${pick.pick[0].point}</span> <em>(${formatPrice(pick.pick[0].price)})</em></p>
      <span class="confidence" data-confidence="${confidence}">
        ${confidence}% ${isHot ? '<span class="hot-tag">🔥 HOT</span>' : ""}
      </span>
    </div>
    <button class="favorite-btn" data-pick='${JSON.stringify(pick)}' aria-label="Toggle Favorite">
      ${loadFavorites().some((f) => f.teams.join() === pick.teams.join()) ? "★" : "⭐"}
    </button>
    <button class="track-btn" data-pick='${JSON.stringify(pick)}' aria-label="Track Bet">📊</button>
  `;
  return match;
};

// Fetch odds with API conservation
async function fetchOddsWithRetry(maxRetries = 3, baseDelayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching odds (attempt ${attempt}/${maxRetries})...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/odds", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

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
        throw new Error(`Odds fetch failed after ${maxRetries} attempts`);
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Bet tracking storage
const BETS_KEY = "analytix_bets_v1";
const loadBets = () => JSON.parse(localStorage.getItem(BETS_KEY) || "{}");
const saveBet = (pick, date = getTodayKey()) => {
  const bets = loadBets();
  if (!bets[date]) bets[date] = [];
  const betEntry = {
    ...pick,
    trackedAt: new Date().toISOString(),
    confidence: calculateConfidence(pick.pick[0].price),
    status: "pending", // pending, won, lost
  };
  bets[date].push(betEntry);
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  dispatchEvent(new Event("betsUpdated"));
};

// Favorites storage
const FAVORITES_KEY = "analytix_favorites_v1";
const loadFavorites = () => JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
const saveFavorite = (pick) => {
  const favorites = loadFavorites();
  if (!favorites.some((f) => f.teams.join() === pick.teams.join())) {
    favorites.push({ ...pick, favoritedAt: new Date().toISOString() });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    dispatchEvent(new Event("favoritesUpdated"));
  }
};
const removeFavorite = (pick) => {
  const favorites = loadFavorites().filter((f) => f.teams.join() !== pick.teams.join());
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  dispatchEvent(new Event("favoritesUpdated"));
};

// AI learning simulation (simplified)
const analyzeHistoricalPerformance = (picks) => {
  const bets = loadBets();
  const today = getTodayKey();
  const historicalData = Object.entries(bets)
    .filter(([date]) => date !== today)
    .flatMap(([, dayBets]) => dayBets);

  return picks.map((pick) => {
    const teamKey = pick.teams.join("-");
    const pastBets = historicalData.filter((b) => b.teams.join("-") === teamKey);
    const successRate = pastBets.length
      ? pastBets.reduce((acc, b) => acc + (b.status === "won" ? 1 : 0), 0) / pastBets.length
      : 0.5; // Default 50% if no history
    return { ...pick, historicalSuccess: successRate };
  });
};

// Smart processing with AI weighting
const processPicks = (picks) => {
  const validPicks = picks.filter(isValidPick);
  const enhancedPicks = analyzeHistoricalPerformance(validPicks);

  // Score with AI weighting
  const scoredPicks = enhancedPicks.map((pick) => {
    const confidence = calculateConfidence(pick.pick[0].price, pick.historicalSuccess);
    const trendFactor = pick.pick[0].price > 0 ? 1.1 : 0.9; // Price trend boost
    return { ...pick, score: confidence * trendFactor };
  });

  scoredPicks.sort((a, b) => b.score - a.score);
  scoredPicks.slice(0, 2).forEach((pick) => (pick.isHot = true));

  return scoredPicks.slice(0, 5);
};

// Main display function
async function loadAndDisplayOdds() {
  const container = document.getElementById("autoParlay");
  if (!container) return;

  container.innerHTML = '<p class="loading" aria-live="polite">Analyzing odds...</p>';

  try {
    const rawPicks = await fetchOddsWithRetry();
    const processedPicks = processPicks(rawPicks);
    console.log("AI-Enhanced Picks:", processedPicks);

    requestAnimationFrame(() => {
      container.innerHTML = "";
      const fragment = document.createDocumentFragment();

      processedPicks.forEach((pick) => {
        const element = createGameElement(pick, pick.isHot, pick.historicalSuccess);
        fragment.appendChild(element);
      });

      container.appendChild(fragment);

      if (!container.children.length) {
        container.innerHTML = '<p class="no-picks">No prime picks yet!</p>';
      }

      // Event listeners
      container.querySelectorAll(".favorite-btn").forEach((btn) => {
        const pick = JSON.parse(btn.dataset.pick);
        btn.classList.toggle("favorited", loadFavorites().some((f) => f.teams.join() === pick.teams.join()));
        btn.addEventListener("click", () => {
          btn.classList.toggle("favorited");
          btn.textContent = btn.classList.contains("favorited") ? "★" : "⭐";
          btn.classList.contains("favorited") ? saveFavorite(pick) : removeFavorite(pick);
        });
      });

      container.querySelectorAll(".track-btn").forEach((btn) => {
        const pick = JSON.parse(btn.dataset.pick);
        btn.addEventListener("click", () => {
          saveBet(pick);
          btn.textContent = "✅";
          btn.disabled = true;
        });
      });
    });

  } catch (error) {
    console.error("Odds processing failed:", error);
    container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  } finally {
    container.dataset.lastUpdated = new Date().toISOString();
    updatePerformanceDashboard();
  }
}

// Performance dashboard
const updatePerformanceDashboard = () => {
  const dashboard = document.getElementById("performanceDashboard");
  if (!dashboard) return;

  const bets = loadBets();
  const today = getTodayKey();
  const todayBets = bets[today] || [];
  const totalBets = Object.values(bets).flat().length;
  const wins = Object.values(bets).flat().filter((b) => b.status === "won").length;
  const winRate = totalBets ? (wins / totalBets * 100).toFixed(1) : 0;

  dashboard.innerHTML = `
    <h3>AI Performance</h3>
    <p>Today's Bets: ${todayBets.length}</p>
    <p>Total Bets: ${totalBets}</p>
    <p>Win Rate: ${winRate}%</p>
  `;
};

// Real-time updates (fixed 5-minute refresh)
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

// Simulated bet resolution (for demo purposes)
function simulateBetOutcomes() {
  const bets = loadBets();
  const today = getTodayKey();
  if (!bets[today]) return;

  bets[today].forEach((bet) => {
    if (bet.status === "pending" && Math.random() > 0.3) { // 70% chance of resolution
      bet.status = Math.random() > 0.5 ? "won" : "lost"; // 50/50 win/loss
      bet.resolvedAt = new Date().toISOString();
    }
  });
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  updatePerformanceDashboard();
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  try {
    loadAndDisplayOdds();
    startRealTimeUpdates();
    setInterval(simulateBetOutcomes, 10 * 60 * 1000); // Resolve bets every 10 mins (demo)

    const refreshBtn = document.getElementById("refreshOdds");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        lastFetch = 0;
        loadAndDisplayOdds();
      });
    }

    // Add dashboard to DOM
    const main = document.querySelector("main");
    if (main && !document.getElementById("performanceDashboard")) {
      const dashboard = document.createElement("section");
      dashboard.id = "performanceDashboard";
      dashboard.className = "highlight";
      main.appendChild(dashboard);
      updatePerformanceDashboard();
    }
  } catch (error) {
    console.error("System failure:", error);
    document.getElementById("autoParlay").innerHTML = '<p class="fatal-error">AI offline. Rebooting...</p>';
  }
});

// Event listeners for updates
window.addEventListener("betsUpdated", () => {
  console.log("Bets tracked:", loadBets()[getTodayKey()]);
  updatePerformanceDashboard();
});
window.addEventListener("favoritesUpdated", () => {
  console.log("Favorites synced:", loadFavorites());
});
