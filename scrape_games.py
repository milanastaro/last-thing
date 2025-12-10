# scrape_games.py
import requests
from bs4 import BeautifulSoup
import csv
from time import sleep

# Required header so Wikipedia doesn't block the request
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

GAME_URLS = {
    "2022": "https://en.wikipedia.org/wiki/2022_Buffalo_Bills_season",
    "2023": "https://en.wikipedia.org/wiki/2023_Buffalo_Bills_season",
}


def find_game_table(soup):
    tables = soup.find_all("table", {"class": "wikitable"})
    for table in tables:
        header_row = table.find("tr")
        if not header_row:
            continue
        headers = [th.get_text(strip=True) for th in header_row.find_all("th")]
        headers_lower = [h.lower() for h in headers]

        # Look for a schedule-style table
        if ("date" in headers_lower and
            any("opponent" in h for h in headers_lower) and
            "result" in headers_lower):
            return table, headers
    return None, None


def scrape_schedule(url, season_label):
    print(f"Scraping {season_label} from {url}")

    resp = requests.get(url, headers=HEADERS, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    table, headers = find_game_table(soup)

    if table is None:
        raise RuntimeError(f"Could not find the schedule table on {url}")

    headers_lower = [h.lower() for h in headers]
    print(f"  Headers for {season_label}: {headers_lower}")

    def col_index(name_part):
        for i, h in enumerate(headers_lower):
            if name_part in h:
                return i
        return None

    date_idx = col_index("date")
    opp_idx = col_index("opponent")
    result_idx = col_index("result")

    # IMPORTANT FIX: don't use "or" with indices (0 is valid!)
    site_idx = col_index("site")
    if site_idx is None:
        site_idx = col_index("location")

    print(f"  Indices -> date: {date_idx}, opp: {opp_idx}, result: {result_idx}, site/location: {site_idx}")

    rows = []

    for tr in table.find_all("tr")[1:]:
        cols = [td.get_text(strip=True) for td in tr.find_all(["th", "td"])]
        if len(cols) < 3:
            continue

        try:
            date = cols[date_idx] if date_idx is not None and date_idx < len(cols) else ""
            opponent = cols[opp_idx] if opp_idx is not None and opp_idx < len(cols) else ""
            result = cols[result_idx] if result_idx is not None and result_idx < len(cols) else ""
            location = cols[site_idx] if site_idx is not None and site_idx < len(cols) else ""
        except Exception:
            continue

        if not date and not opponent and not result:
            continue

        rows.append({
            "season": season_label,
            "date": date,
            "opponent": opponent,
            "location": location,
            "result": result,
            "score": result,  # treat result string as score-ish
        })

    print(f"  ✓ Scraped {len(rows)} rows for {season_label}")
    return rows


def main():
    all_rows = []

    for season, url in GAME_URLS.items():
        rows = scrape_schedule(url, season)
        all_rows.extend(rows)
        sleep(1)  # polite delay

    with open("games_raw.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["season", "date", "opponent", "location", "result", "score"]
        )
        writer.writeheader()
        writer.writerows(all_rows)

    print("🎉 Done! Saved games_raw.csv")


if __name__ == "__main__":
    main()
