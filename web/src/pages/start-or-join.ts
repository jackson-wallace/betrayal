import { AppState, GameStatus, renderApp } from "../app.js";
import { SendInitializeGameEvent } from "../events.js";
import { WSDriver } from "../ws-driver.js";

export function renderStartOrJoin(
  appState: AppState,
  ws: WSDriver,
  playerID: string,
) {
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
