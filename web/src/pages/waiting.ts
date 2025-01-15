export function renderWaiting() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="center">
      <h3>Waiting for game to start...</h3>
      <p id="players-in-lobby">0 player(s) in the lobby</p>
    </div>
  `;
}
