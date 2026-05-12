use warp::Filter;
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use futures_util::{SinkExt, StreamExt};
use warp::ws::{Message, WebSocket};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Telemetry {
    temperature: f32,
    viscosity: f32,
    conversion: f32,
    pressure: f32,
    timestamp: String,
}

type SharedData = Arc<Mutex<Telemetry>>;

#[tokio::main]
async fn main() {
    let data = SharedData::new(Mutex::new(Telemetry {
        temperature: 5.0,
        viscosity: 0.85,
        conversion: 63.0,
        pressure: 3.2,
        timestamp: chrono::Utc::now().to_rfc3339(),
    }));
    
    let data_filter = warp::any().map(move || data.clone());
    
    // API endpoint для приема данных от Go
    let api_route = warp::path("api")
        .and(warp::post())
        .and(warp::body::json())
        .and(data_filter.clone())
        .map(|telemetry: Telemetry, data: SharedData| {
            // Запускаем блокировку в отдельной задаче
            tokio::spawn(async move {
                let mut guard = data.lock().await;
                *guard = telemetry;
                println!("📥 Получены данные: T={:.2}, Vis={:.3}", guard.temperature, guard.viscosity);
            });
            warp::reply::json(&serde_json::json!({"status": "ok"}))
        });
    
    // WebSocket endpoint для фронтенда
    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(data_filter)
        .map(|ws: warp::ws::Ws, data| {
            ws.on_upgrade(move |socket| handle_socket(socket, data))
        });
    
    let routes = api_route.or(ws_route);
    
    println!("🔥 Rust сервер запущен на http://localhost:8080");
    warp::serve(routes).run(([127, 0, 0, 1], 8080)).await;
}

async fn handle_socket(ws: WebSocket, data: SharedData) {
    let (mut sender, mut receiver) = ws.split();
    let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(500));
    
    loop {
        tokio::select! {
            _ = interval.tick() => {
                let telemetry = data.lock().await.clone();
                if let Ok(json) = serde_json::to_string(&telemetry) {
                    sender.send(Message::text(json)).await.ok();
                }
            }
            _ = receiver.next() => {}
        }
    }
}
