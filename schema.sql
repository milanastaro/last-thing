DROP TABLE IF EXISTS games;

CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season   TEXT,
    date     TEXT,
    opponent TEXT,
    location TEXT,
    result   TEXT,
    score    TEXT
);
