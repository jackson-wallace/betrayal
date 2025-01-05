import { Board, Cell } from "./objects/board.js";
import { GameState } from "./objects/game.js";
import { Player } from "./objects/player.js";
import { calculateCellRadius, hexToPixelCoordinates } from "./utils/utils.js";

export class DisplayDriver {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private _boardSize: number;
  private _cellRadius: number;
  private _cellWidth: number;
  private _cellHeight: number;
  board: Board;
  gameState: GameState;

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
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
    this.gameState = gameState;
    this.board = new Board(this, this._boardSize);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderBoard();
    this.renderPlayerRanges();
    this.renderPlayers();
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
    for (let player of Object.values(this.gameState.players)) {
      const cell = this.board.getCell(player.state.position);
      if (cell) {
        this.renderCellFill(cell, player.color);
        this.renderPlayerHearts(cell, player.state.hearts);
      }
    }
  }

  private renderPlayerRanges() {
    for (let player of Object.values(this.gameState.players)) {
      const cell = this.board.getCell(player.state.position);
      if (cell) {
        this.renderPlayerRange(player);
      }
    }
  }

  private renderPlayerRange(player: Player) {
    this.ctx.beginPath();

    for (let i = 0; i < player.state.cellsAtMaxRange.length; i++) {
      const hex = player.state.cellsAtMaxRange[i];
      const cell = this.board.getCell(hex);

      if (cell && i === 0) {
        this.ctx.moveTo(cell.x, cell.y);
      } else if (cell) {
        this.ctx.lineTo(cell.x, cell.y);
      }
    }

    this.ctx.closePath();

    this.ctx.strokeStyle = player.color;
    this.ctx.stroke();
  }

  private renderCellFill(cell: Cell, color: string) {
    this.createHexagonPath(cell);
    this.ctx.fillStyle = color;
    this.ctx.fill();

    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  private renderCellOutline(cell: Cell, color?: string) {
    this.createHexagonPath(cell);
    this.ctx.strokeStyle = color ?? "rgb(255, 255, 255)";
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
    this.ctx.fillStyle = "black";
    this.ctx.fill();
    this.ctx.stroke();
  }

  handleResize() {
    this.canvas.width = window.innerWidth * devicePixelRatio;
    this.canvas.height = window.innerHeight * devicePixelRatio;

    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";

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
