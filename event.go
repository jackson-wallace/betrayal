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
	// EventSendMessage    = "send_message"
	// EventReceiveMessage = "receive_message"
	// EventChangeRoom     = "change_room"
)

type SendInitializeGameEvent struct {
	PlayerID string `json:"playerID"`
}

type ReceiveInitializeGameEvent struct {
	JoinCode string    `json:"joinCode"`
	Sent     time.Time `json:"sent"`
}

// type SendMessageEvent struct {
// 	Message string `json:"message"`
// 	From    string `json:"from"`
// }
//
// type ReceiveMessageEvent struct {
// 	SendMessageEvent
// 	Sent time.Time `json:"sent"`
// }
//
// type ChangeRoomEvent struct {
// 	Name string `json:"name"`
// }
