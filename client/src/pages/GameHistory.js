import React, { useEffect, useState } from "react";
import AccessibleAlert from "./AccessibleAlert";

const GameHistory = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [games, setGames] = useState([]);
  const [confimationMsg, setConfirmationMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleConfirmationChange = (event) => {
    setConfirmationMsg(event.target.value);
  };

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
    if (confimationMsg.toLowerCase() != "confirm clear") {
      console.log("clearing");
      setAlertMessage(
        "Wrong confirmation message! Type 'confirm clear' to clear game history"
      );
    } else {
      try {
        const response = await fetch("http://localhost:8800/api/gamesclear", {
          method: "DELETE",
        });

        // fetchGameHistory();
      } catch (error) {
        console.error("Error clearing game history:", error);
      }
      setAlertMessage("Game history cleared");
      setConfirmationMsg("");
    }
  };

  const filteredGames = games.filter(
    (game) =>
      (game.player1?.toLowerCase() || "").includes(searchTerm) ||
      (game.player2?.toLowerCase() || "").includes(searchTerm)
  );

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  return (
    <div>
      <h1 id="history-title">Game History Table</h1>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by player name"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          clearHistory();
        }}
      >
        <input
          type="text"
          value={confimationMsg}
          onChange={handleConfirmationChange}
          placeholder="Type 'confirm clear' to clear game history and hit enter"
        />
      </form>

      {games.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <div role="region" aria-labelledby="history-title">
          <table className="gameHistoryTable">
            <thead>
              <tr>
                <th scope="col">Game ID</th>
                <th>Player 1</th>
                <th>Player 2</th>
                <th>Winner</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game) => (
                <tr key={game.game_id} tabIndex="0">
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
        </div>
      )}
      <AccessibleAlert message={alertMessage} />
    </div>
  );
};

export default GameHistory;
