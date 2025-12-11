# export_csv.py
import sqlite3
import csv

conn = sqlite3.connect("football.db")
cur = conn.cursor()

query = """
SELECT
  season,
  CASE
    WHEN TRIM(location) = '' THEN opponent
    ELSE REPLACE(location, ',', ' - ')
  END AS display_location,
  COUNT(*) AS games
FROM games
GROUP BY season, display_location;
"""

rows = cur.execute(query).fetchall()

with open("home_away_summary.csv", "w", newline="", encoding="utf-8") as f:
    # Use semicolon as delimiter so commas inside text don't break parsing
    writer = csv.writer(f, delimiter=';')
    writer.writerow(["season", "location", "games"])
    writer.writerows(rows)

print("home_away_summary.csv created successfully with ';' as delimiter and cleaned locations!")
