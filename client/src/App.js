import "./App.css";
import React, { useEffect, useState } from "react";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGameName, setSelectedGameName] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(localStorage.getItem("playerId"));
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerOne, setIsPlayerOne] = useState(true); // true ==Player 1, false == Player 2
  const [winner, setWinner] = useState(null);
  const handlePlayerNameChange = (event) => {
    setPlayerName(event.target.value);
  };
  const [isPlayerTurn, setIsPlayerTurn] = useState(null);

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
        // console.log(isPlayerOne);
        if (data.length % 2 === 0) {
          // console.log("even");
          setIsPlayerTurn(isPlayerOne);
        } else {
          // console.log("odd");
          setIsPlayerTurn(!isPlayerOne);
        }
        // console.log(data.length);
        // console.log(isPlayerTurn);
        const newBoard = Array(9).fill(null);
        data.forEach((move) => {
          newBoard[move.position] = move.player;
        });
        setBoard(newBoard);
        const gameWinner = checkWinner(newBoard);
        if (gameWinner) setWinner(gameWinner);
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
            (game.player1 == null || game.player2 == null)
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
      // Fetch games and board state
      await fetchGames();
      await fetchBoardState();
    };

    updateFetches(); // Initial fetch

    const intervalId = setInterval(updateFetches, 1000); // Fetch every second

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [selectedGameId]); // Add selectedGameId to dependencies if necessary

  const handleClick = async (index) => {
    if (board[index] || winner || !isPlayerTurn) return; // Ignore click if cell is filled, game has ended, or not player turn

    const playerSymbol = isPlayerOne ? "O" : "X";
    const newBoard = [...board];

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    }

    // Record move in database
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

      if (!response.ok) {
        console.error("Failed to save move:", await response.json());
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
          body: JSON.stringify({ playerId: playerId }),
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

  return (
    <div className="App">
      <div></div>

      <h1>Inclusive Tic Tac Toe</h1>
      <h2>{selectedGameName}</h2>
      {selectedGameName && <h2>playing as {isPlayerOne ? "O" : "X"}</h2>}
      {winner && <h2>Winner: {winner}</h2>}
      <div className="container">
        <div className="sidebar">
          <input
            type="text"
            value={playerName}
            onChange={handlePlayerNameChange}
            placeholder="Enter your name"
          />
          <button onClick={savePlayerName}>Save Name</button>

          {playerName && !selectedGameName && (
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
                        {game.game_name}
                      </button>
                      <button onClick={() => deleteGame(game.game_id)}>
                        Delete
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <button className="joinButton">Join</button>
            </>
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
    </div>
  );
}

export default App;
