mod db;
mod helpers;
mod routes_autor;
mod routes_bible;
mod routes_server;
mod routes_song;

use axum::{
    routing::post,
    Router,
};
use db::Database;
use helpers::get_local_ip;
use routes_server::ServerConfig;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};

fn get_db_path() -> PathBuf {
    // The seed database (read-only template) lives in src-tauri/resources/.
    // We MUST NOT use it directly because SQLite WAL creates -shm/-wal files
    // next to it, which triggers Tauri's file watcher and causes an infinite
    // rebuild loop in dev mode.
    //
    // Strategy: copy the seed to a working directory outside src-tauri/ and
    // use that copy for all operations.

    let cwd = std::env::current_dir().unwrap_or_default();

    // ── Working copy location (outside src-tauri/) ──
    let work_dir = cwd.join("../data");
    let work_db = work_dir.join("data.sqlite");

    // ── Seed locations (checked in order) ──
    let seed_candidates: Vec<PathBuf> = vec![
        cwd.join("resources/data.sqlite"),                              // dev
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.join("../Resources/resources/data.sqlite")))
            .unwrap_or_default(),                                       // macOS prod
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.join("resources/data.sqlite")))
            .unwrap_or_default(),                                       // linux prod
    ];

    // If working copy already exists, just use it
    if work_db.exists() {
        return work_db;
    }

    // Otherwise, copy the seed
    for seed in &seed_candidates {
        if seed.exists() {
            std::fs::create_dir_all(&work_dir).ok();
            if std::fs::copy(seed, &work_db).is_ok() {
                println!("Copied seed database to {:?}", work_db);
                return work_db;
            }
        }
    }

    // Never fall back to using the seed in resources/ – that creates WAL files
    // which trigger Tauri's file watcher and cause an infinite rebuild loop.
    // Instead, panic early so the developer knows the seed is missing.
    panic!(
        "Could not find or copy seed database. Checked candidates: {:?}",
        seed_candidates
    )
}

/// Resolve the directory containing the built Angular frontend.
/// In dev mode: blesong-angular/dist/blesong/browser (relative to workspace root).
/// In production macOS bundle: ../Resources/www/browser.
/// In production Linux: alongside the binary in www/browser.
fn get_frontend_dist_path() -> Option<PathBuf> {
    let cwd = std::env::current_dir().unwrap_or_default();
    let candidates: Vec<PathBuf> = vec![
        cwd.join("blesong-angular/dist/blesong/browser"),               // dev (cwd = workspace root)
        cwd.join("../blesong-angular/dist/blesong/browser"),            // dev (cwd = src-tauri)
        std::env::current_exe()
            .ok()
            .map(|p| p.parent().unwrap().join("../Resources/www/browser"))
            .unwrap_or_default(),                                       // macOS prod bundle
        std::env::current_exe()
            .ok()
            .map(|p| p.parent().unwrap().join("www/browser"))
            .unwrap_or_default(),                                       // linux prod
    ];
    for c in &candidates {
        if c.join("index.html").exists() {
            println!("Serving frontend from: {:?}", c);
            return Some(c.clone());
        }
    }
    eprintln!("WARNING: No frontend dist directory found. Static file serving disabled.");
    None
}

fn start_http_server(db: Arc<Database>, server_config: Arc<ServerConfig>) {
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let cors = CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any);

            // Autor routes
            let autor_routes = Router::new()
                .route("/all", post(routes_autor::all))
                .route("/selection", post(routes_autor::selection))
                .route("/get", post(routes_autor::get))
                .route("/create", post(routes_autor::create))
                .route("/update", post(routes_autor::update))
                .route("/remove", post(routes_autor::remove))
                .with_state(db.clone());

            // Song routes
            let song_routes = Router::new()
                .route("/all", post(routes_song::all))
                .route("/selection", post(routes_song::selection))
                .route("/get", post(routes_song::get))
                .route("/create", post(routes_song::create))
                .route("/update", post(routes_song::update))
                .route("/remove", post(routes_song::remove))
                .with_state(db.clone());

            // Bible routes
            let bible_routes = Router::new()
                .route("/selection", post(routes_bible::selection))
                .route("/selection_books", post(routes_bible::selection_books))
                .route("/selection_chapters", post(routes_bible::selection_chapters))
                .route("/selection_verses", post(routes_bible::selection_verses))
                .with_state(db.clone());

            // Server routes
            let server_routes = Router::new()
                .route("/get", post(routes_server::get))
                .with_state(server_config.clone());

            let mut app = Router::new()
                .nest("/api/autors", autor_routes)
                .nest("/api/songs", song_routes)
                .nest("/api/bible_bibles", bible_routes)
                .nest("/api/server", server_routes);

            // Serve the Angular SPA for external devices (QR code access)
            if let Some(dist) = get_frontend_dist_path() {
                let index = dist.join("index.html");
                let serve_dir = ServeDir::new(&dist)
                    .not_found_service(ServeFile::new(&index));
                app = app.fallback_service(serve_dir);
            }

            let app = app.layer(cors);

            let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
            let local_ip = get_local_ip();

            match tokio::net::TcpListener::bind(addr).await {
                Ok(listener) => {
                    println!("Servidor ejecutándose en http://{}:8080", local_ip);
                    if let Err(e) = axum::serve(listener, app).await {
                        eprintln!("HTTP server error: {:?}", e);
                    }
                }
                Err(e) => {
                    eprintln!("Could not bind HTTP server to port 8080 (already in use?): {:?}", e);
                }
            }
        });
    });
}

fn start_mqtt_broker() {
    std::thread::spawn(|| {
        use rumqttd::{Broker, Config};

        let ws_settings = rumqttd::ServerSettings {
            name: "ws-blesong".to_string(),
            listen: ([0, 0, 0, 0], 8081).into(),
            tls: None,
            next_connection_delay_ms: 1,
            connections: rumqttd::ConnectionSettings {
                connection_timeout_ms: 5000,
                max_payload_size: 5120,
                max_inflight_count: 100,
                auth: None,
                external_auth: None,
                dynamic_filters: false,
            },
        };

        let config = Config {
            id: 0,
            router: rumqttd::RouterConfig {
                max_connections: 100,
                max_outgoing_packet_count: 200,
                max_segment_size: 104857600,
                max_segment_count: 10,
                custom_segment: None,
                initialized_filters: None,
                ..Default::default()
            },
            v4: None,
            v5: None,
            ws: Some({
                let mut servers = std::collections::HashMap::new();
                servers.insert("ws".to_string(), ws_settings);
                servers
            }),
            cluster: None,
            console: None,
            prometheus: None,
            bridge: None,
            metrics: None,
        };

        let local_ip = get_local_ip();
        println!("Servidor MQTT WebSocket ejecutándose en ws://{}:8081", local_ip);

        // Retry up to 3 times with a short delay to handle port-in-use after restart
        for attempt in 1..=3 {
            let mut broker = Broker::new(config.clone());
            match broker.start() {
                Ok(_) => break,
                Err(e) => {
                    eprintln!("MQTT broker start attempt {}/3 failed: {:?}", attempt, e);
                    if attempt < 3 {
                        std::thread::sleep(std::time::Duration::from_secs(2));
                    }
                }
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db_path = get_db_path();
    println!("Database path: {:?}", db_path);
    let database = Arc::new(Database::new(db_path).expect("Failed to initialize database"));

    let local_ip = get_local_ip();
    let server_config = Arc::new(ServerConfig {
        port: 8080,
        ip: local_ip.clone(),
    });

    // Start HTTP server (Express replacement)
    start_http_server(database.clone(), server_config);

    // Start MQTT broker (Aedes replacement)
    start_mqtt_broker();

    // Start Tauri application
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
