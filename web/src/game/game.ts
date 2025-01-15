import { toast } from "../app.js";
import { DisplayDriver } from "../display-driver.js";
import {
  SendPlayerGiveActionPointEvent,
  SendPlayerIncreaseRangeEvent,
  SendPlayerMoveEvent,
  SendPlayerShootEvent,
} from "../events.js";
import { setActionPointsHtml, setBlockColor } from "../pages/in-progress.js";
import { initFavicon } from "../utils/favicon.js";
import { Hex, isHexOnBoard, pixelToHexCoordinates } from "../utils/utils.js";
import { WSDriver } from "../ws-driver.js";
import { Player } from "./player.js";

export class Game {
  currentPlayerID: string;
  private _state: GameState;
  private _selectedCell: Hex | null;
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
    this._selectedCell = null;
    this.display = new DisplayDriver(canvas, this);
    this.initGame();
  }

  initGame() {
    const player = this._state.players[this.currentPlayerID];
    initFavicon(player.color);
    setActionPointsHtml(player.state.actionPoints.toString());
    setBlockColor(player.color);
    this.display.render();
  }

  handleBoardClick(event: MouseEvent) {
    const clickHex = pixelToHexCoordinates(
      event.clientX,
      event.clientY,
      this.display.canvas,
      this.display.cellRadius,
      this.display.cellWidth,
      this.display.cellHeight,
      this.display.boardSize,
    );

    const playerState = this.state.players[this.currentPlayerID].state;
    if (!playerState) {
      return;
    }

    if (isHexOnBoard(clickHex, this.display.boardSize)) {
      this.selectedCell = clickHex;
      this.display.render();
    } else if (this.selectedCell) {
      this.selectedCell = null;
      this.display.render();
    }
  }

  handlePlayerMove() {
    const playerState = this.state.players[this.currentPlayerID].state;
    if (!playerState) {
      return;
    }

    if (this.selectedCell) {
      const outgoingEvent = new SendPlayerMoveEvent(
        this.currentPlayerID,
        this.selectedCell,
      );
      this.ws.sendEvent("send_player_move", outgoingEvent);

      this.selectedCell = null;
    } else {
      toast("Select a position to move");
    }
  }

  handlePlayerShoot() {
    const playerState = this.state.players[this.currentPlayerID].state;
    if (!playerState) {
      return;
    }

    if (this.selectedCell) {
      const outgoingEvent = new SendPlayerShootEvent(
        this.currentPlayerID,
        this.selectedCell,
      );
      this.ws.sendEvent("send_player_shoot", outgoingEvent);

      this.selectedCell = null;
    } else {
      toast("Select a player to shoot");
    }
  }

  handlePlayerIncreaseRange() {
    const playerState = this.state.players[this.currentPlayerID].state;
    if (!playerState) {
      return;
    }

    const outgoingEvent = new SendPlayerIncreaseRangeEvent(
      this.currentPlayerID,
    );
    this.ws.sendEvent("send_player_increase_range", outgoingEvent);

    this.selectedCell = null;
  }

  handlePlayerGiveActionPoint() {
    const playerState = this.state.players[this.currentPlayerID].state;
    if (!playerState) {
      return;
    }

    if (this.selectedCell) {
      const outgoingEvent = new SendPlayerGiveActionPointEvent(
        this.currentPlayerID,
        this.selectedCell,
      );
      this.ws.sendEvent("send_player_give_action_point", outgoingEvent);

      this.selectedCell = null;
    } else {
      toast("Select a player to give action point");
    }
  }

  get selectedCell(): Hex | null {
    return this._selectedCell;
  }

  set selectedCell(hex: Hex | null) {
    this._selectedCell = hex;
  }

  get state(): GameState {
    return this._state;
  }

  set state(state: GameState) {
    this._state = state;
    // this.display.game = state;

    const player = state.players[this.currentPlayerID];
    if (player.state) {
      setActionPointsHtml(player.state.actionPoints.toString());
    } else {
      setActionPointsHtml("X");
    }

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
}
