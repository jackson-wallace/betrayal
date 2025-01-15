import { AppState, GameStatus, renderApp } from "../app.js";
import { SendStartGameEvent } from "../events.js";
import { WSDriver } from "../ws-driver.js";

export function renderStartGame(
  appState: AppState,
  ws: WSDriver,
  playerID: string,
) {
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

export function setJoinCodeHtml(joinCode: string) {
  const element = document.getElementById("join-code");
  if (element) {
    element.innerHTML = `Join Code: ${joinCode.toUpperCase()}`;
  } else {
    console.error("Element not found.");
  }
}
