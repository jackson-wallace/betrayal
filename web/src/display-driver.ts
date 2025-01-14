import { Board, Cell } from "./game/board.js";
import { Game } from "./game/game.js";
import { Player } from "./game/player.js";
import { calculateCellRadius, hexToPixelCoordinates } from "./utils/utils.js";

export class DisplayDriver {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private _boardSize: number;
  private _cellRadius: number;
  private _cellWidth: number;
  private _cellHeight: number;
  board: Board;
  game: Game;

  constructor(canvas: HTMLCanvasElement, game: Game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this._boardSize = 17;
    this._cellRadius = calculateCellRadius(
      this.canvas.height,
      this.canvas.width,
      this._boardSize,
    );
    this._cellWidth = Math.sqrt(3) * this._cellRadius;
    this._cellHeight = 2 * this._cellRadius;
    this.game = game;
    this.board = new Board(this, this._boardSize);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderBoard();
    this.renderPlayerRanges();
    this.renderPlayers();
    this.renderSelectedCell();
  }

  private renderSelectedCell() {
    if (this.game.selectedCell) {
      const cell = this.board.getCell(this.game.selectedCell);
      if (cell) {
        this.renderCellOutline(cell, 2, true, "white");
      }
    }
  }

  private renderBoard() {
    for (let r = 0; r < this._boardSize; r++) {
      for (let q = 0; q < this._boardSize; q++) {
        const cell = this.board.getCell({ r, q });
        if (cell) {
          this.renderCellOutline(cell);
        }
      }
    }
  }

  private renderPlayers() {
    for (let player of Object.values(this.game.state.players)) {
      if (player.state) {
        const cell = this.board.getCell(player.state.position);
        if (cell) {
          this.renderCellFill(cell, player.color);
          this.renderPlayerHearts(cell, player.state.hearts);
          this.renderCellOutline(cell);
        }
      }
    }
  }

  private renderPlayerRanges() {
    for (let player of Object.values(this.game.state.players)) {
      if (player.state) {
        const cell = this.board.getCell(player.state.position);
        if (cell) {
          this.renderPlayerRange(player);
        }
      }
    }
  }

  private renderPlayerRange(player: Player) {
    for (let i = 0; i < player.state.cellsInRange.length; i++) {
      const hex = player.state.cellsInRange[i];
      const cell = this.board.getCell(hex);

      if (cell) {
        this.renderCellFill(cell, player.color + "33");
        this.renderCellOutline(cell);
      }
    }
  }

  private renderCellFill(cell: Cell, color: string) {
    this.createHexagonPath(cell);
    this.ctx.fillStyle = color;
    this.ctx.fill();

    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  private renderCellOutline(
    cell: Cell,
    lineWidth?: number,
    dashed?: boolean,
    color?: string,
  ) {
    if (dashed) {
      this.ctx.setLineDash([this.cellRadius / 4, this.cellRadius / 4]);
    } else {
      this.ctx.setLineDash([]);
    }
    this.createHexagonPath(cell);
    this.ctx.strokeStyle = color ?? "#B3B4B6";
    this.ctx.lineWidth = lineWidth ?? 1;
    this.ctx.stroke();
  }

  private createHexagonPath(cell: Cell) {
    this.ctx.beginPath();
    this.ctx.moveTo(cell.x, cell.y - this._cellHeight / 2);
    this.ctx.lineTo(
      cell.x + this._cellWidth / 2,
      cell.y - (1 / 4) * this._cellHeight,
    );
    this.ctx.lineTo(
      cell.x + this._cellWidth / 2,
      cell.y + (1 / 4) * this._cellHeight,
    );
    this.ctx.lineTo(cell.x, cell.y + this._cellHeight / 2);
    this.ctx.lineTo(
      cell.x - this._cellWidth / 2,
      cell.y + (1 / 4) * this._cellHeight,
    );
    this.ctx.lineTo(
      cell.x - this._cellWidth / 2,
      cell.y - (1 / 4) * this._cellHeight,
    );
    this.ctx.closePath();
  }

  private renderPlayerHearts(cell: Cell, hearts: number) {
    if (hearts === 3) {
      const leftHeart = {
        x: cell.x - this.cellRadius / 2,
        y: cell.y,
      };
      this.renderPlayerHeart(leftHeart);
      this.renderPlayerHeart(cell);
      const rightHeart = {
        x: cell.x + this.cellRadius / 2,
        y: cell.y,
      };
      this.renderPlayerHeart(rightHeart);
    } else if (hearts === 2) {
      const leftHeart = {
        x: cell.x - this.cellRadius / 4,
        y: cell.y,
      };
      this.renderPlayerHeart(leftHeart);
      const rightHeart = {
        x: cell.x + this.cellRadius / 4,
        y: cell.y,
      };
      this.renderPlayerHeart(rightHeart);
    } else {
      this.renderPlayerHeart(cell);
    }
  }

  private renderPlayerHeart(position: Cell) {
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, this.cellRadius / 5, 0, 2 * Math.PI);
    this.ctx.fillStyle = "#2C2C2E";
    this.ctx.fill();
    this.ctx.stroke();
  }

  handleResize() {
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;

    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    const newCellRadius = calculateCellRadius(
      this.canvas.height,
      this.canvas.width,
      this._boardSize,
    );

    this._cellRadius = newCellRadius;
    this._cellWidth = Math.sqrt(3) * newCellRadius;
    this._cellHeight = 2 * newCellRadius;

    this.updateCellCoordinates();
    this.render();
  }

  updateCellCoordinates() {
    for (let r = 0; r < this._boardSize; r++) {
      for (let q = 0; q < this._boardSize; q++) {
        const cell = this.board.getCell({ r, q });
        if (cell) {
          const { x, y } = hexToPixelCoordinates(
            r,
            q,
            this.canvas,
            this._boardSize,
            this._cellWidth,
            this._cellHeight,
          );
          cell.x = x;
          cell.y = y;
        }
      }
    }
  }

  setGameState() { }

  get boardSize() {
    return this._boardSize;
  }

  set boardSize(value: number) {
    if (value <= 0) {
      throw new Error("Board size must be a positive number.");
    }
    this._boardSize = value;
  }

  get cellRadius(): number {
    return this._cellRadius;
  }

  set cellRadius(value: number) {
    if (value <= 0) {
      throw new Error("Cell radius must be a positive number.");
    }
    this._cellRadius = value;
  }

  get cellWidth(): number {
    return this._cellWidth;
  }

  set cellWidth(value: number) {
    if (value <= 0) {
      throw new Error("Cell width must be a positive number.");
    }
    this._cellWidth = value;
  }

  get cellHeight(): number {
    return this._cellHeight;
  }

  set cellHeight(value: number) {
    if (value <= 0) {
      throw new Error("Cell height must be a positive number.");
    }
    this._cellHeight = value;
  }
}
