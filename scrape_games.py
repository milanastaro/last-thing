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
        if ("date" in headers_lower and
            any("opponent" in h for h in headers_lower) and
            "result" in headers_lower):
            return table, headers
    return None, None


def scrape_schedule(url, season_label):
    print(f"Scraping {season_label} from {url}")

    # Use headers to prevent 403 Forbidden
    resp = requests.get(url, headers=HEADERS, timeout=10)

    if resp.status_code == 403:
        raise RuntimeError("ERROR 403: Wikipedia blocked the request. "
                           "Try again or change User-Agent.")

    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    table, headers = find_game_table(soup)

    if table is None:
        raise RuntimeError(f"Could not find the schedule table on {url}")

    headers_lower = [h.lower() for h in headers]

    def col_index(name):
        for i, h in enumerate(headers_lower):
            if name in h:
                return i
        return None

    date_idx = col_index("date")
    opp_idx = col_index("opponent")
    result_idx = col_index("result")
    site_idx = col_index("site") or col_index("location")

    rows = []

    for tr in table.find_all("tr")[1:]:
        cols = [td.get_text(strip=True) for td in tr.find_all(["th", "td"])]
        if len(cols) < 3:
            continue

        try:
            date = cols[date_idx] if date_idx is not None else ""
            opponent = cols[opp_idx] if opp_idx is not None else ""
            result = cols[result_idx] if result_idx is not None else ""
            location = cols[site_idx] if site_idx is not None else ""
        except:
            continue

        rows.append({
            "season": season_label,
            "date": date,
            "opponent": opponent,
            "location": location,
            "result": result,
            "score": result,
        })

    print(f"✓ Scraped {len(rows)} rows for {season_label}")
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
