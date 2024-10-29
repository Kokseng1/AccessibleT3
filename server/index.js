import express from "express";
import db from "./db.js";
import cors from "cors";

const app = express();
app.listen(8800, () => {
  console.log("connect to server");
});

app.use(express.json());
app.use(cors());
//create game
app.post("/api/games", (req, res) => {
  const { game_name } = req.body;

  const query = `INSERT INTO Games (game_name) VALUES (?)`;
  db.run(query, [game_name], function (err) {
    if (err) {
      console.error("Error creating game:", err.message);
      return res.status(500).json({ error: "Failed to create game" });
    }
    res.status(201).json({ game_id: this.lastID, game_name });
  });
});

app.delete("/api/games/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM Games WHERE game_id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      console.error("Error deleting game:", err.message);
      return res.status(500).json({ error: "Failed to delete game" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.status(204).send();
  });
});

app.get("/api/games", (req, res) => {
  db.all("SELECT * FROM games", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post("/api/players", (req, res) => {
  const { playerName } = req.body;

  db.run(
    `INSERT INTO Players (player_name) VALUES (?)`,
    [playerName],
    function (err) {
      if (err) {
        return res
          .status(400)
          .json({ message: "Error adding player: " + err.message });
      }
      res.status(201).json({ playerId: this.lastID, playerName });
    }
  );
});

app.get("/api/games/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM games WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    res.json(row);
  });
});

app.post("/api/moves", (req, res) => {
  const { gameId, player, position } = req.body;

  db.run(
    `INSERT INTO Moves (game_id, player, position) VALUES (?, ?, ?)`,
    [gameId, player, position],
    function (err) {
      if (err) {
        console.error("Error saving move:", err.message);
        res.status(500).json({ error: "Failed to save move" });
      } else {
        console.log(
          `Move recorded for Game ID: ${gameId}, Position: ${position}, Player: ${player}`
        );
        res.status(200).json({ message: "Move saved successfully" });
      }
    }
  );
});

app.post("/api/games/:id/join", (req, res) => {
  const gameId = req.params.id;
  const playerName = req.body.playerName;
  console.log("player " + playerName + " joined server game " + gameId);

  db.get(
    "SELECT player1, player2, status FROM Games WHERE game_id = ?",
    [gameId],
    (err, game) => {
      if (err) {
        console.error("Error fetching game:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      if (game.status === "ongoing") {
        if (!game.player1) {
          db.run(
            "UPDATE Games SET player1 = ? WHERE game_id = ?",
            [playerName, gameId],
            function (err) {
              if (err) {
                console.error("Error assigning player1:", err.message);
                return res.status(500).json({ error: "Internal Server Error" });
              }
              return res.json({
                player: "player1",
              });
            }
          );
        } else if (!game.player2) {
          db.run(
            "UPDATE Games SET player2 = ? WHERE game_id = ?",
            [playerName, gameId],
            function (err) {
              if (err) {
                console.error("Error assigning player2:", err.message);
                return res.status(500).json({ error: "Internal Server Error" });
              }
              return res.json({
                player: "player2",
              });
            }
          );
        } else {
          return res.status(400).json({ error: "Game full" });
        }
      } else {
        return res.status(400).json({ error: "Game is not ongoing" });
      }
    }
  );
});

// Fetch all moves for a specific game
app.get("/api/games/:id/moves", (req, res) => {
  const gameId = req.params.id;
  //   console.log(gameId);
  db.all("SELECT * FROM Moves WHERE game_id = ?", [gameId], (err, position) => {
    if (err) {
      console.error("Error fetching moves:", err.message);
      return res.status(500).json({ error: "Failed to fetch moves" });
    }
    // console.log(position);
    res.json(position);
  });
});

app.put("/api/games/:id/winner", (req, res) => {
  const { id } = req.params;
  const { winner } = req.body; // wiinner name in the request body
  const query = `UPDATE Games SET winner = ?, status = ? WHERE game_id = ?`;

  db.run(query, [winner, "ended", id], function (err) {
    if (err) {
      console.error("Error updating winner:", err.message);
      return res.status(500).json({ error: "Failed to update winner" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.status(200).json({ message: "Winner updated successfully", winner });
  });
});

