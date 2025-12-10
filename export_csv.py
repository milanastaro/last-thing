# export_csv.py
import sqlite3
import csv

conn = sqlite3.connect("football.db")
cur = conn.cursor()

query = """
SELECT season,
       REPLACE(location, ',', ' - ') AS location,
       COUNT(*) AS games
FROM games
GROUP BY season, location;
"""

rows = cur.execute(query).fetchall()

with open("home_away_summary.csv", "w", newline="", encoding="utf-8") as f:
    # Use semicolon as delimiter so commas inside text don't break parsing
    writer = csv.writer(f, delimiter=';')
    writer.writerow(["season", "location", "games"])
    writer.writerows(rows)

print("home_away_summary.csv created successfully with ';' as delimiter!")

