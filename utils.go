package main

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"math"
	mathrand "math/rand"
	"time"

	"github.com/google/uuid"
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

func AxialRing(boardSize int, center Hex, radius int) []Hex {
	// lowerBound := boardSize / 2
	// upperBound := (boardSize-1)*2 - lowerBound

	var results []Hex
	hex := AxialAdd(center, AxialScale(AxialDirection(4), radius))
	for i := 0; i < 6; i++ {
		for j := 0; j < radius; j++ {
			if isHexOnBoard(hex, boardSize) {
				results = append(results, hex)
			}
			hex = AxialNeighbor(hex, i)
		}
	}
	return results
}

func AxialSpiral(boardSize int, center Hex, radius int) []Hex {
	var results []Hex
	for i := 1; i <= radius; i++ {
		results = append(results, AxialRing(boardSize, center, i)...)
	}
    results = append(results, center)
	return results
}

func NewGameID() string {
	id := "game-" + uuid.New().String()
	return id
}

func NewJoinCode(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		log.Println("Failed to generate join code")
	}

	return hex.EncodeToString(bytes)
}

func getRandomInt(min, max int) int {
	source := mathrand.NewSource(time.Now().UnixNano())
	rng := mathrand.New(source)
	return rng.Intn(max-min) + min
}

func GetRandomPosition(boardSize int, players map[string]*Player) Hex {
	var r, q int
	var hex Hex
	for {
		r = getRandomInt(0, boardSize)
		q = getRandomInt(0, boardSize)
		hex = Hex{R: r, Q: q}

		if isHexOnBoard(hex, boardSize) && !IsPositionOccupied(hex, players) {
			break
		}
	}

	return Hex{R: r, Q: q}
}

func IsPositionOccupied(hex Hex, players map[string]*Player) bool {
	for _, player := range players {
		if player.State.Position == hex {
			return true
		}
	}
	return false
}

func isHexOnBoard(hex Hex, boardSize int) bool {
	lowerBound := boardSize / 2
	upperBound := boardSize + lowerBound - 1

	hexSum := hex.R + hex.Q
	if hexSum < lowerBound || hexSum > upperBound {
		return false
	}

	if hex.R < 0 || hex.R > boardSize-1 {
		return false
	}

	if hex.Q < 0 || hex.Q > boardSize-1 {
		return false
	}

	return true
}
