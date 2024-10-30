import "./App.css";
import React, { useEffect, useState } from "react";
import GameHistory from "./GameHistory";
import AccessibleAlert from "./AccessibleAlert";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerOne, setIsPlayerOne] = useState(true);
  const [winner, setWinner] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(null);
  const [latestMove, setLatestMove] = useState(
    "check here for the latest move made in a game"
  );

  const handlePlayerNameChange = (event) => {
    setPlayerName(event.target.value);
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
        setAlertMessage("player created with name " + data.playerName);
      } else {
        console.error("Failed to save player name:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchBoardState = async () => {
    if (!selectedGameId) return;

    const response = await fetch(
      `http://localhost:8800/api/games/${selectedGameId}/moves`
    );

    const data = await response.json();
    if (data.winner) {
      setWinner(data.winner);
      setIsPlayerTurn(false);
    }
    compareBoardState(data.board); //update latest move
    setBoard(data.board);

    if (
      (isPlayerOne && data.playerTurn == 1) ||
      (!isPlayerOne && data.playerTurn == 2)
    ) {
      setIsPlayerTurn(true);
    } else {
      setIsPlayerTurn(false);
    }
  };

  function compareBoardState(newBoard) {
    for (let i = 0; i < newBoard.length; i++) {
      if (newBoard[i] !== board[i]) {
        const playerSymbol = newBoard[i] == "O" ? "circle" : "cross";
        setAlertMessage(playerSymbol + " has been placed in " + getRowCol(i));
        setLatestMove(
          "Latest move : " + playerSymbol + " placed in " + getRowCol(i)
        );
        break;
      }
    }
  }

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
    if (board[index]) {
      const playerSymbol = board[index] == "O" ? "circle" : "cross";
      setAlertMessage("This space is already taken by " + playerSymbol);
      return;
    }

    if (winner) {
      const winnerSymbol = winner == "O" ? "circle" : "cross";
      setAlertMessage(
        "This game has ended " + winnerSymbol + " has won the game"
      );
      return;
    }
    if (!isPlayerTurn) {
      setAlertMessage("It is currently not your turn");
      return;
    }

    const playerSymbol = isPlayerOne ? "O" : "X";
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

      var newwinner = data.winner;
      if (newwinner) {
        setAlertMessage("Congratulations, you have won the game");
        setWinner(data.winner);
        await fetch(
          `http://localhost:8800/api/games/${selectedGameId}/winner`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ winner: playerName }),
          }
        );
      }

      if (data.board) {
        setBoard(data.board);
      }
    } catch (error) {
      setAlertMessage("Error recording move:" + error);
    }
  };

  const createGame = async () => {
    try {
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
        setAlertMessage("Game number" + data.game_id + "created");
      } else {
        console.error("Failed to create game:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const joinGame = async (game_name, gameId) => {
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
      setSelectedGameId(gameId);
      setIsPlayerOne(data.player === "player1");
      const playerSymbol = data.player == "player1" ? "Circle" : "Cross";
      setAlertMessage(
        "You have joined game" + gameId + ", playing as " + playerSymbol
      );
    } else {
      setAlertMessage("Failed to join game:", await response.json());
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
      setAlertMessage("Game " + gameId + "has been deleted");
      fetchGames();
    } catch (error) {
      setAlertMessage("Error deleting game:", error.message);
    }
  };

  const quitCurrentSession = async () => {
    setSelectedGameId(null);
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(false);
    setWinner(null);
    setLatestMove("check here for the latest move made in a game");
    setAlertMessage(
      "You have quit the game, create or join another game to play again"
    );
  };

  const getRowCol = (index) => {
    const col = (index % 3) + 1;
    const row = Math.floor(index / 3) + 1;
    return `row ${row} column ${col}`;
  };

  return (
    <div className="App">
      <div></div>

      <h1>Inclusive Tic Tac Toe</h1>

      {winner && <h2>Winner: {winner}</h2>}
      <div className="container">
        <div className="sidebar">
          <h3 className="informationSection" role="Information Section">
            side bar, navigate this section vertically to create, join and quit
            games
          </h3>
          {!playerId && (
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  savePlayerName();
                }}
              >
                <input
                  type="text"
                  value={playerName}
                  onChange={handlePlayerNameChange}
                  placeholder="Enter your name"
                />
                <button type="submit">Save Name</button>
              </form>
            </div>
          )}
          {playerId && <div>Name {playerName}</div>}
          {playerId && !selectedGameId && (
            <>
              <button className="createButton" onClick={createGame}>
                Create game
              </button>
              <label id="gamesLabel">List of Available Games</label>
              <ul>
                {games.length === 0 ? (
                  <li>
                    No games available, navigate backward to create a game
                  </li>
                ) : (
                  games.map((game) => (
                    <li key={game.game_id}>
                      <button
                        onClick={() => joinGame(game.game_name, game.game_id)}
                      >
                        Enter Game {game.game_id}
                      </button>
                      <button onClick={() => deleteGame(game.game_id)}>
                        Delete game {game.game_id}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}

          {playerId && selectedGameId && (
            <button className="joinButton" onClick={() => quitCurrentSession()}>
              Quit current session
            </button>
          )}
        </div>
        <div className="mainbar">
          <h3 className="informationSection">
            mainbar, use the grid below to keep track of your current game
          </h3>
          {selectedGameId && (
            <div>
              <p>Game {selectedGameId}</p>
              <p>Playing as {isPlayerOne ? "O" : "X"}</p>
              <p role="latest move">{latestMove}</p>
              <div className="board">
                {board.map((cell, index) => (
                  <div key={index} className="cell">
                    <button
                      className="joinButton"
                      onClick={() => handleClick(index)}
                    >
                      {cell == "X"
                        ? "cross in "
                        : cell == "O"
                        ? "circle in "
                        : "Place in "}
                      {getRowCol(index)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedGameId && (
            <p role="prompt to start a game">
              You are not in a game currently, join a game using the sidebar to
              start playing
            </p>
          )}
        </div>
      </div>
      <div className="GameHistory">
        <GameHistory />
      </div>
      <AccessibleAlert message={alertMessage} />
    </div>
  );
}

export default App;
