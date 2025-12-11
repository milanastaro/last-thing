// app.js

async function loadCSV(path) {
  const resp = await fetch(path);
  const text = await resp.text();

  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return [];
  }

  // Detect delimiter automatically: ';' preferred, fallback to ','
  const headerLine = lines[0];
  let delim = ";";
  if (headerLine.indexOf(";") === -1 && headerLine.indexOf(",") !== -1) {
    delim = ",";
  }

  const rows = [];

  // Start at 1 to skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(delim);

    // 0 = season, 1 = location, 2 = score
    const season = (cols[0] || "").trim();
    const location = (cols[1] || "").trim();
    const score = (cols[2] || "").trim();

    if (!season && !location && !score) continue;

    rows.push({ season, location, score });
  }

  return rows;
}

function populateSeasonSelect(rows) {
  const select = document.getElementById("season-select");
  const seasons = Array.from(new Set(rows.map(r => r.season))).sort();

  seasons.forEach(season => {
    const opt = document.createElement("option");
    opt.value = season;
    opt.textContent = season;
    select.appendChild(opt);
  });
}

function renderTable(rows, filterSeason = "all") {
  const tbody = document.querySelector("#summary-table tbody");
  tbody.innerHTML = "";

  const filtered = filterSeason === "all"
    ? rows
    : rows.filter(r => r.season === filterSeason);

  filtered.forEach(row => {
    const tr = document.createElement("tr");

    const tdSeason = document.createElement("td");
    tdSeason.textContent = row.season || "(Unknown)";

    const tdLocation = document.createElement("td");
    tdLocation.textContent = row.location || "(Unknown)";

    const tdScore = document.createElement("td");
    tdScore.textContent = row.score || "(Unknown)";

    tr.appendChild(tdSeason);
    tr.appendChild(tdLocation);
    tr.appendChild(tdScore);

    tbody.appendChild(tr);
  });
}

// Same coords object as before
const teamCoords = {
  "Buffalo Bills": [42.7738, -78.7868],
  "Buffalo Bills (Highmark Stadium - Orchard Park, NY)": [42.7738, -78.7868],

  "Miami Dolphins": [25.958, -80.2389],
  "Miami Dolphins (Miami Gardens, FL)": [25.958, -80.2389],

  "New England Patriots": [42.0909, -71.2643],
  "New England Patriots (Foxborough, MA)": [42.0909, -71.2643],

  "New York Jets": [40.8136, -74.0744],
  "New York Jets (East Rutherford, NJ)": [40.8136, -74.0744],

  "Baltimore Ravens": [39.278, -76.6227],
  "Baltimore Ravens (Baltimore, MD)": [39.278, -76.6227],
};

// Try to resolve a location string to coordinates by matching team name inside it
function getCoordsForLocation(loc) {
  if (!loc) return null;

  // Direct match first
  if (teamCoords[loc]) {
    return teamCoords[loc];
  }

  // Fuzzy match: see if the location string contains a known team name
  for (const name in teamCoords) {
    if (loc.includes(name)) {
      return teamCoords[name];
    }
  }

  return null;
}

function initMap(rows) {
  const mapDiv = document.getElementById("map");
  if (!mapDiv || typeof L === "undefined") {
    return;
  }

  const map = L.map("map").setView([39.8283, -98.5795], 4); // center on USA

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // Count how many rows we have per location (ignoring score)
  const counts = {};
  rows.forEach(r => {
    const loc = r.location;
    if (!loc) return;
    counts[loc] = (counts[loc] || 0) + 1;
  });

  Object.entries(counts).forEach(([loc, count]) => {
    const coords = getCoordsForLocation(loc);
    if (!coords) return;

    const [lat, lng] = coords;
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<strong>${loc}</strong><br/>Games in this dataset: ${count}`);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const rows = await loadCSV("home_away_summary.csv");
    console.log("Loaded rows:", rows);

    populateSeasonSelect(rows);
    renderTable(rows);
    initMap(rows);

    const select = document.getElementById("season-select");
    select.addEventListener("change", () => {
      renderTable(rows, select.value);
    });
  } catch (err) {
    console.error("Error loading CSV:", err);
  }
});
