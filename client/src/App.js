import "./App.css";
import React, { useEffect, useState } from "react";
import GameHistory from "./GameHistory"; // Adjust the path as necessary

function App() {
  const [games, setGames] = useState([]);
  const [selectedGameName, setSelectedGameName] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerOne, setIsPlayerOne] = useState(true); // true ==Player 1, false == Player 2
  const [winner, setWinner] = useState(null);
  const handlePlayerNameChange = (event) => {
    setPlayerName(event.target.value);
  };
  const [isPlayerTurn, setIsPlayerTurn] = useState(null);

  const savePlayerName = async () => {
    if (!playerName) return;

    try {
      const response = await fetch("http://localhost:8800/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName }),
      });

      const data = await response.json();
      if (response.ok) {
        setPlayerId(data.playerId);
        console.log("Player added:", data.playerName);
      } else {
        console.error("Failed to save player name:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchBoardState = async () => {
    // console.log("fethcing board");
    if (!selectedGameId) return;
    try {
      const response = await fetch(
        `http://localhost:8800/api/games/${selectedGameId}/moves`
      );
      const data = await response.json();
      // console.log(data);
      if (response.ok) {
        if (data.winner) {
          setWinner(data.winner);
        }
        setBoard(data.board);
        if (isPlayerOne) {
          setIsPlayerTurn(data.playerTurn === 1);
        } else {
          setIsPlayerTurn(data.playerTurn === 2);
        }
      } else {
        console.error("Failed to fetch board state:", data);
      }
    } catch (error) {
      console.error("Error fetching board state:", error);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch("http://localhost:8800/api/games");
      const data = await response.json();
      if (response.ok) {
        const filteredGames = data.filter(
          (game) =>
            game.status === "ongoing" &&
            (game.player1 === null ||
              game.player2 === null ||
              game.player1 === playerName ||
              game.player2 === playerName)
        );
        setGames(filteredGames);
      } else {
        console.error("Failed to fetch games:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    const updateFetches = async () => {
      await fetchGames();
      await fetchBoardState();
    };

    updateFetches();

    const intervalId = setInterval(updateFetches, 1000);

    return () => clearInterval(intervalId);
  }, [selectedGameId]);

  const handleClick = async (index) => {
    if (board[index] || winner || !isPlayerTurn) return;

    const playerSymbol = isPlayerOne ? "O" : "X";
    const newBoard = [...board];
    newBoard[index] = playerSymbol;

    try {
      const response = await fetch("http://localhost:8800/api/moves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: selectedGameId,
          player: playerSymbol,
          position: index,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        var newwinner = data.winner;
        if (newwinner) {
          setWinner(data.winner);
          try {
            const response = await fetch(
              `http://localhost:8800/api/games/${selectedGameId}/winner`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ winner: playerName }),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to record winner: ${response.statusText}`
              );
            }

            const data = await response.json();
            console.log("Winner recorded:", data);
          } catch (error) {
            console.error("Error recording winner:", error.message);
          }
        }
        if (data.board) {
          console.log(data.board);
          setBoard(data.board);
          console.log(board);
        }
      } else {
        console.error("Failed to save move:", data);
      }
    } catch (error) {
      console.error("Error recording move:", error);
    }
  };

  const createGame = async () => {
    try {
      console.log("creating game");
      const response = await fetch("http://localhost:8800/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_name: "Game Session " + (games.length + 1),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setGames((prevGames) => [...prevGames, data]);
      } else {
        console.error("Failed to create game:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const joinGame = async (game_name, gameId) => {
    try {
      const response = await fetch(
        `http://localhost:8800/api/games/${gameId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerName: playerName }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedGameName(game_name); // Update the selected game
        setSelectedGameId(gameId);
        setIsPlayerOne(data.player === "player1");
      } else {
        console.error("Failed to join game:", await response.json());
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteGame = async (gameId) => {
    try {
      const response = await fetch(
        `http://localhost:8800/api/games/${gameId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete game");
      }

      // Fetch the updated list of games
      fetchGames();
    } catch (error) {
      console.error("Error deleting game:", error.message);
    }
  };
  // const [games, setGames] = useSta
  const quitCurrentSession = async () => {
    setSelectedGameId(null);
    setSelectedGameName("");
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(false);
    setWinner(null);
  };

  return (
    <div className="App">
      <div></div>

      <h1>Inclusive Tic Tac Toe</h1>
      <h2>{selectedGameName}</h2>
      {selectedGameName && <h2>playing as {isPlayerOne ? "O" : "X"}</h2>}
      {winner && <h2>Winner: {winner}</h2>}
      <div className="container">
        <div className="sidebar">
          {!playerId && (
            <div>
              <input
                type="text"
                value={playerName}
                onChange={handlePlayerNameChange}
                placeholder="Enter your name"
              />
              <button onClick={savePlayerName}>Save Name</button>
            </div>
          )}
          {playerId && <div>{playerName}</div>}
          {playerId && !selectedGameName && (
            <>
              <button className="connectButton">Connect</button>
              <button className="createButton" onClick={createGame}>
                Create
              </button>
              <label>Available Games</label>
              <ul>
                {games.length === 0 ? (
                  <li>No games available</li>
                ) : (
                  games.map((game) => (
                    <li key={game.game_id}>
                      <button
                        onClick={() => joinGame(game.game_name, game.game_id)}
                      >
                        Game {game.game_id}
                      </button>
                      <button onClick={() => deleteGame(game.game_id)}>
                        Delete
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}

          {playerId && selectedGameName && (
            <button className="joinButton" onClick={() => quitCurrentSession()}>
              Quit current session
            </button>
          )}
        </div>
        <div className="mainbar">
          <div className="board">
            {board.map((cell, index) => (
              <div
                key={index}
                className="cell"
                onClick={() => handleClick(index)}
              >
                {cell}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="GameHistory">
        <GameHistory />
      </div>
    </div>
  );
}

export default App;
