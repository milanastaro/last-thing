async function loadCSV(path) {
  const resp = await fetch(path);
  const text = await resp.text();
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    let row = {};
    headers.forEach((h, i) => row[h] = cols[i]);
    return row;
  });
}

function populateSeasonSelect(rows) {
  const select = document.getElementById("season-select");
  const seasons = [...new Set(rows.map(r => r.season))];
  seasons.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  });
}

function renderTable(rows, season = "all") {
  const tbody = document.querySelector("#summary-table tbody");
  tbody.innerHTML = "";
  rows.filter(r => season === "all" || r.season === season)
      .forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.season}</td><td>${r.location}</td><td>${r.games}</td>`;
        tbody.appendChild(tr);
      });
}

document.addEventListener("DOMContentLoaded", async () => {
  const rows = await loadCSV("home_away_summary.csv");
  populateSeasonSelect(rows);
  renderTable(rows);
  document.getElementById("season-select").addEventListener("change", e => {
    renderTable(rows, e.target.value);
  });
});
