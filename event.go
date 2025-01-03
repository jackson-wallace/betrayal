package main

import (
	"encoding/json"
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
)

type SendInitializeGameEvent struct {
	PlayerID string `json:"playerID"`
}

type ReceiveInitializeGameEvent struct {
	JoinCode string    `json:"joinCode"`
	Sent     time.Time `json:"sent"`
}
