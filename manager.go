package main

import (
	"context"
	// "encoding/json"
	"errors"
	// "fmt"
	"log"
	"net/http"
	"sync"
	// "time"

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

	// otps RetentionMap

	handlers map[string]EventHandler
	games    map[string]Game
}

func NewManager(ctx context.Context) *Manager {
	m := &Manager{
		clients:  make(ClientList),
		handlers: make(map[string]EventHandler),
		games:    make(map[string]Game),
		// otps:     NewRetentionMap(ctx, 5*time.Second),
	}

	m.setupEventHandlers()
	return m
}

func (m *Manager) setupEventHandlers() {
	m.handlers[EventSendInitializeGame] = InitializeGameHandler
	// m.handlers[EventSendMessage] = SendMessage
	// m.handlers[EventChangeRoom] = ChatRoomHandler
}

func InitializeGameHandler(event Event, c *Client) error {
	log.Printf("event: %v", event)
	return nil
}

// func ChatRoomHandler(event Event, c *Client) error {
// 	var changeRoomEvent ChangeRoomEvent
//
// 	if err := json.Unmarshal(event.Payload, &changeRoomEvent); err != nil {
// 		return fmt.Errorf("Bad payload in request: %v", err)
// 	}
//
// 	c.chatroom = changeRoomEvent.Name
//
// 	return nil
// }
//
// func SendMessage(event Event, c *Client) error {
// 	var chatEvent SendMessageEvent
//
// 	if err := json.Unmarshal(event.Payload, &chatEvent); err != nil {
// 		return fmt.Errorf("bad payload in request: %v", err)
// 	}
//
// 	var broadMessage ReceiveMessageEvent
//
// 	broadMessage.Sent = time.Now()
// 	broadMessage.Message = chatEvent.Message
// 	broadMessage.From = chatEvent.From
//
// 	data, err := json.Marshal(broadMessage)
// 	if err != nil {
// 		return fmt.Errorf("failed to marshal broadcast message: %v", err)
// 	}
//
// 	outgoingEvent := Event{
// 		Payload: data,
// 		Type:    EventReceiveMessage,
// 	}
//
// 	for client := range c.manager.clients {
// 		if client.chatroom == c.chatroom {
// 			client.egress <- outgoingEvent
// 		}
// 	}
//
// 	return nil
// }

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

	// otp := r.URL.Query().Get("otp")
	// if otp == "" {
	// 	w.WriteHeader(http.StatusUnauthorized)
	// 	return
	// }

	// if !m.otps.VerifyOTP(otp) {
	// 	w.WriteHeader(http.StatusUnauthorized)
	// 	return
	// }

	log.Println("new connection")

	// upgrade regular http connection to websocket
	conn, err := websocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := NewClient(conn, m)

	m.addClient(client)

	// Start client processes
	go client.readMessages()
	go client.writeMessages()
}

// func (m *Manager) loginHandler(w http.ResponseWriter, r *http.Request) {
// 	type userLoginRequest struct {
// 		Username string `json:"username"`
// 		Password string `json:"password"`
// 	}
//
// 	var req userLoginRequest
//
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}
//
// 	// implement real authentication here
// 	if req.Username == "jackson" && req.Password == "123" {
// 		type response struct {
// 			OTP string `json:"otp"`
// 		}
//
// 		otp := m.otps.NewOtp()
//
// 		resp := response{
// 			OTP: otp.Key,
// 		}
//
// 		data, err := json.Marshal(resp)
// 		if err != nil {
// 			log.Println(err)
// 			return
// 		}
//
// 		w.WriteHeader(http.StatusOK)
// 		w.Write(data)
// 		return
// 	}
//
// 	w.WriteHeader(http.StatusUnauthorized)
// }

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

func checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	switch origin {
	case "https://localhost:8080":
		return true
	default:
		return false
	}
}
