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

app.get("/api/games", (req, res) => {
  db.all("SELECT * FROM games", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
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

// update game move
app.put("/api/game/:id", (req, res) => {
  db.run(
    `UPDATE games SET board_state = ?, status = ? WHERE id = ?`,
    [req.body.board_state, req.body.status, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.send({ changes: this.changes });
    }
  );
});

app.post("/api/games/:id/join", (req, res) => {
  const gameId = req.params.id;
  const playerId = req.body.playerId; // Adjust as necessary for your logic
  console.log("in server game" + gameId + playerId);

  // Logic to join the game using gameId and playerId
  // Respond with appropriate message
});
