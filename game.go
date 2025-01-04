package main

type Player struct {
	ID    string       `json:"id"`
	Color string       `json:"color"`
	State *PlayerState `json:"state"`

	// Create Data transfer object (DTO) if client causes issues
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
	ID         string
	JoinCode   string
	BoardSize  int
	MainClient *Client
	State      *GameState
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
		State: NewGameState(),
	}
}

func NewGameState() *GameState {
	return &GameState{
		Players: make(map[string]*Player),
		Status:  "waiting",
	}
}

func (gs *GameState) AddPlayer(player *Player) {
	gs.Players[player.ID] = player
}

func (gs *GameState) RemovePlayer(playerID string) {
	delete(gs.Players, playerID)
}
