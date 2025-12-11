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

    // Safely grab by index: 0 = season, 1 = location, 2 = games
    const season = (cols[0] || "").trim();
    const location = (cols[1] || "").trim();
    const games = (cols[2] || "").trim();

    if (!season && !location && !games) continue;

    rows.push({ season, location, games });
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

    const tdGames = document.createElement("td");
    tdGames.textContent = row.games || "0";

    tr.appendChild(tdSeason);
    tr.appendChild(tdLocation);
    tr.appendChild(tdGames);

    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const rows = await loadCSV("home_away_summary.csv");

    // Debug log in case something is off
    console.log("Loaded rows:", rows);

    if (!rows.length) {
      console.warn("No rows loaded from CSV.");
    }

    populateSeasonSelect(rows);
    renderTable(rows);

    const select = document.getElementById("season-select");
    select.addEventListener("change", () => {
      renderTable(rows, select.value);
    });
  } catch (err) {
    console.error("Error loading CSV:", err);
  }
});
