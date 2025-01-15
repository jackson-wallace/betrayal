import { AppState, playerID } from "../app.js";
import { Game, GameState } from "../game/game.js";
import { WSDriver } from "../ws-driver.js";

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

export function setBlockColor(color: string): void {
  const colorElement = document.getElementById("color");
  if (colorElement) {
    colorElement.style.color = color;
  } else {
    console.error("Element not found.");
  }
}

export function setActionPointsHtml(actionPoints: string) {
  const element = document.getElementById("action-points");
  if (element) {
    element.innerHTML = `Action Points: ${actionPoints}`;
  } else {
    console.error("Element not found.");
  }
}

export function setClockHtml(time: number) {
  const element = document.getElementById("clock");
  if (element) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    element.innerHTML = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  } else {
    console.error("Element not found.");
  }
}
