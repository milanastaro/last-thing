// app.js

// ----------------------
// 1. LOAD CSV (scores)
// ----------------------
async function loadCSV(path) {
  const resp = await fetch(path);
  const text = await resp.text();

  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // We know our CSV is ';' separated: season;location;score
  const headers = lines[0].split(";");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(";");
    const row = {};

    headers.forEach((h, idx) => {
      const key = h.trim(); // "season", "location", "score"
      row[key] = cols[idx] ? cols[idx].trim() : "";
    });

    rows.push(row);
  }

  return rows;
}

// ----------------------
// 2. TABLE FUNCTIONS
// ----------------------
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

// ----------------------
// 3. MAP SETUP
// ----------------------

// Coordinates for our sample locations
const teamCoords = {
  "Buffalo Bills (Highmark Stadium - Orchard Park, NY)": [42.7738, -78.7868],
  "Miami Dolphins (Miami Gardens, FL)": [25.958, -80.2389],
  "New England Patriots (Foxborough, MA)": [42.0909, -71.2643],
  "New York Jets (East Rutherford, NJ)": [40.8136, -74.0744],
  "Baltimore Ravens (Baltimore, MD)": [39.278, -76.6227],
};

// Try to resolve a location string to coordinates
function getCoordsForLocation(loc) {
  if (!loc) return null;

  if (teamCoords[loc]) return teamCoords[loc];

  // Fallback: if location contains a team name part
  for (const name in teamCoords) {
    if (loc.includes(name.split(" ")[0])) {
      return teamCoords[name];
    }
  }

  return null;
}

function initMapBase() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) {
    console.warn("Map div not found");
    return null;
  }
  if (typeof L === "undefined") {
    console.error("Leaflet (L) is not defined. Check Leaflet script include.");
    return null;
  }

  const map = L.map("map").setView([39.8283, -98.5795], 4); // Center on US
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  return map;
}

function addMarkersToMap(map, rows) {
  if (!map) return;

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
    marker.bindPopup(`<strong>${loc}</strong><br/>Games in this sample: ${count}`);
  });
}

// ----------------------
// 4. MAIN INIT
// ----------------------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("DOM loaded, initializing app…");

    // 1) Always initialize map base first
    const map = initMapBase();

    // 2) Load CSV and render table + map markers
    const rows = await loadCSV("home_away_summary.csv");
    console.log("Loaded rows from CSV:", rows);

    populateSeasonSelect(rows);
    renderTable(rows);
    addMarkersToMap(map, rows);

    // 3) Wire up season filter
    const select = document.getElementById("season-select");
    select.addEventListener("change", () => {
      renderTable(rows, select.value);
    });
  } catch (err) {
    console.error("Error initializing app:", err);
  }
});
