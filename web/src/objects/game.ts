import { DisplayDriver } from "../display-driver.js";
import {
  axialRing,
  axialSpiral,
  Hex,
  pixelToHexCoordinates,
} from "../utils/utils.js";
import { WSDriver } from "../ws-driver.js";
import { Player } from "./player.js";

export class Game {
  currentPlayer: Player;
  state: GameState;
  ws: WSDriver;
  display: DisplayDriver;

  constructor(canvas: HTMLCanvasElement, ws: WSDriver) {
    this.currentPlayer = new Player("1", "LightSkyBlue", { r: 9, q: 9 });
    this.state = new GameState("1");
    this.state.addPlayer(this.currentPlayer);
    this.ws = ws;
    this.display = new DisplayDriver(canvas, this.state);
    this.initGame();
  }

  initGame() {
    this.display.render();
  }

  getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  handleClick(event: MouseEvent) {
    const clickHex = pixelToHexCoordinates(
      event.clientX,
      event.clientY,
      this.display.canvas,
      this.display.cellRadius,
      this.display.cellWidth,
      this.display.cellHeight,
      this.display.boardSize,
    );

    this.movePlayer(clickHex);
  }

  movePlayer(hex: Hex) {
    const fromCell = this.display.board.getCell(
      this.currentPlayer.state.position,
    );
    const toCell = this.display.board.getCell(hex);

    if (fromCell && toCell) {
      this.currentPlayer.state.position = hex;

      this.currentPlayer.state.cellsInRange = axialSpiral(
        hex,
        this.currentPlayer.state.range,
      );

      this.currentPlayer.state.cellsAtMaxRange = axialRing(
        hex,
        this.currentPlayer.state.range,
      );

      this.display.render();
    }
  }

  startGame() { }

  joinGame() { }

  endGame() { }

  handlePlayerAction() { }
}

export class GameState {
  private _players: Record<string, Player>;
  private _currentPlayerId: string;
  private _status: "waiting" | "active" | "completed";

  constructor(currentPlayerId: string, status: "waiting" = "waiting") {
    this._players = {};
    this._currentPlayerId = currentPlayerId;
    this._status = status;
  }

  get players(): Record<string, Player> {
    return this._players;
  }

  get currentPlayerId(): string {
    return this._currentPlayerId;
  }

  set currentPlayerId(playerId: string) {
    this._currentPlayerId = playerId;
  }

  get status(): "waiting" | "active" | "completed" {
    return this._status;
  }

  set status(newStatus: "waiting" | "active" | "completed") {
    this._status = newStatus;
  }

  addPlayer(player: Player): void {
    this._players[player.id] = player;
  }

  removePlayer(playerId: string): void {
    delete this._players[playerId];
  }

  toJSON(): string {
    return JSON.stringify({
      players: this._players,
      currentPlayerId: this._currentPlayerId,
      status: this._status,
    });
  }

  static fromJSON(json: string): GameState {
    const data = JSON.parse(json);
    const gameState = new GameState(data.currentPlayerId, data.status);
    gameState._players = data.players || {};
    return gameState;
  }
}
