import sqlite3 from "sqlite3";
sqlite3.verbose();

const db = new sqlite3.Database("./tictactoe.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");

    // resetTables();
  }
});

const resetTables = () => {
  dropTable("Moves", createMovesTable);
};

// Function to drop a table
const dropTable = (tableName, callback) => {
  db.run(`DROP TABLE IF EXISTS ${tableName}`, (err) => {
    if (err) {
      console.error(`Error dropping ${tableName} table:`, err.message);
    } else {
      console.log(`${tableName} table dropped successfully.`);
      callback(); // Call the next function to create the new table
    }
  });
};

// Function to create the Games table
const createGamesTable = () => {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS Games (
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
        createMovesTable(); // Call the function to create Moves table
        createPlayersTable(); // Call the function to create Players table
      }
    }
  );
};

// Function to create the Moves table
const createMovesTable = () => {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS Moves (
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
        console.error("Error creating Moves table:", err.message);
      } else {
        console.log("Moves table created successfully.");
      }
    }
  );
};

// Function to create the Players table
const createPlayersTable = () => {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS Players (
          player_id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_name TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    (err) => {
      if (err) {
        console.error("Error creating Players table:", err.message);
      } else {
        console.log("Players table created successfully.");
      }
    }
  );
};

// Start the table creation process
createGamesTable();

export default db;
