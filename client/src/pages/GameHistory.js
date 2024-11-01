import React, { useEffect, useState } from "react";
import AccessibleAlert from "./AccessibleAlert";

const GameHistory = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [games, setGames] = useState([]);
  const [confimationMsg, setConfirmationMsg] = useState("");
  const [searchedGameId, setSearchedGameId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [gameMoveList, setGameMoveList] = useState([]);

  const handleConfirmationChange = (event) => {
    setConfirmationMsg(event.target.value);
  };

  const handleSearchedGameIdChange = (event) => {
    setSearchedGameId(event.target.value);
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
      setAlertMessage(
        "Wrong confirmation message! Type 'confirm clear' to clear game history"
      );
    } else {
      try {
        const response = await fetch("http://localhost:8800/api/gamesclear", {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error clearing game history:", error);
      }
      setAlertMessage("Game history cleared");
      setConfirmationMsg("");
    }
  };

  const getRowCol = (index) => {
    const col = (index % 3) + 1;
    const row = Math.floor(index / 3) + 1;
    return `row ${row} column ${col}`;
  };

  const getGameMoves = async () => {
    try {
      const response = await fetch(
        `http://localhost:8800/api/moves/${searchedGameId}`
      );
      const moves = await response.json();
      if (!response.ok) {
        setAlertMessage(moves.error);
        setGameMoveList([]);
        return;
      }

      const parsedMoves = moves.map((move, index) => {
        const playerSymbol = move.player === "O" ? "cross" : "circle";
        return `Move ${index} ${playerSymbol} placed in ${getRowCol(
          move.position
        )}`;
      });

      setGameMoveList(parsedMoves);
      setAlertMessage(`Moves for game ${searchedGameId} has been listed below`);
    } catch (error) {
      console.error("Error fetching moves:", error);
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
      <h1 id="history-title">Game History Manager</h1>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by player name"
      />

      {/* clear history */}
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
          placeholder="Type 'confirm clear'  and hit enter to clear finished games"
        />
      </form>

      {/* get game moves */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          getGameMoves();
        }}
      >
        <input
          type="text"
          value={searchedGameId}
          onChange={handleSearchedGameIdChange}
          placeholder="Enter a game's id here to view it's move history"
        />
      </form>
      <div className="game-moves-list">
        {gameMoveList.length === 0 ? (
          <p>Search game moves above</p>
        ) : (
          <>
            <ul className="move-list">
              {gameMoveList.map((move, index) => (
                <li key={index}>{move}</li>
              ))}
            </ul>
            <p>End of game move list</p>
          </>
        )}
      </div>

      <h2>Game History Table</h2>
      {games.length === 0 ? (
        <p>No games found.</p>
      ) : (
        <div role="region" aria-labelledby="history-title">
          <table className="gameHistoryTable">
            <tbody>
              {filteredGames.map((game) => (
                <tr key={game.game_id} tabIndex="0">
                  <td>Game number {game.game_id}</td>
                  <td>Player 1 {game.player1 ? game.player1 : "not joined"}</td>
                  <td>Player 2 {game.player2 ? game.player2 : "not joined"}</td>
                  <td>
                    Winner{" "}
                    {game.winner
                      ? game.winner
                      : game.status === "ended"
                      ? "Tie"
                      : "Ongoing"}
                  </td>
                  <td>
                    Game created{" "}
                    {new Date(game.created_at).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
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
