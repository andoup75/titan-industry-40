package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

type Telemetry struct {
	Temperature float32 `json:"temperature"`
	Viscosity   float32 `json:"viscosity"`
	Conversion  float32 `json:"conversion"`
	Pressure    float32 `json:"pressure"`
	Timestamp   string  `json:"timestamp"`
}

type Command struct {
	Actuator string  `json:"actuator"`
	Value    float32 `json:"value"`
}

func main() {
	fmt.Println("🐹 Go Collector запущен на порту 8081")

	http.HandleFunc("/api/override", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var cmd Command
		if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
			return
		}

		fmt.Printf("🎮 Получена команда: %s = %.1f%%\n", cmd.Actuator, cmd.Value)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "Command sent to PLC"})
	})

	go func() {
		ticker := time.NewTicker(1 * time.Second)
		for range ticker.C {
			data := Telemetry{
				Temperature: 5.0 + rand.Float32()*1.5,
				Viscosity:   0.85 + rand.Float32()*0.1,
				Conversion:  63.0 + rand.Float32()*8.0,
				Pressure:    3.2 + rand.Float32()*0.3,
				Timestamp:   time.Now().Format(time.RFC3339),
			}

			jsonData, _ := json.Marshal(data)
			client := &http.Client{Timeout: 2 * time.Second}
			resp, err := client.Post("http://localhost:8080/api", "application/json", bytes.NewBuffer(jsonData))

			if err != nil {
				fmt.Printf("❌ Ошибка отправки: %v\n", err)
			} else {
				resp.Body.Close()
				fmt.Printf("✅ Отправлено: T=%.2f, Vis=%.3f, Conv=%.1f%%\n",
					data.Temperature, data.Viscosity, data.Conversion)
			}
		}
	}()

	http.ListenAndServe(":8081", nil)
}

