import "./App.css";
import React, { useEffect, useState } from "react";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(localStorage.getItem("playerId"));

  const getPlayerId = () => {
    if (playerId) {
      return playerId;
    }
    return null;
  };

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
        localStorage.setItem("playerId", data.playerId);
        setPlayerId(data.playerId);
        console.log("Player added:", data.playerName);
      } else {
        console.error("Failed to save player name:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const fetchGames = async () => {
    try {
      const response = await fetch("http://localhost:8800/api/games");
      const data = await response.json();
      if (response.ok) {
        setGames(data); // Assuming your API returns an array of games
      } else {
        console.error("Failed to fetch games:", data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

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

  const joinGame = async (gameId) => {
    // console.log(gameId);
    try {
      const response = await fetch(
        `http://localhost:8800/api/games/${gameId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ playerId: getPlayerId() }), // Assuming player ID is fixed for simplicity
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data.message); // Successfully joined
        setSelectedGame(gameId); // Update the selected game
      } else {
        console.error("Failed to join game:", await response.json());
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="App">
      <head>
        <div></div>
        <link rel="stylesheet" href="style.css" />
      </head>

      <body>
        <h1>Inclusive tic tac toe</h1>
        <div class="container">
          <div class="sidebar">
            <input
              type="text"
              value={playerName}
              onChange={handlePlayerNameChange}
              placeholder="Enter your name"
            />
            <button onClick={savePlayerName}>Save Name</button>
            <button class="connectButton">Connect</button>
            <button className="createButton" onClick={createGame}>
              Create
            </button>
            <label for=""> Available Games</label>
            <ul>
              {games.length === 0 ? (
                <li>No games available</li>
              ) : (
                games.map((game, index) => (
                  <li
                    key={game.game_name}
                    onClick={() => joinGame(game.game_id)}
                  >
                    {game.game_name}
                  </li>
                ))
              )}
            </ul>
            <button class="joinButton">Join</button>
          </div>
          <div class="mainbar">
            <div class="board">
              <div class="cell cross"></div>
              <div class="cell circle"></div>
              <div class="cell"></div>
              <div class="cell"></div>
              <div class="cell"></div>
              <div class="cell"></div>
              <div class="cell"></div>
              <div class="cell"></div>
              <div class="cell"></div>
            </div>
          </div>
        </div>
      </body>
    </div>
  );
}

export default App;
