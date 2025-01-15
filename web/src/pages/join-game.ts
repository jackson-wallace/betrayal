import { toast } from "../app.js";
import { SendJoinGameEvent } from "../events.js";
import { WSDriver } from "../ws-driver.js";

export function renderJoinGame(ws: WSDriver, playerID: string) {
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
