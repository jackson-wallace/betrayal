package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	setupAPI()

	port := goDotEnvVariable("PORT")
	if port == "" {
		port = "8080"
	}

	log.Fatal(http.ListenAndServeTLS(":"+port, "./certs/server.crt", "./certs/server.key", nil))
}

func setupAPI() {

	ctx := context.Background()

	manager := NewManager(ctx)

	http.Handle("/", http.FileServer(http.Dir("./web/dist")))
	http.HandleFunc("/ws", manager.serveWS)
}

func goDotEnvVariable(key string) string {
	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	return os.Getenv(key)
}
