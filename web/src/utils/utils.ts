export interface Hex {
  r: number;
  q: number;
}

interface Cube {
  r: number;
  q: number;
  s: number;
}

export function hexToPixelCoordinates(
  r: number,
  q: number,
  canvas: HTMLCanvasElement,
  size: number,
  cellWidth: number,
  cellHeight: number,
) {
  const centerX = canvas.width / (2 * devicePixelRatio);
  const centerY = canvas.height / (2 * devicePixelRatio);

  const horizontalCellCount = Math.floor(size / 2) + size;
  const offsetX = (cellWidth * (horizontalCellCount - 1)) / 2;
  const offsetY = ((3 / 4) * cellHeight * (size - 1)) / 2;

  const x = centerX + ((1 / 2) * cellWidth * r + cellWidth * q) - offsetX;
  const y = centerY + (3 / 4) * cellHeight * r - offsetY;

  return { x, y };
}

export function pixelToHexCoordinates(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  size: number,
  cellWidth: number,
  cellHeight: number,
  boardSize: number,
) {
  const centerX = canvas.width / (2 * devicePixelRatio);
  const centerY = canvas.height / (2 * devicePixelRatio);

  const horizontalCellCount = Math.floor(boardSize / 2) + boardSize;
  const offsetX = (cellWidth * (horizontalCellCount - 1)) / 2;
  const offsetY = ((3 / 4) * cellHeight * (boardSize - 1)) / 2;

  x = x - centerX + offsetX;
  y = y - centerY + offsetY;

  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;

  return axialRound({ r, q });
}

function axialRound(hex: Hex): Hex {
  return cubeToAxial(cubeRound(axialToCube(hex)));
}

function axialToCube(hex: Hex): Cube {
  const r = hex.r;
  const q = hex.q;
  const s = -1 * hex.q - hex.r;
  return { r, q, s };
}

function cubeToAxial(cube: Cube): Hex {
  const r = cube.r;
  const q = cube.q;
  return { r, q };
}

function cubeRound(frac: Cube): Cube {
  let r = Math.round(frac.r);
  let q = Math.round(frac.q);
  let s = Math.round(frac.s);

  const rDiff = Math.abs(r - frac.r);
  const qDiff = Math.abs(q - frac.q);
  const sDiff = Math.abs(s - frac.s);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -1 * r - s;
  } else if (rDiff > sDiff) {
    r = -1 * q - s;
  } else {
    s = -1 * q - r;
  }

  return { r, q, s };
}

const axialDirectionVectors: Hex[] = [
  { r: 0, q: 1 },
  { r: -1, q: 1 },
  { r: -1, q: 0 },
  { r: 0, q: -1 },
  { r: 1, q: -1 },
  { r: 1, q: 0 },
];

function axialDirection(direction: number): Hex {
  return axialDirectionVectors[direction];
}

function axialAdd(hex: Hex, vec: Hex): Hex {
  const r = hex.r + vec.r;
  const q = hex.q + vec.q;
  return { r, q };
}

function axialNeighbor(hex: Hex, direction: number): Hex {
  return axialAdd(hex, axialDirection(direction));
}

function axialScale(hex: Hex, factor: number): Hex {
  const r = hex.r * factor;
  const q = hex.q * factor;
  return { r, q };
}

export function axialRing(center: Hex, radius: number) {
  let results = [];
  let hex = axialAdd(center, axialScale(axialDirection(4), radius));
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push(hex);
      hex = axialNeighbor(hex, i);
    }
  }
  return results;
}

export function axialSpiral(center: Hex, radius: number) {
  let results = [];
  for (let i = 1; i <= radius; i++) {
    results.push(...axialRing(center, i));
  }
  return results;
}

export function calculateCellRadius(
  canvasHeight: number,
  canvasWidth: number,
  boardSize: number,
) {
  const canvasSize = Math.min(canvasHeight / 2, canvasWidth / 2);
  const cellRadius = canvasSize / boardSize;

  return cellRadius / 1.9;
}
