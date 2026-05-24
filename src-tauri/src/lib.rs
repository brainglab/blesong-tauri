mod db;
mod helpers;
mod routes_autor;
mod routes_bible;
mod routes_server;
mod routes_song;

use axum::{
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use db::Database;
use helpers::get_local_ip;
use routes_bible::BibleConfig;
use routes_server::ServerConfig;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

fn mime_for_path(path: &std::path::Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase().as_str() {
        "html" | "htm" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "otf" => "font/otf",
        "eot" => "application/vnd.ms-fontobject",
        "wasm" => "application/wasm",
        "map" => "application/json; charset=utf-8",
        "txt" => "text/plain; charset=utf-8",
        "xml" => "application/xml; charset=utf-8",
        "pdf" => "application/pdf",
        "mp3" => "audio/mpeg",
        "mp4" => "video/mp4",
        _ => "application/octet-stream",
    }
}

/// Per-user, writable data directory for Blesong.
///   Windows : %APPDATA%\Blesong
///   macOS   : $HOME/Library/Application Support/Blesong
///   Linux   : $XDG_DATA_HOME/Blesong  (default ~/.local/share/Blesong)
fn user_app_data_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("APPDATA").map(|p| PathBuf::from(p).join("Blesong"))
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var_os("HOME")
            .map(|p| PathBuf::from(p).join("Library/Application Support/Blesong"))
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("HOME").map(|p| PathBuf::from(p).join(".local/share")))
            .map(|p| p.join("Blesong"))
    }
}

fn get_db_path() -> PathBuf {
    // The working copy of the database has to live somewhere writable.
    //
    //   On Windows the binary is usually installed under C:\Program Files\,
    //   which is read-only for non-admin users — so we prefer %APPDATA%
    //   there. On Unix we keep the portable layout (data/ next to the
    //   binary) as the primary location.
    //
    // Dev mode (cwd = src-tauri/) still falls back to ../data/.

    let cwd = std::env::current_dir().unwrap_or_default();
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| cwd.clone());

    let mut work_candidates: Vec<PathBuf> = Vec::new();
    #[cfg(target_os = "windows")]
    {
        if let Some(d) = user_app_data_dir() {
            work_candidates.push(d.join("data.sqlite"));
        }
        work_candidates.push(exe_dir.join("data/data.sqlite"));
    }
    #[cfg(not(target_os = "windows"))]
    {
        work_candidates.push(exe_dir.join("data/data.sqlite"));
        if let Some(d) = user_app_data_dir() {
            work_candidates.push(d.join("data.sqlite"));
        }
    }
    work_candidates.push(cwd.join("../data/data.sqlite"));

    for c in &work_candidates {
        if c.exists() {
            return c.clone();
        }
    }

    // No existing working copy — find the seed and copy it to the first
    // writable candidate.
    let seed_candidates: Vec<PathBuf> = vec![
        exe_dir.join("resources/data.sqlite"),               // portable: next to binary
        cwd.join("resources/data.sqlite"),                   // dev (cwd = src-tauri)
        exe_dir.join("../Resources/resources/data.sqlite"),  // macOS bundle
    ];

    let seed = match seed_candidates.iter().find(|p| p.exists()) {
        Some(p) => p.clone(),
        None => panic!(
            "Could not find seed database. Checked: {:?}",
            seed_candidates
        ),
    };

    for target in &work_candidates {
        if let Some(parent) = target.parent() {
            if std::fs::create_dir_all(parent).is_ok() && std::fs::copy(&seed, target).is_ok() {
                println!("Copied seed database to {:?}", target);
                return target.clone();
            }
        }
    }

    panic!(
        "Could not write working database to any candidate: {:?}",
        work_candidates
    );
}

/// Resolve the directory containing the built Angular frontend.
/// In dev mode: blesong-angular/dist/blesong/browser (relative to workspace root).
/// In production macOS bundle: ../Resources/www/browser.
/// In production Linux: alongside the binary in www/browser.
fn get_frontend_dist_path() -> Option<PathBuf> {
    let cwd = std::env::current_dir().unwrap_or_default();
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| cwd.clone());
    let candidates: Vec<PathBuf> = vec![
        exe_dir.join("www"),                                            // portable linux (next to binary)
        exe_dir.join("www/browser"),                                    // portable linux alt
        cwd.join("blesong-angular/dist/blesong/browser"),               // dev (cwd = workspace root)
        cwd.join("../blesong-angular/dist/blesong/browser"),            // dev (cwd = src-tauri)
        exe_dir.join("../Resources/www/browser"),                       // macOS prod bundle
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

fn start_http_server(db: Arc<Database>, server_config: Arc<ServerConfig>, bible_config: Arc<BibleConfig>) {
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
                .with_state(bible_config.clone());

            // Server routes
            let server_routes = Router::new()
                .route("/get", post(routes_server::get))
                .with_state(server_config.clone());

            let mut app = Router::new()
                .nest("/api/autors", autor_routes)
                .nest("/api/songs", song_routes)
                .nest("/api/bible_bibles", bible_routes)
                .nest("/api/server", server_routes);

            // Serve the Angular SPA for external devices (QR code access).
            // One unified fallback handler: serve the requested file if it exists,
            // otherwise serve index.html with HTTP 200 so the Angular router can
            // pick up deep links like /presenter/qr-menu.
            if let Some(dist) = get_frontend_dist_path() {
                let dist = Arc::new(dist);
                let spa_handler = get(move |uri: axum::http::Uri| {
                    let dist = dist.clone();
                    async move {
                        let req_path = uri.path().trim_start_matches('/');
                        // Block path traversal
                        if req_path.split('/').any(|s| s == "..") {
                            return axum::http::StatusCode::BAD_REQUEST.into_response();
                        }
                        let candidate = if req_path.is_empty() {
                            dist.join("index.html")
                        } else {
                            dist.join(req_path)
                        };
                        if candidate.is_file() {
                            if let Ok(body) = tokio::fs::read(&candidate).await {
                                let ct = mime_for_path(&candidate);
                                return (
                                    axum::http::StatusCode::OK,
                                    [(axum::http::header::CONTENT_TYPE, ct)],
                                    body,
                                )
                                    .into_response();
                            }
                        }
                        match tokio::fs::read(dist.join("index.html")).await {
                            Ok(body) => (
                                axum::http::StatusCode::OK,
                                [(axum::http::header::CONTENT_TYPE, "text/html; charset=utf-8")],
                                body,
                            )
                                .into_response(),
                            Err(_) => axum::http::StatusCode::NOT_FOUND.into_response(),
                        }
                    }
                });
                app = app.fallback(spa_handler);
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

    let bibles_dir = routes_bible::get_bibles_dir().unwrap_or_else(|| {
        let fallback = std::env::current_dir().unwrap_or_default().join("data/bibles");
        eprintln!("WARNING: bibles dir not found; using fallback {:?}", fallback);
        fallback
    });
    println!("Bibles dir: {:?}", bibles_dir);
    let bible_config = Arc::new(BibleConfig { dir: bibles_dir });

    // Start HTTP server (Express replacement)
    start_http_server(database.clone(), server_config, bible_config);

    // Start MQTT broker (Aedes replacement)
    start_mqtt_broker();

    // Start Tauri application
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
