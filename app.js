// app.js
async function loadCSV(path) {
  const resp = await fetch(path);
  const text = await resp.text();

  const lines = text.trim().split("\n");
  const headers = lines[0].split(";");  // changed to ';'
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");   // changed to ';'
    const row = {};
    headers.forEach((h, idx) => {
      const key = h.trim();
      row[key] = cols[idx] ? cols[idx].trim() : "";
    });
    rows.push(row);
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
    tdSeason.textContent = row.season;

    const tdLocation = document.createElement("td");
    tdLocation.textContent = row.location || "(Unknown)";

    const tdGames = document.createElement("td");
    tdGames.textContent = row.games;

    tr.appendChild(tdSeason);
    tr.appendChild(tdLocation);
    tr.appendChild(tdGames);

    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const rows = await loadCSV("home_away_summary.csv");
  populateSeasonSelect(rows);
  renderTable(rows);

  const select = document.getElementById("season-select");
  select.addEventListener("change", () => {
    renderTable(rows, select.value);
  });
});
