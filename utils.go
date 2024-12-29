package main

// Typescript
// getRandomPosition(): Hex {
//   const lowerBound = Math.floor(this.boardSize / 2);
//   const upperBound = (this.boardSize - 1) * 2 - lowerBound;

//   let r = this.getRandomInt(0, this.boardSize);
//   let q = this.getRandomInt(0, this.boardSize);
//   while (!(r + q >= lowerBound && r + q <= upperBound)) {
//     r = this.getRandomInt(0, this.boardSize);
//     q = this.getRandomInt(0, this.boardSize);
//   }

//   return { r, q };
// }

// Typecript
// getRandomInt(min: number, max: number): number {
//     min = Math.ceil(min);
//     max = Math.floor(max);
//     return Math.floor(Math.random() * (max - min) + min);
//   }

import (
	"math"
)

type Hex struct {
	R int `json:"r"`
	Q int `json:"q"`
}

type Cube struct {
	R int `json:"r"`
	Q int `json:"q"`
	S int `json:"s"`
}

func AxialRound(hex Hex) Hex {
	return CubeToAxial(CubeRound(AxialToCube(hex)))
}

func AxialToCube(hex Hex) Cube {
	r := hex.R
	q := hex.Q
	s := -q - r
	return Cube{R: r, Q: q, S: s}
}

func CubeToAxial(cube Cube) Hex {
	return Hex{R: cube.R, Q: cube.Q}
}

func CubeRound(frac Cube) Cube {
	r := int(math.Round(float64(frac.R)))
	q := int(math.Round(float64(frac.Q)))
	s := int(math.Round(float64(frac.S)))

	rDiff := math.Abs(float64(r) - float64(frac.R))
	qDiff := math.Abs(float64(q) - float64(frac.Q))
	sDiff := math.Abs(float64(s) - float64(frac.S))

	if qDiff > rDiff && qDiff > sDiff {
		q = -r - s
	} else if rDiff > sDiff {
		r = -q - s
	} else {
		s = -q - r
	}

	return Cube{R: r, Q: q, S: s}
}

var AxialDirectionVectors = []Hex{
	{R: 0, Q: 1},
	{R: -1, Q: 1},
	{R: -1, Q: 0},
	{R: 0, Q: -1},
	{R: 1, Q: -1},
	{R: 1, Q: 0},
}

func AxialDirection(direction int) Hex {
	return AxialDirectionVectors[direction]
}

func AxialAdd(hex, vec Hex) Hex {
	return Hex{R: hex.R + vec.R, Q: hex.Q + vec.Q}
}

func AxialNeighbor(hex Hex, direction int) Hex {
	return AxialAdd(hex, AxialDirection(direction))
}

func AxialScale(hex Hex, factor int) Hex {
	return Hex{R: hex.R * factor, Q: hex.Q * factor}
}

func AxialRing(center Hex, radius int) []Hex {
	var results []Hex
	hex := AxialAdd(center, AxialScale(AxialDirection(4), radius))
	for i := 0; i < 6; i++ {
		for j := 0; j < radius; j++ {
			results = append(results, hex)
			hex = AxialNeighbor(hex, i)
		}
	}
	return results
}

func AxialSpiral(center Hex, radius int) []Hex {
	var results []Hex
	for i := 1; i <= radius; i++ {
		results = append(results, AxialRing(center, i)...)
	}
	return results
}