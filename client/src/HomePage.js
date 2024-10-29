// src/HomePage.js
import React, { useState } from "react";
import { useHistory } from "react-router-dom";

const HomePage = () => {
  const [name, setName] = useState("");
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim()) {
      try {
        const response = await fetch(
          "http://localhost:8800/api/players/register",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          }
        );

        if (response.ok) {
          history.push("/app"); // Redirect to App.js
        } else {
          console.error("Failed to register player");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="HomePage">
      <h1>Welcome to Inclusive Tic Tac Toe</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter your name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <button type="submit">Start Game</button>
      </form>
    </div>
  );
};

export default HomePage;
