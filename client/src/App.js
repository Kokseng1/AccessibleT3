import "./App.css";
import React, { useEffect, useState } from "react";

function App() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const getPlayerId = () => {
    const storedId = localStorage.getItem("playerId");
    if (storedId) {
      return storedId;
    } else {
      const newId = generatePlayerId();
      localStorage.setItem("playerId", newId);
      return newId;
    }
  };

  const generatePlayerId = () => {
    console.log("generating new player Id");
    const existingIds = JSON.parse(sessionStorage.getItem("playerIds")) || [];
    let playerId = 0;
    while (existingIds.includes(playerId)) {
      playerId++;
    }

    existingIds.push(playerId);
    sessionStorage.setItem("playerIds", JSON.stringify(existingIds));
    return playerId;
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
