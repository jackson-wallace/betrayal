import { Game, GameState } from "./game/game.js";
import { initFavicon } from "./utils/favicon.js";
import { getPlayerID } from "./utils/storage.js";
import { WSDriver } from "./ws-driver.js";
import {
  SendInitializeGameEvent,
  SendJoinGameEvent,
  SendStartGameEvent,
} from "./events.js";
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

history.replaceState(appState, "");

const playerID = getPlayerID();

initFavicon();

const ws = new WSDriver();
ws.connectWebsocket();

function renderStartOrJoin(appState: AppState, ws: WSDriver, playerID: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <h1>Betrayal</h1>
      <button class="custom-button" id="new-game">New Game</button>
      <br />
      <button class="custom-button" id="join-game">Join Game</button>
    </div>
  `;

  document.getElementById("new-game")!.addEventListener("click", () => {
    const outgoingEvent = new SendInitializeGameEvent(playerID);
    ws.sendEvent("send_initialize_game", outgoingEvent);
    appState.currentState = GameStatus.StartGame;
    history.pushState(appState, "");
    renderApp(appState, ws, playerID);
  });

  document.getElementById("join-game")!.addEventListener("click", () => {
    appState.currentState = GameStatus.JoinGame;
    history.pushState(appState, "");
    renderApp(appState, ws, playerID);
  });
}

function renderStartGame(appState: AppState, ws: WSDriver, playerID: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <h3 id="join-code">Join code: ______</h3>
      <p id="players-in-lobby">0 player(s) in the lobby</p>
      <br />
      <button class="custom-button" id="start-btn">Start game</button>
    </div>
  `;

  document.getElementById("start-btn")!.addEventListener("click", () => {
    const outgoingEvent = new SendStartGameEvent(playerID);
    ws.sendEvent("send_start_game", outgoingEvent);
    appState.currentState = GameStatus.InProgress;
    renderApp(appState, ws, playerID);
  });
}

function renderJoinGame(ws: WSDriver, playerID: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <label>Enter join code</label>
      <br />
      <input class="join-input" id="join-code" type="text" autofocus></input>
      <br />
      <button class="custom-button" id="join-btn">Join</button>
    </div>
  `;

  document.getElementById("join-btn")!.addEventListener("click", () => {
    const element = document.getElementById("join-code") as HTMLInputElement;
    const code = element.value;
    if (code) {
      const outgoingEvent = new SendJoinGameEvent(playerID, code.toLowerCase());
      ws.sendEvent("send_join_game", outgoingEvent);
      element.value = "";
    } else {
      toast("Please enter a valid code");
    }
  });
}

export function renderWaiting() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <h3>Waiting for game to start...</h3>
      <p id="players-in-lobby">0 player(s) in the lobby</p>
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
    <div id="game-container">
      <canvas id="board">Game Board</canvas>
      <div id="input-form">
        <div class="hud">
          <p id="action-points">Action Points: 1</p>
          <p id="color">██████</p>
          <p id="clock">01:00</p>
        </div>
        <form>
          <button class="custom-button" type="button" id="move-btn">Move</button>
          <button class="custom-button" type="button" id="shoot-btn">Shoot</button>
          <button class="custom-button" type="button" id="increase-range-btn">Increase Range</button>
          <button class="custom-button" type="button" id="give-ap-btn">Give Action Point</button>
        </form>
      </div>
    </div>
  `;

  const canvas = document.getElementById("board") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  ctx.scale(devicePixelRatio, devicePixelRatio);

  appState.game = new Game(canvas, ws, playerID, gameState);

  addEventListener("resize", () => {
    if (appState.game) {
      appState.game.display.handleResize();
    }
  });

  document.getElementById("board")!.addEventListener("click", (event) => {
    if (appState.game) {
      appState.game.handleBoardClick(event);
    }
  });

  document.getElementById("move-btn")!.addEventListener("click", () => {
    if (appState.game) {
      appState.game.handlePlayerMove();
    }
  });

  document.getElementById("shoot-btn")!.addEventListener("click", () => {
    if (appState.game) {
      appState.game.handlePlayerShoot();
    }
  });

  document
    .getElementById("increase-range-btn")!
    .addEventListener("click", () => {
      if (appState.game) {
        appState.game.handlePlayerIncreaseRange();
      }
    });

  document.getElementById("give-ap-btn")!.addEventListener("click", () => {
    if (appState.game) {
      appState.game.handlePlayerGiveActionPoint();
    }
  });
}

export function renderPlayerWin(playerColor: string) {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <h1> <span id="player-color">██████</span> Wins</h1>
      <br />
      <button class="custom-button" id="exit">Exit</button>
    </div>
  `;

  const colorElement = document.getElementById("player-color");
  if (colorElement) {
    colorElement.style.color = playerColor;
  }

  document.getElementById("exit")!.addEventListener("click", () => {
    appState.game = null;
    appState.currentState = GameStatus.StartOrJoin;
    renderApp(appState, ws, playerID);
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
      renderJoinGame(ws, playerID);
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

window.addEventListener("popstate", (event) => {
  if (event.state) {
    renderApp(event.state, ws, playerID);

    if (event.state.currentState === GameStatus.StartGame) {
      const outgoingEvent = new SendInitializeGameEvent(playerID);
      ws.sendEvent("send_initialize_game", outgoingEvent);
    }
  }
});

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

export function setActionPointsHtml(actionPoints: string) {
  const element = document.getElementById("action-points");
  if (element) {
    element.innerHTML = `Action Points: ${actionPoints}`;
  }
}

export function setClockHtml(time: number) {
  const element = document.getElementById("clock");
  if (element) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    element.innerHTML = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

export function toast(message: string) {
  const element = document.getElementById("toast");
  if (element) {
    element.innerHTML = message;
    element.className = "show";
    setTimeout(function () {
      element.className = element.className.replace("show", "");
      element.innerHTML = "";
    }, 2000);
  }
}

export function setBlockColor(color: string): void {
  const colorElement = document.getElementById("color");
  if (colorElement) {
    colorElement.style.color = color;
  } else {
    console.error("Element with id 'color' not found.");
  }
}
