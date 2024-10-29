import sqlite3 from "sqlite3";
sqlite3.verbose();
const db = new sqlite3.Database("./tictactoe.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");

    // Reset tables on run
    db.run(`DROP TABLE IF EXISTS Moves`, (err) => {
      if (err) {
        console.error("Error dropping Moves table:", err.message);
      } else {
        console.log("Moves table dropped successfully.");

        // Drop Games table after Moves table is dropped
        db.run(`DROP TABLE IF EXISTS Games`, (err) => {
          if (err) {
            console.error("Error dropping Games table:", err.message);
          } else {
            console.log("Games table dropped successfully.");

            // Create Games table after both tables are dropped
            db.run(
              `
              CREATE TABLE Games (
                  game_id INTEGER PRIMARY KEY AUTOINCREMENT,
                  game_name TEXT,
                  player1 TEXT,
                  player2 TEXT,
                  status TEXT DEFAULT 'ongoing',
                  winner TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  ended_at TIMESTAMP
              )
              `,
              (err) => {
                if (err) {
                  console.error("Error creating Games table:", err.message);
                } else {
                  console.log("Games table created successfully.");

                  // Create Moves table after Games table is created
                  db.run(
                    `
                    CREATE TABLE Moves (
                        move_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        game_id INTEGER,
                        player TEXT,
                        position INTEGER,
                        move_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (game_id) REFERENCES Games(game_id)
                    )
                    `,
                    (err) => {
                      if (err) {
                        console.error(
                          "Error creating Moves table:",
                          err.message
                        );
                      } else {
                        console.log("Moves table created successfully.");
                      }
                    }
                  );
                }
              }
            );
          }
        });
      }
    });
  }
});

export default db;
