import { appState, GameStatus, playerID, renderApp } from "../app.js";
import { initFavicon } from "../utils/favicon.js";
import { WSDriver } from "../ws-driver.js";

export function renderPlayerWin(ws: WSDriver, playerColor: string) {
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
    initFavicon()
  });
}
