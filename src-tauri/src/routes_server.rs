use axum::{extract::State, http::StatusCode, Json};
use serde_json::{json, Value};
use std::sync::Arc;

pub struct ServerConfig {
    pub port: u16,
    pub ip: String,
}

pub async fn get(
    State(config): State<Arc<ServerConfig>>,
) -> (StatusCode, Json<Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "ip": config.ip,
            "port": config.port,
            "hostname": config.ip,
            "url": "/api/server/get",
        })),
    )
}
