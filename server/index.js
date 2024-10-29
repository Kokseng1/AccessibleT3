import express from "express";
import db from './db.js';

const app = express();
app.listen(8800, () => {
  console.log("connect to server");
});



app.use(express.json());

// create new game
app.post('/api/game', (req, res) => {
  db.run(`INSERT INTO games (player1, player2, board_state, status) VALUES (?, ?, ?, ?)`,
    [req.body.player1, req.body.player2, '---------', 'ongoing'],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.send({ id: this.lastID });
    });
});
//get game
app.get('/api/game/:id', (req, res) => {
    db.get(`SELECT * FROM games WHERE id = ?`, [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.send(row);
    });
  });
  
  // update game move
app.put('/api/game/:id', (req, res) => {
db.run(`UPDATE games SET board_state = ?, status = ? WHERE id = ?`,
    [req.body.board_state, req.body.status, req.params.id],
    function (err) {
    if (err) {
        return res.status(500).send(err.message);
    }
    res.send({ changes: this.changes });
    });
});