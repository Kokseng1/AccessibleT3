import "./App.css";
import React, { useEffect, useState } from "react";
import GameHistory from "./GameHistory";
import AccessibleAlert from "./AccessibleAlert";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGameName, setSelectedGameName] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerOne, setIsPlayerOne] = useState(true);
  const [winner, setWinner] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(null);

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
        console.log("Player added:", data.playerName);
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
    try {
      const response = await fetch(
        `http://localhost:8800/api/games/${selectedGameId}/moves`
      );
      const data = await response.json();
      // console.log(data);
      if (response.ok) {
        if (data.winner) {
          setWinner(data.winner);
          setIsPlayerTurn(false);
        }
        
        setBoard(data.board);
        if (
          (isPlayerOne && data.playerTurn == 1) ||
          (!isPlayerOne && data.playerTurn == 2)
        ) {
          if (!isPlayerTurn) {
            console.log("alert its not ur turn");
            setAlertMessage("it is now your turn");
          }
          setIsPlayerTurn(true);
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
    if (board[index]) {
      setAlertMessage("This space is already taken by" + board[index]);
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
          setAlertMessage("Congratulations, you have won the game");
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
      setAlertMessage("Error recording move:" + error);
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
        console.log("alert message game number X created");
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
        const playerSymbol = data.player == "player1" ? "Circle" : "Cross";
        console.log("setalert messgae you have joined");
        setAlertMessage(
          "You have joined game" + gameId + ", playing as " + playerSymbol
        );
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

  const getRowCol = (index) => {
    var col = (index % 3) + 1;
    const row = Math.floor(index / 3) + 1;
    return `row ${row} column ${col}`;
  };

  return (
    <div className="App">
      <div></div>

      <h1>Inclusive Tic Tac Toe</h1>
      {selectedGameName && <h2>{selectedGameName}</h2>}
      {selectedGameName && <h2>playing as {isPlayerOne ? "O" : "X"}</h2>}
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
          {playerId && !selectedGameName && (
            <>
              <button className="createButton" onClick={createGame}>
                Create game
              </button>
              <label id="gamesLabel">List of Available Games</label>
              <ul>
                {games.length === 0 ? (
                  <li>No games available</li>
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

          {playerId && selectedGameName && (
            <button className="joinButton" onClick={() => quitCurrentSession()}>
              Quit current session
            </button>
          )}
        </div>
        <div className="mainbar">
          <h3 className="informationSection">
            mainbar, use the grid below to keep track of your current game
          </h3>
          {selectedGameName && (
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
          )}
          {!selectedGameName && (
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
