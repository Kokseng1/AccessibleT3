import express from "express";
import db from "./db.js";
import cors from "cors";

const app = express();
app.listen(8800, () => {
  console.log("connect to server");
});

app.use(express.json());
app.use(cors());

// create game
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

// delete game
app.delete("/api/games/:id", (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const deleteGameQuery = `DELETE FROM Games WHERE game_id = ?`;
    const deleteMovesQuery = `DELETE FROM Moves WHERE game_id = ?`;

    db.run(deleteGameQuery, [id], function (err) {
      if (err) {
        console.error("Error deleting game:", err.message);
        db.run("ROLLBACK");
        return res.status(500).json({ error: "Failed to delete game" });
      }

      if (this.changes === 0) {
        db.run("ROLLBACK");
        return res.status(404).json({ error: "Game not found" });
      }

      // Delete moves
      db.run(deleteMovesQuery, [id], function (err) {
        if (err) {
          console.error("Error deleting moves:", err.message);
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Failed to delete game moves" });
        }
        db.run("COMMIT");
        res.status(204).send();
      });
    });
  });
});

// get all games
app.get("/api/games", (req, res) => {
  db.all("SELECT * FROM games", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// create players
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

// make move
app.post("/api/moves", (req, res) => {
  const { gameId, player, position } = req.body;

  db.all("SELECT * FROM Moves WHERE game_id = ?", [gameId], (err, moves) => {
    if (err) {
      console.error("Error fetching moves:", err.message);
      return res.status(500).json({ error: "Failed to fetch moves" });
    }

    const playerTurn = moves.length % 2 === 0 ? 1 : 2;
    if (
      (playerTurn == 1 && player == "X") ||
      (playerTurn == 2 && player == "O")
    ) {
      return res.status(400).json({
        error: `It is currently not your turn`,
      });
    }

    if (moves.length === 9) {
      return res.status(400).json({
        error: `Game has ended, board is full`,
      });
    }

    const board2test = Array(9).fill(null);
    board2test[position] = player;

    for (const move of moves) {
      if (move.position === position) {
        return res.status(400).json({
          error: `Position already has a ${
            move.player == "O" ? "circle" : "cross"
          }`,
        });
      }
      board2test[move.position] = move.player;
    }

    var winner = checkWinner(board2test);
    if (moves.length === 8) {
      const query = `UPDATE Games SET status = ? WHERE game_id = ?`;
      if (winner == null) {
        winner = "Tie";
      }
      db.run(query, ["ended", gameId], function (err) {});
    }
    db.run(
      `INSERT INTO Moves (game_id, player, position) VALUES (?, ?, ?)`,
      [gameId, player, position],
      function (err) {
        if (err) {
          console.error("Error saving move:", err.message);
          return res.status(500).json({ error: "Failed to save move" });
        }
        return res.status(200).json({
          message: "Move saved successfully",
          board: board2test,
          winner,
        });
      }
    );
  });
});

// add player to game (join game)
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
        if (game.player2 === playerName || game.player1 === playerName) {
          var currPlayer = game.player2 == playerName ? "player2" : "player1";
          return res.json({
            player: currPlayer,
          });
        } else if (!game.player1) {
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

// get current game state
app.get("/api/games/:id/currentBoardState", (req, res) => {
  const gameId = req.params.id;
  let latestMove = null;
  db.all("SELECT * FROM Moves WHERE game_id = ?", [gameId], (err, moves) => {
    if (err) {
      console.error("Error fetching moves:", err.message);
      return res.status(500).json({ error: "Failed to fetch moves" });
    }

    const board = Array(9).fill(null);

    moves.forEach((move) => {
      if (!latestMove || move.move_id > latestMove.move_id) {
        latestMove = move;
      }
      board[move.position] = move.player;
    });
    var latestMovePosition = null;
    var latestMovePlayer = null;
    if (latestMove) {
      latestMovePosition = latestMove.position;
      latestMovePlayer = latestMove.player;
    }

    const playerTurn = moves.length % 2 === 0 ? 1 : 2;
    var winner = checkWinner(board);
    if (moves.length === 9 && winner === null) {
      winner = "Tie";
    }
    res.json({
      board,
      winner,
      playerTurn,
      latestMovePlayer,
      latestMovePosition,
    });
  });
});

// record winner
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

// delete all ended games and their moves
app.delete("/api/gamesclear", (req, res) => {
  db.all(
    "SELECT game_id FROM Games WHERE status = ?",
    ["ended"],
    (err, games) => {
      const gameIds = games.map((game) => game.game_id);
      db.run(
        `DELETE FROM Moves WHERE game_id IN (${gameIds.join(",")})`,
        function (err) {
          if (err) {
            return res
              .status(500)
              .json({ error: "Failed to clear move history" });
          }

          db.run("DELETE FROM Games WHERE status = ?", ["ended"], (err) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Failed to clear game history" });
            }
            res
              .status(200)
              .json({ message: "Game history cleared successfully" });
          });
        }
      );
    }
  );
});

const checkWinner = (currentBoard) => {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let combination of winningCombinations) {
    const [a, b, c] = combination;
    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return currentBoard[a];
    }
  }
  return null;
};

//get all games
app.get("/api/games", (req, res) => {
  db.all("SELECT * FROM Games", (err, games) => {
    if (err) {
      console.error("Error fetching game history:", err.message);
      return res.status(500).json({ error: "Failed to fetch game history" });
    }
    res.json(games);
  });
});

// get moves for a given gameId
app.get("/api/moves/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  console.log(gameId);

  const query = `SELECT move_id, player, position FROM moves WHERE game_id = ? ORDER BY move_id ASC`;

  db.all(query, [gameId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: "Database error" });
    } else {
      const moves = rows.map((row) => ({
        player: row.player,
        position: row.position,
      }));
      if (moves.length === 0) {
        return res
          .status(404)
          .json({ error: "Game not found or no moves have been made" });
      }
      res.json(moves);
    }
  });
});
