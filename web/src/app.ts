import { Game } from "./game/game.js";
import { initFavicon } from "./utils/favicon.js";
import { getPlayerID } from "./utils/storage.js";
import { WSDriver } from "./ws-driver.js";
import { SendInitializeGameEvent } from "./events.js";
import { renderStartOrJoin } from "./pages/start-or-join.js";
import { renderStartGame } from "./pages/start-game.js";
import { renderJoinGame } from "./pages/join-game.js";
import { renderWaiting } from "./pages/waiting.js";
import { renderRules } from "./pages/rules.js";

initFavicon();

export enum GameStatus {
  StartOrJoin = "startOrJoin",
  StartGame = "startGame",
  JoinGame = "joinGame",
  Rules = "rules",
  Waiting = "waiting",
  InProgress = "inProgress",
}

export type AppState = {
  currentState: GameStatus;
  game: Game | null;
};

export const appState: AppState = {
  currentState: GameStatus.StartOrJoin,
  game: null,
};

export const playerID = getPlayerID();

const ws = new WSDriver();

ws.connectWebsocket();

history.replaceState(appState, "");

export function renderApp(appState: AppState, ws: WSDriver, playerID: string) {
  switch (appState.currentState) {
    case GameStatus.StartOrJoin:
      renderStartOrJoin(appState, ws, playerID);
      break;
    case GameStatus.Rules:
      renderRules();
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

export function setPlayersInLobbyHtml(playerCount: number) {
  const element = document.getElementById("players-in-lobby");

  if (element) {
    element.innerHTML = `${playerCount} player(s) in the lobby`;
  } else {
    console.error("Element not found.");
  }
}

export function toast(message: string) {
  const element = document.getElementById("toast");
  if (element) {
    element.innerHTML = message;
    element.className = "show";
    setTimeout(function() {
      element.className = element.className.replace("show", "");
      element.innerHTML = "";
    }, 2000);
  } else {
    console.error("Element not found.");
  }
}
