package main

import (
	"encoding/json"
	"fmt"
	"time"
)

type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type EventHandler func(event Event, c *Client) error

const (
	EventSendInitializeGame           = "send_initialize_game"
	EventReceiveInitializeGame        = "receive_initialize_game"
	EventSendJoinGame                 = "send_join_game"
	EventReceiveJoinGame              = "receive_join_game"
	EventSendStartGame                = "send_start_game"
	EventReceiveStartGame             = "receive_start_game"
	EventSendPlayerMove               = "send_player_move"
	EventReceivePlayerMove            = "receive_player_move"
	EventSendPlayerShoot              = "send_player_shoot"
	EventReceivePlayerShoot           = "receive_player_shoot"
	EventSendPlayerIncreaseRange      = "send_player_increase_range"
	EventReceivePlayerIncreaseRange   = "receive_player_increase_range"
	EventSendPlayerGiveActionPoint    = "send_player_give_action_point"
	EventReceivePlayerGiveActionPoint = "receive_player_give_action_point"
	EventReceiveInvalidAction         = "receive_invalid_action"
	EventReceivePlayerWin             = "receive_player_win"
)

type ReceiveInvalidActionEvent struct {
	Message string `json:"message"`
	Sent    time.Time
}

type ReceivePlayerWinEvent struct {
	GameState   GameState `json:"gameState"`
	PlayerColor string    `json:"playerColor"`
	Sent        time.Time `json:"sent"`
}

type SendInitializeGameEvent struct {
	PlayerID string `json:"playerID"`
}

type ReceiveInitializeGameEvent struct {
	JoinCode string    `json:"joinCode"`
	Sent     time.Time `json:"sent"`
}

type SendJoinGameEvent struct {
	PlayerID string    `json:"playerID"`
	JoinCode string    `json:"joinCode"`
	Sent     time.Time `json:"sent"`
}

type ReceiveJoinGameEvent struct {
	PlayerCount  int       `json:"playerCount"`
	IsMainClient bool      `json:"isMainClient"`
	Sent         time.Time `json:"sent"`
}

type SendStartGameEvent struct {
	PlayerID string `json:"playerID"`
}

type ReceiveStartGameEvent struct {
	GameState GameState `json:"gameState"`
	Sent      time.Time `json:"sent"`
}

type SendPlayerMoveEvent struct {
	PlayerID string `json:"playerID"`
	Hex      Hex    `json:"hex"`
}

type ReceivePlayerMoveEvent struct {
	GameState GameState `json:"gameState"`
	Sent      time.Time `json:"sent"`
}

type SendPlayerShootEvent struct {
	PlayerID string `json:"playerID"`
	Hex      Hex    `json:"hex"`
}

type ReceivePlayerShootEvent struct {
	GameState GameState `json:"gameState"`
	Sent      time.Time `json:"sent"`
}

type SendPlayerIncreaseRangeEvent struct {
	PlayerID string `json:"playerID"`
}

type ReceivePlayerIncreaseRangeEvent struct {
	GameState GameState `json:"gameState"`
	Sent      time.Time `json:"sent"`
}

type SendPlayerGiveActionPointEvent struct {
	PlayerID string `json:"playerID"`
	Hex      Hex    `json:"hex"`
}

type ReceivePlayerGiveActionPointEvent struct {
	GameState GameState `json:"gameState"`
	Sent      time.Time `json:"sent"`
}

func InitializeGameHandler(event Event, c *Client) error {
	c.manager.Lock()
	defer c.manager.Unlock()

	var payload SendInitializeGameEvent
	if err := ParsePayload(event.Payload, &payload); err != nil {
		return err
	}

	gameID := NewGameID()
	joinCode := NewJoinCode(3)
	game := NewGame()

	game.Lock()
	defer game.Unlock()

	game.ID = gameID
	game.JoinCode = joinCode
	game.BoardSize = 17
	game.MainClient = c
	game.LastUpdate = time.Now()

	player, err := CreateNewPlayer(payload.PlayerID, c, game)
	if err != nil {
		return fmt.Errorf("failed to create player: %v", err)
	}
	player.Color = "#264BCC"
	game.State.AddPlayer(player)

	c.GameID = gameID
	c.manager.games[gameID] = game

	response := ReceiveInitializeGameEvent{
		JoinCode: joinCode,
		Sent:     time.Now(),
	}
	return BroadcastEvent(EventReceiveInitializeGame, response, []*Client{c})
}

func JoinGameHandler(event Event, c *Client) error {
	c.manager.Lock()
	defer c.manager.Unlock()

	var payload SendJoinGameEvent
	if err := ParsePayload(event.Payload, &payload); err != nil {
		return err
	}

	for _, game := range c.manager.games {
		if payload.JoinCode != game.JoinCode {
			continue
		}

		game.Lock()
		defer game.Unlock()

		if game.State.Status == "in_progress" {
			return sendInvalidAction(c, "Game already started")
		}

		if len(game.State.Players) >= 8 {
			return sendInvalidAction(c, "Lobby full")
		}

		player, err := CreateNewPlayer(payload.PlayerID, c, game)
		if err != nil {
			return fmt.Errorf("failed to create player: %v", err)
		}
		player.Color = GetPlayerColor(len(game.State.Players) - 1)
		game.State.AddPlayer(player)

		c.GameID = game.ID

		game.LastUpdate = time.Now()

		for _, recipient := range game.AllClients() {
			response := ReceiveJoinGameEvent{
				PlayerCount:  len(game.State.Players),
				IsMainClient: recipient == game.MainClient,
				Sent:         time.Now(),
			}
			err := BroadcastEvent(EventReceiveJoinGame, response, []*Client{recipient})
			if err != nil {
				return fmt.Errorf("failed to broadcast event to client %v: %v", recipient, err)
			}
		}

		return nil
	}

	response := ReceiveInvalidActionEvent{
		Message: "Join code not found",
		Sent:    time.Now(),
	}
	return BroadcastEvent(EventReceiveInvalidAction, response, []*Client{c})
}

func GetPlayerColor(playerIndex int) string {
	colors := []string{"#E40027", "#FF9526", "#F8D034", "#2AA146", "lightblue", "indigo", "violet"}
	return colors[playerIndex%len(colors)]
}

func StartGameHandler(event Event, c *Client) error {
	c.manager.Lock()
	defer c.manager.Unlock()

	var payload SendStartGameEvent
	if err := ParsePayload(event.Payload, &payload); err != nil {
		return err
	}

	game := c.manager.games[c.GameID]

	game.Lock()
	defer game.Unlock()

	game.State.Status = "in_progress"

	response := ReceiveStartGameEvent{
		GameState: *game.State,
		Sent:      time.Now(),
	}
	return BroadcastEvent(EventReceiveStartGame, response, game.AllClients())
}

func PlayerMoveHandler(event Event, c *Client) error {
	var payload SendPlayerMoveEvent
	if err := ParsePayload(event.Payload, &payload); err != nil {
		return err
	}

	game := c.manager.games[c.GameID]

	game.Lock()
	defer game.Unlock()

	player, err := validatePlayerExists(game, payload.PlayerID)
	if err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if err := validateActionPoints(player); err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if err := validateCellInRange(player, payload.Hex); err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if err := validateCellOccupied(game, payload.Hex, false); err != nil {
		return sendInvalidAction(c, err.Error())
	}

	player.State.ActionPoints -= 1
	player.State.Position = payload.Hex
	player.State.CellsInRange = AxialSpiral(game.BoardSize, payload.Hex, player.State.Range)
	player.State.CellsAtMaxRange = AxialRing(game.BoardSize, payload.Hex, player.State.Range)

	response := ReceivePlayerMoveEvent{
		GameState: *game.State,
		Sent:      time.Now(),
	}
	return BroadcastEvent(EventReceivePlayerMove, response, game.AllClients())
}

func PlayerShootHandler(event Event, c *Client) error {
	c.manager.Lock()
	defer c.manager.Unlock()

	var payload SendPlayerShootEvent
	if err := ParsePayload(event.Payload, &payload); err != nil {
		return err
	}

	game := c.manager.games[c.GameID]

	game.Lock()
	unlockNeeded := true
	defer func() {
		if unlockNeeded {
			game.Unlock()
		}
	}()

	player, err := validatePlayerExists(game, payload.PlayerID)
	if err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if err := validateActionPoints(player); err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if err := validateCellInRange(player, payload.Hex); err != nil {
		return sendInvalidAction(c, err.Error())
	}

	target := game.State.GetPlayerAtCell(payload.Hex)
	if target == nil {
		return sendInvalidAction(c, "Position not occupied")
	}
	if target == player {
		return sendInvalidAction(c, "Can't shoot yourself")
	}

	player.State.ActionPoints -= 1
	target.State.Hearts -= 1
	if target.State.Hearts <= 0 {
		target.State = nil
	}

	isWinner := game.State.CheckForWinner()
	if isWinner {
		response := ReceivePlayerWinEvent{
			GameState:   *game.State,
			PlayerColor: player.Color,
			Sent:        time.Now(),
		}
		if err := BroadcastEvent(EventReceivePlayerWin, response, game.AllClients()); err != nil {
			return err
		}

		unlockNeeded = false
		game.Unlock()

		c.manager.RemoveGame(c.GameID)

		return nil
	}

	response := ReceivePlayerShootEvent{
		GameState: *game.State,
		Sent:      time.Now(),
	}
	return BroadcastEvent(EventReceivePlayerShoot, response, game.AllClients())
}

func PlayerIncreaseRangeHandler(event Event, c *Client) error {
	c.manager.Lock()
	defer c.manager.Unlock()

	var payload SendPlayerIncreaseRangeEvent
	if err := ParsePayload(event.Payload, &payload); err != nil {
		return err
	}

	game := c.manager.games[c.GameID]

	game.Lock()
	defer game.Unlock()

	player, err := validatePlayerExists(game, payload.PlayerID)
	if err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if player.State.ActionPoints < player.State.Range+1 {
		return sendInvalidAction(c, "Not enough action points")
	}

	player.State.Range += 1
	player.State.ActionPoints -= player.State.Range
	player.State.CellsInRange = AxialSpiral(game.BoardSize, player.State.Position, player.State.Range)
	player.State.CellsAtMaxRange = AxialRing(game.BoardSize, player.State.Position, player.State.Range)

	response := ReceivePlayerIncreaseRangeEvent{
		GameState: *game.State,
		Sent:      time.Now(),
	}

	return BroadcastEvent(EventReceivePlayerIncreaseRange, response, game.AllClients())
}

func PlayerGiveActionPointHandler(event Event, c *Client) error {
	c.manager.Lock()
	defer c.manager.Unlock()

	var payload SendPlayerGiveActionPointEvent
	if err := ParsePayload(event.Payload, &payload); err != nil {
		return err
	}

	game := c.manager.games[c.GameID]

	game.Lock()
	defer game.Unlock()

	player, err := validatePlayerExists(game, payload.PlayerID)
	if err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if err := validateActionPoints(player); err != nil {
		return sendInvalidAction(c, err.Error())
	}

	if err := validateCellInRange(player, payload.Hex); err != nil {
		return sendInvalidAction(c, err.Error())
	}

	target := game.State.GetPlayerAtCell(payload.Hex)
	if target == nil {
		return sendInvalidAction(c, "Position not occupied")
	}
	if target == player {
		return sendInvalidAction(c, "Can't give to yourself")
	}

	player.State.ActionPoints -= 1
	target.State.ActionPoints += 1

	response := ReceivePlayerGiveActionPointEvent{
		GameState: *game.State,
		Sent:      time.Now(),
	}
	return BroadcastEvent(EventReceivePlayerGiveActionPoint, response, game.AllClients())

}

func ParsePayload[T any](payload []byte, target *T) error {
	if err := json.Unmarshal(payload, target); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}
	return nil
}

func validatePlayerExists(game *Game, playerID string) (*Player, error) {
	player, exists := game.State.Players[playerID]
	if !exists {
		return nil, fmt.Errorf("player %s not found in game", playerID)
	}
	return player, nil
}

func validateActionPoints(player *Player) error {
	if player.State.ActionPoints == 0 {
		return fmt.Errorf("Not enough action points")
	}
	return nil
}

func validateCellInRange(player *Player, hex Hex) error {
	if !player.State.IsCellInRange(hex) {
		return fmt.Errorf("Position out of range")
	}
	return nil
}

func validateCellOccupied(game *Game, hex Hex, expectOccupied bool) error {
	playerAtCell := game.State.GetPlayerAtCell(hex)
	if expectOccupied && playerAtCell == nil {
		return fmt.Errorf("Position not occupied")
	}
	if !expectOccupied && playerAtCell != nil {
		return fmt.Errorf("Position occupied")
	}
	return nil
}

func sendInvalidAction(c *Client, message string) error {
	response := ReceiveInvalidActionEvent{
		Message: message,
		Sent:    time.Now(),
	}
	return BroadcastEvent(EventReceiveInvalidAction, response, []*Client{c})
}

func BroadcastEvent(eventType string, payload any, clients []*Client) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal %s event: %v", eventType, err)
	}
	outgoingEvent := Event{Type: eventType, Payload: data}
	for _, client := range clients {
		client.egress <- outgoingEvent
	}
	return nil
}
