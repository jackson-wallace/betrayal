import { DisplayDriver } from "../display-driver.js";
import { Hex, hexToPixelCoordinates } from "../utils/utils.js";

export type Cell = {
  x: number;
  y: number;
};

export class Board {
  size: number;
  cells: (Cell | null)[][];

  constructor(display: DisplayDriver, size: number) {
    this.size = size;
    this.cells = new Array<Array<Cell | null>>();
    this.initCells(display);
  }

  initCells(display: DisplayDriver) {
    const lowerBound = Math.floor(this.size / 2);
    const upperBound = (this.size - 1) * 2 - lowerBound;
    for (let r = 0; r < this.size; r++) {
      let row: (Cell | null)[] = new Array<Cell | null>();
      for (let q = 0; q < this.size; q++) {
        if (r + q >= lowerBound && r + q <= upperBound) {
          const { x, y } = hexToPixelCoordinates(
            r,
            q,
            display.canvas,
            this.size,
            display.cellWidth,
            display.cellHeight,
          );
          row.push({ x: x, y: y });
        } else {
          row.push(null);
        }
      }
      this.cells.push(row);
    }
  }

  getCell(hex: Hex) {
    const board = this.cells;
    const cellRow = board[hex.r];
    if (cellRow) {
      const cell = cellRow[hex.q];
      return cell;
    } else {
      return null;
    }
  }
}
