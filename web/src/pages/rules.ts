export function renderRules() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <style>
      ul {
        list-style-type: disc;
        padding-left: 32px;
        padding-right: 16px;
      }
    
      li {
        margin-bottom: 10px;
      }
    
      li ul {
        margin-top: 10px;
      }
    </style>
    <div class="center">
      <h1>Rules</h1>
      <ul>
        <li>
          All players start at a random location on the board with 3 hearts and 0 Action Points.
        </li>
        <li>
          When the Action Point clock hits 00:00, each player will receive 1 Action Point (AP).
        </li>
        <li>
          At any time, a player can perform one of the four following actions:
          <ul>
            <li>
              Move to an unoccupied cell within range (1 AP).
            </li>
            <li>
              Shoot another player within range (1 AP).
            </li>
            <li>
              Upgrade their range (current range + 1 APs).
            </li>
            <li>
              Give an Action Point to another player within range (1 AP).
            </li>
          </ul>
        </li>
        <li>
          A player is eleminitated when they have 0 hearts, and any Action Points that the eleminated player had will be transferred to the player who eleminated them.
        </li>
      </ul>
      <h3>Be the last player standing.</h3>
    </div>
  `;
}
