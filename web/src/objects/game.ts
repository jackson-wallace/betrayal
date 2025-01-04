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
  currentPlayerID: string;
  _state: GameState;
  ws: WSDriver;
  display: DisplayDriver;

  constructor(
    canvas: HTMLCanvasElement,
    ws: WSDriver,
    playerID: string,
    state: GameState,
  ) {
    this.ws = ws;
    this.currentPlayerID = playerID;
    this._state = state;
    this._state.currentPlayerId = playerID;
    this.display = new DisplayDriver(canvas, this._state);
    this.initGame();
  }

  initGame() {
    this.display.render();
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
    const player = this.state.players[this.currentPlayerID];
    const fromCell = this.display.board.getCell(player.state.position);
    const toCell = this.display.board.getCell(hex);

    if (fromCell && toCell) {
      player.state.position = hex;

      player.state.cellsInRange = axialSpiral(hex, player.state.range);

      player.state.cellsAtMaxRange = axialRing(hex, player.state.range);

      this.display.render();
    }
  }

  startGame() { }

  endGame() { }

  handlePlayerAction() { }

  get state(): GameState {
    return this._state;
  }

  set state(state: GameState) {
    this._state = state;
    this.display.render();
  }
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
