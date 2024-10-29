import React, { useEffect, useState } from "react";

const GameHistory = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        const response = await fetch("http://localhost:8800/api/games");
        if (!response.ok) {
          throw new Error("Failed to fetch game history");
        }
        const data = await response.json();
        setGames(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchGameHistory();

    const intervalId = setInterval(fetchGameHistory, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const clearHistory = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the game history?"
    );
    if (confirmClear) {
      try {
        const response = await fetch("http://localhost:8800/api/gamesclear", {
          method: "DELETE",
        });

        // fetchGameHistory();
      } catch (error) {
        console.error("Error clearing game history:", error);
      }
    }
  };

  return (
    <div>
      <h1>Game History</h1>
      <button onClick={clearHistory}>Clear Game History</button>
      {games.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Game ID</th>
              <th>Player 1</th>
              <th>Player 2</th>
              <th>Winner</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.game_id}>
                <td>{game.game_id}</td>
                <td>{game.player1}</td>
                <td>{game.player2}</td>
                <td>
                  {game.winner
                    ? game.winner
                    : game.status === "ended"
                    ? "Tie"
                    : "Ongoing"}
                </td>
                <td>{new Date(game.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GameHistory;
