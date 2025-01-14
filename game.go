package main

import (
	"fmt"
	"sync"
	"time"
)

type Player struct {
	ID     string       `json:"id"`
	Color  string       `json:"color"`
	State  *PlayerState `json:"state"`
	Client *Client
}

type PlayerState struct {
	Hearts          int   `json:"hearts"`
	Range           int   `json:"range"`
	ActionPoints    int   `json:"actionPoints"`
	Position        Hex   `json:"position"`
	CellsInRange    []Hex `json:"cellsInRange"`
	CellsAtMaxRange []Hex `json:"cellsAtMaxRange"`
}

type GameState struct {
	Players map[string]*Player `json:"players"`
	Status  string             `json:"status"`
}

type Game struct {
	ID          string
	JoinCode    string
	BoardSize   int
	MainClient  *Client
	State       *GameState
	LastUpdate  time.Time
	ClockTime   time.Duration
	ClockTicker *time.Ticker
	sync.Mutex
}

func CreateNewPlayer(playerID string, client *Client, game *Game) (*Player, error) {
	position := GetRandomPosition(game.BoardSize, game.State.Players)
	player := NewPlayer(position)
	player.ID = playerID
	player.Client = client
	player.State.CellsInRange = AxialSpiral(game.BoardSize, position, player.State.Range)
	player.State.CellsAtMaxRange = AxialRing(game.BoardSize, position, player.State.Range)
	return player, nil
}

func NewPlayer(position Hex) *Player {
	return &Player{
		State: NewPlayerState(position),
	}
}

func NewPlayerState(position Hex) *PlayerState {
	return &PlayerState{
		Hearts:          3,
		Range:           1,
		ActionPoints:    0,
		Position:        position,
		CellsInRange:    []Hex{},
		CellsAtMaxRange: []Hex{},
	}
}

func NewGame() *Game {
	return &Game{
		State:       NewGameState(),
		ClockTime:   1 * time.Minute,
		ClockTicker: nil,
	}
}

func NewGameState() *GameState {
	return &GameState{
		Players: make(map[string]*Player),
		Status:  "initialized",
	}
}

func (g *Game) AllClients() []*Client {
	clients := []*Client{}
	for _, player := range g.State.Players {
		if player.Client != nil {
			clients = append(clients, player.Client)
		}
	}
	return clients
}

func (g *Game) StartClock() {
	g.ClockTicker = time.NewTicker(1 * time.Second)
	clockTime := g.ClockTime

	go func() {
		for range g.ClockTicker.C {
			g.Lock()

			g.ClockTime -= 1 * time.Second

			if g.ClockTime <= 0 {
				g.ClockTime = clockTime

				for _, player := range g.State.Players {
					if player.State != nil {
						player.State.ActionPoints++
					}
				}

				response := ReceiveActionPointEvent{
					GameState: *g.State,
					Sent:      time.Now(),
				}

				err := BroadcastEvent(EventReceiveActionPoint, response, g.AllClients())
				if err != nil {
					fmt.Printf("failed to broadcast action points: %v", err)
				}
			}

			response := ReceiveClockUpdateEvent{
				Seconds: int(g.ClockTime.Seconds()),
				Sent:    time.Now(),
			}

			err := BroadcastEvent(EventReceiveClockUpdate, response, g.AllClients())
			if err != nil {
				fmt.Printf("failed to broadcast clock update: %v", err)
			}
			g.Unlock()
		}
	}()
}

func (g *Game) StopClock() {
	if g.ClockTicker != nil {
		g.ClockTicker.Stop()
		g.ClockTicker = nil
	}
}

func (gs *GameState) AddPlayer(player *Player) {
	gs.Players[player.ID] = player
}

func (gs *GameState) RemovePlayer(playerID string) {
	delete(gs.Players, playerID)
}

func (gs *GameState) GetPlayerAtCell(hex Hex) *Player {
	for _, player := range gs.Players {
		if player.State == nil {
			continue
		}
		if player.State.Position == hex {
			return player
		}
	}
	return nil
}

func (gs *GameState) CheckForWinner() bool {
	playerCount := 0
	for _, player := range gs.Players {
		if player.State != nil {
			playerCount += 1
		}
	}
	return playerCount == 1
}

func (ps *PlayerState) IsCellInRange(hex Hex) bool {
	for _, cell := range ps.CellsInRange {
		if cell == hex {
			return true
		}
	}
	return false
}
