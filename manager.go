package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	websocketUpgrader = websocket.Upgrader{
		CheckOrigin:     checkOrigin,
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

type Manager struct {
	clients ClientList
	sync.RWMutex

	handlers map[string]EventHandler
	games    map[string]*Game
}

func NewManager(ctx context.Context) *Manager {
	m := &Manager{
		clients:  make(ClientList),
		handlers: make(map[string]EventHandler),
		games:    make(map[string]*Game),
	}

	m.setupEventHandlers()

	go m.startGameCleanupRoutine()

	return m
}

func (m *Manager) setupEventHandlers() {
	m.handlers[EventSendInitializeGame] = InitializeGameHandler
	m.handlers[EventSendJoinGame] = JoinGameHandler
	m.handlers[EventSendStartGame] = StartGameHandler
	m.handlers[EventSendPlayerMove] = PlayerMoveHandler
	m.handlers[EventSendPlayerShoot] = PlayerShootHandler
	m.handlers[EventSendPlayerIncreaseRange] = PlayerIncreaseRangeHandler
	m.handlers[EventSendPlayerGiveActionPoint] = PlayerGiveActionPointHandler
}

func (m *Manager) routeEvent(event Event, c *Client) error {
	if handler, ok := m.handlers[event.Type]; ok {
		if err := handler(event, c); err != nil {
			return err
		}
		return nil
	} else {
		return errors.New("there is no such event type")
	}
}

func (m *Manager) serveWS(w http.ResponseWriter, r *http.Request) {
	log.Println("new connection")

	conn, err := websocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := NewClient(conn, m)

	m.addClient(client)

	go client.readMessages()
	go client.writeMessages()
}

func (m *Manager) addClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	m.clients[client] = true
}

func (m *Manager) removeClient(client *Client) {
	m.Lock()
	defer m.Unlock()

	if _, ok := m.clients[client]; ok {
		client.connection.Close()
		delete(m.clients, client)
	}
}

func (m *Manager) startGameCleanupRoutine() {
	for {
		time.Sleep(1 * time.Minute)

		m.Lock()
		for gameID, game := range m.games {
			game.Lock()
			if game.State != nil && game.State.Status == "initialized" && time.Since(game.LastUpdate) >= 1*time.Minute {
				log.Printf("Deleting game: %s (Last updated: %v)", gameID, game.LastUpdate)
				delete(m.games, gameID)
			}
			game.Unlock()
		}
		m.Unlock()
	}
}

func (m *Manager) RemoveGame(gameID string) {
	m.Lock()
	defer m.Unlock()

	_, exists := m.games[gameID]
	if exists {
		delete(m.games, gameID)
	}
}

func checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	switch origin {
	case "https://localhost:8080":
		return true
	default:
		return false
	}
}
