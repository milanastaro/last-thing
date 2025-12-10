# load_db.py
import sqlite3
import csv

DB_PATH = "football.db"

def create_tables():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    with open("schema.sql", "r", encoding="utf-8") as f:
        cur.executescript(f.read())
    conn.commit()
    conn.close()

def load_games():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    with open("games_raw.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cur.execute(
                "INSERT INTO games (season, date, opponent, location, result, score) VALUES (?, ?, ?, ?, ?, ?)",
                (row["season"], row["date"], row["opponent"], row["location"], row["result"], row["score"])
            )
    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
    load_games()
    print("Database created and loaded.")
