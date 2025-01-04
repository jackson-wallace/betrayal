package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
)

type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type EventHandler func(event Event, c *Client) error

const (
	EventSendInitializeGame    = "send_initialize_game"
	EventReceiveInitializeGame = "receive_initialize_game"
	EventSendJoinGame          = "send_join_game"
	EventReceiveJoinGame       = "receive_join_game"
	EventSendStartGame         = "send_start_game"
	EventReceiveStartGame      = "receive_start_game"
)

type SendInitializeGameEvent struct {
	PlayerID string `json:"playerID"`
}

type ReceiveInitializeGameEvent struct {
	JoinCode string    `json:"joinCode"`
	Sent     time.Time `json:"sent"`
}

func InitializeGameHandler(event Event, c *Client) error {
	var sendInitializeGameEvent SendInitializeGameEvent

	if err := json.Unmarshal(event.Payload, &sendInitializeGameEvent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	var receiveInitializeGameEvent ReceiveInitializeGameEvent

	newJoinCode := NewJoinCode(2)

	newGameID := NewGameID()
	newGame := NewGame()
	newGame.ID = newGameID
	newGame.JoinCode = newJoinCode
	newGame.BoardSize = 17
	newGame.MainClient = c

	position := GetRandomPosition(newGame.BoardSize)

	newPlayer := NewPlayer(position)
	newPlayer.ID = sendInitializeGameEvent.PlayerID
	newPlayer.Color = "blue"
	newPlayer.Client = c
	newPlayer.State.CellsInRange = AxialSpiral(position, newPlayer.State.Range)
	newPlayer.State.CellsAtMaxRange = AxialRing(position, newPlayer.State.Range)
	newGame.State.AddPlayer(newPlayer)

	c.GameID = newGameID
	c.manager.games[newGameID] = newGame

	receiveInitializeGameEvent.JoinCode = newJoinCode

	receiveInitializeGameEvent.Sent = time.Now()

	data, err := json.Marshal(receiveInitializeGameEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast message: %v", err)
	}

	outgoingEvent := Event{
		Payload: data,
		Type:    EventReceiveInitializeGame,
	}

	c.egress <- outgoingEvent

	return nil
}

type SendJoinGameEvent struct {
	PlayerID string    `json:"playerID"`
	JoinCode string    `json:"joinCode"`
	Sent     time.Time `json:"sent"`
}

type ReceiveJoinGameEvent struct {
	PlayerCount int       `json:"playerCount"`
	Sent        time.Time `json:"sent"`
}

func JoinGameHandler(event Event, c *Client) error {
	var sendJoinGameEvent SendJoinGameEvent

	if err := json.Unmarshal(event.Payload, &sendJoinGameEvent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	for gameID, game := range c.manager.games {
		if sendJoinGameEvent.JoinCode == game.JoinCode {

			// TODO
			// make sure position isn't taken by another player
			position := GetRandomPosition(game.BoardSize)

			newPlayer := NewPlayer(position)
			newPlayer.ID = sendJoinGameEvent.PlayerID
			newPlayer.Color = "red"
			newPlayer.Client = c
			newPlayer.State.CellsInRange = AxialSpiral(position, newPlayer.State.Range)
			newPlayer.State.CellsAtMaxRange = AxialRing(position, newPlayer.State.Range)

			game.State.AddPlayer(newPlayer)

			c.GameID = gameID

			var receiveJoinGameEvent ReceiveJoinGameEvent

			receiveJoinGameEvent.Sent = time.Now()
			receiveJoinGameEvent.PlayerCount = len(game.State.Players)
			fmt.Println("game.State.Players: ", game.State.Players)

			data, err := json.Marshal(receiveJoinGameEvent)
			if err != nil {
				return fmt.Errorf("failed to marshal join message: %v", err)
			}

			outgoingEvent := Event{
				Payload: data,
				Type:    EventReceiveJoinGame,
			}

			game.MainClient.egress <- outgoingEvent

			return nil

		}
	}

	return nil
}

type SendStartGameEvent struct {
	PlayerID string `json:"playerID"`
}

type ReceiveStartGameEvent struct {
	GameState GameState `json:"gameState"`
	Sent      time.Time `json:"sent"`
}

func StartGameHandler(event Event, c *Client) error {
	var sendStartGameEvent SendStartGameEvent
	if err := json.Unmarshal(event.Payload, &sendStartGameEvent); err != nil {
		return fmt.Errorf("bad payload in request: %v", err)
	}

	var receiveStartGameEvent ReceiveStartGameEvent

	game := c.manager.games[c.GameID]

	receiveStartGameEvent.GameState = *game.State
	receiveStartGameEvent.Sent = time.Now()

	data, err := json.Marshal(receiveStartGameEvent)
	if err != nil {
		log.Printf("Error marshalling GameState: %v", err)
	}

	outgoingEvent := Event{
		Payload: data,
		Type:    EventReceiveStartGame,
	}

	for _, player := range game.State.Players {
		player.Client.egress <- outgoingEvent
	}

	return nil
}
