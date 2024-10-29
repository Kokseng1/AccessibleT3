import logo from "./logo.svg";
import "./App.css";

function App() {
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
            <button class="createButton">Create</button>
            <label for=""> Available Games</label>
            <ul>
              <li>no games</li>
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
