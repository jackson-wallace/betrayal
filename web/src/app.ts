import { Game, GameState } from "./objects/game.js";
import { initFavicon } from "./utils/favicon.js";
import { getPlayerID } from "./utils/player.js";
import {
  SendInitializeGameEvent,
  SendJoinGameEvent,
  SendStartGameEvent,
  WSDriver,
} from "./ws-driver.js";

export enum GameStatus {
  StartOrJoin = "startOrJoin",
  StartGame = "startGame",
  JoinGame = "joinGame",
  Waiting = "waiting",
  InProgress = "inProgress",
}

type AppState = {
  currentState: GameStatus;
  game: Game | null;
};

export const appState: AppState = {
  currentState: GameStatus.StartOrJoin,
  game: null,
};

const playerID = getPlayerID();

initFavicon();

const ws = new WSDriver();
ws.connectWebsocket();

function renderStartOrJoin(appState: AppState, ws: WSDriver, playerID: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
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
    appState.currentState = GameStatus.StartGame;
    renderApp(appState, ws, playerID);
  });

  document.getElementById("join-game")!.addEventListener("click", () => {
    appState.currentState = GameStatus.JoinGame;
    renderApp(appState, ws, playerID);
  });
}

function renderStartGame(appState: AppState, ws: WSDriver, playerID: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <h3 id="join-code">Join code: ____</h3>
      <p id="players-in-lobby">0 player(s) in the lobby</p>
      <br />
      <button id="start-btn">Start game</button>
    </div>
  `;

  document.getElementById("start-btn")!.addEventListener("click", () => {
    const outgoingEvent = new SendStartGameEvent(playerID);
    ws.sendEvent("send_start_game", outgoingEvent);
    appState.currentState = GameStatus.InProgress;
    renderApp(appState, ws, playerID);
  });
}

function renderJoinGame(appState: AppState, ws: WSDriver, playerID: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
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
      const outgoingEvent = new SendJoinGameEvent(playerID, code.toLowerCase());
      ws.sendEvent("send_join_game", outgoingEvent);

      appState.currentState = GameStatus.Waiting;
      renderApp(appState, ws, playerID);
    } else {
      alert("Please enter a valid code.");
    }
  });
}

function renderWaiting() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <h3>Waiting for game to start...</h3>
    </div>
  `;
}

export function renderInProgress(
  appState: AppState,
  ws: WSDriver,
  gameState: GameState,
) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <canvas id="board">Game Board</canvas>
  `;

  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;

  ctx.scale(devicePixelRatio, devicePixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  appState.game = new Game(canvas, ws, playerID, gameState);

  addEventListener("resize", () => {
    if (appState.game) {
      appState.game.display.handleResize();
    }
  });

  addEventListener("click", (event) => {
    if (appState.game) {
      appState.game.handleClick(event);
    }
  });
}

function renderApp(appState: AppState, ws: WSDriver, playerID: string) {
  switch (appState.currentState) {
    case GameStatus.StartOrJoin:
      renderStartOrJoin(appState, ws, playerID);
      break;
    case GameStatus.StartGame:
      renderStartGame(appState, ws, playerID);
      break;
    case GameStatus.JoinGame:
      renderJoinGame(appState, ws, playerID);
      break;
    case GameStatus.Waiting:
      renderWaiting();
      break;
    case GameStatus.InProgress:
      // renderInProgress(appState, ws);
      break;
  }
}

renderApp(appState, ws, playerID);

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
