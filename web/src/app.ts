import { Game } from "./objects/game.js";
import { initFavicon } from "./utils/favicon.js";
import { getPlayerID } from "./utils/player.js";
import { SendInitializeGameEvent, WSDriver } from "./ws-driver.js";

enum GameState {
  StartOrJoin = "startOrJoin",
  StartGame = "startGame",
  JoinGame = "joinGame",
  Waiting = "waiting",
  InProgress = "inProgress",
}

let currentState: GameState = GameState.StartOrJoin;

const playerID = getPlayerID();

initFavicon();

const ws = new WSDriver();
ws.connectWebsocket();

function main() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  switch (currentState) {
    case GameState.StartOrJoin:
      app.innerHTML = `
        <div class="center">
          <h1>War Game</h1>
          <button id="new-game">New Game</button>
          <br />
          <button id="join-game">Join Game</button>
        </div>
      `;

      document.getElementById("new-game")!.addEventListener("click", () => {
        const outgoingEvent = new SendInitializeGameEvent(playerID);
        ws.sendEvent("send_initialize_game", outgoingEvent);
        currentState = GameState.StartGame;
        main();
      });

      document.getElementById("join-game")!.addEventListener("click", () => {
        currentState = GameState.JoinGame;
        main();
      });

      break;

    case GameState.StartGame:
      app.innerHTML = `
        <div class="center">
          <h3 id="join-code">Join code: ____</h3>
          <p id="players-in-lobby">0 player(s) in the lobby</p>
          <br />
          <button id="start-btn">Start game</button>
        </div>
      `;

      document.getElementById("start-btn")!.addEventListener("click", () => {
        currentState = GameState.InProgress;
        main();
      });

      break;

    case GameState.JoinGame:
      app.innerHTML = `
        <div class="center">
          <label>Enter join code</label>
          <br />
          <input id="join-code" type="text"></input>
          <br />
          <button id="join-btn">Join</button>
        </div>
      `;

      document.getElementById("join-btn")!.addEventListener("click", () => {
        const code = (document.getElementById("join-code") as HTMLInputElement)
          .value;
        if (code) {
          currentState = GameState.Waiting;
          main();
        } else {
          alert("Please enter a valid code.");
        }
      });

      break;

    case GameState.Waiting:
      app.innerHTML = `
        <div class="center">
          <h3>Waiting for game to start...</h3>
        </div>
      `;

      break;

    case GameState.InProgress:
      app.innerHTML = `
        <div>
          <canvas id="board">Game Board</canvas>
          <div class="game-info">
            <h3>Game in Progress</h3>
            <p>Score: <span id="score">0</span></p>
            <button id="quit-game">Quit Game</button>
          </div>
        </div>
      `;

      const canvas = document.getElementById("board") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;

      ctx.scale(devicePixelRatio, devicePixelRatio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      const game = new Game(canvas, ws);

      addEventListener("resize", () => {
        game.display.handleResize();
      });

      addEventListener("click", (event) => {
        game.handleClick(event);
      });

      document.getElementById("quit-game")!.addEventListener("click", () => {
        if (confirm("Are you sure you want to quit the game?")) {
          currentState = GameState.StartOrJoin;
          main();
        }
      });
      break;
  }
}

main();

export function setJoinCodeHtml(joinCode: string) {
  const element = document.getElementById("join-code");
  if (element) {
    element.innerHTML = `Join Code: ${joinCode.toUpperCase()}`;
  }
}

export function setPlayersInLobbyHtml(playerCount: number) {
  const element = document.getElementById("players-in-lobby");

  if (element) {
    element.innerHTML = `${playerCount} player(s) in the lobby`;
  }
}
