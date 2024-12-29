package main

type Game struct {
	ID    string
	State *GameState
}

type GameState struct {
	Players map[string]*Player `json:"players"`
	Status  string             `json:"status"`
}

type Player struct {
	ID    string       `json:"id"`
	Color string       `json:"color"`
	State *PlayerState `json:"state"`
}

type PlayerState struct {
	Hearts       int   `json:"hearts"`
	Range        int   `json:"range"`
	ActionPoints int   `json:"actionPoints"`
	Position     Hex   `json:"position"`
	CellsInRange []Hex `json:"cellsInRange"`
	CellsAtMax   []Hex `json:"cellsAtMax"`
}

func NewGameState(currentPlayerID string) *GameState {
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
