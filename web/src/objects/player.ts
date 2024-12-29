import { axialRing, axialSpiral, Hex } from "../utils/utils.js";

export class Player {
  id: string;
  color: string;
  state: PlayerState;

  constructor(id: string, color: string, position: Hex) {
    this.id = id;
    this.color = color;
    this.state = new PlayerState(position);
  }
}

class PlayerState {
  hearts: number;
  range: number;
  actionPoints: number;
  position: Hex;
  cellsInRange: Hex[];
  cellsAtMaxRange: Hex[];

  constructor(coordinates: Hex) {
    this.hearts = 3;
    this.actionPoints = 0;
    this.range = 1;
    this.position = coordinates;
    this.cellsInRange = axialSpiral(coordinates, this.range);
    this.cellsAtMaxRange = axialRing(coordinates, this.range);
  }
}
