import "./App.css";
import React, { useEffect, useState } from "react";
import GameHistory from "./GameHistory";
import AccessibleAlert from "./AccessibleAlert";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [playerName, setPlayerName] = useState(
    localStorage.getItem("playerName") || null
  );
  const [playerId, setPlayerId] = useState(
    localStorage.getItem("playerId") || null
  );
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
        localStorage.setItem("playerId", data.playerId);
        localStorage.setItem("playerName", playerName);
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
      `http://localhost:8800/api/games/${selectedGameId}/currentBoardState`
    );

    const data = await response.json();
    if (data.winner) {
      setWinner(data.winner);
      setIsPlayerTurn(false);
    }
    setBoard(data.board);
    if (data.latestMovePlayer != null && data.latestMovePosition != null) {
      const latestMovePlayerSymbol =
        data.latestMovePlayer.toLowerCase() == "o" ? "circle" : "cross";
      setLatestMove(
        "Latest move : " +
          latestMovePlayerSymbol +
          " placed in " +
          getRowCol(data.latestMovePosition)
      );
    }
    if (
      (isPlayerOne && data.playerTurn == 1) ||
      (!isPlayerOne && data.playerTurn == 2)
    ) {
      setIsPlayerTurn(true);
    } else {
      setIsPlayerTurn(false);
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
    if (
      latestMove &&
      latestMove != "check here for the latest move made in a game"
    ) {
      setAlertMessage(latestMove);
    }
  }, [latestMove]);

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
      if (!response.ok) {
        setAlertMessage(data.error);
      }

      var newwinner = data.winner;
      if (newwinner) {
        if (newwinner == "Tie") {
          setAlertMessage("Game has ended in a tie");
        } else {
          setAlertMessage("Congratulations, you have won the game");
        }
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
      setGames((prevGames) => [...prevGames, data]);
      setAlertMessage("Game number" + data.game_id + "created");
    } catch (error) {
      setAlertMessage("Error:", error);
    }
  };

  const joinGame = async (gameId) => {
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
      <p>
        This application consists of 3 main components : Game manager, Game
        player, and game history section
      </p>
      <div className="container">
        <div className="sidebar">
          <h3 className="informationSection" role="Information Section">
            Game manager, use this section to create, join and quit games
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
                  <p>No games available, navigate backward to create a game</p>
                ) : (
                  games.map((game) => (
                    <li key={game.game_id}>
                      <button onClick={() => joinGame(game.game_id)}>
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
            Game player, use this section to keep track of your current game
          </h3>
          {selectedGameId && (
            <div>
              <p>{"Game " + selectedGameId}</p>
              <p>Playing as {isPlayerOne ? "circle" : "cross"}</p>
              <p role="latest move">{latestMove}</p>
              {winner && (
                <p>Winner: {winner == "O" ? "circle" : "cross"}</p>
              )}{" "}
              <p>Make moves using the board below</p>
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
