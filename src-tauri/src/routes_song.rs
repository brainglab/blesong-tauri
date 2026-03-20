use axum::{extract::State, http::StatusCode, Json};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;

use crate::db::{Database, Song, Autor};
use crate::helpers::generate_uuid;

#[derive(Debug, Deserialize)]
pub struct SongAllRequest {
    pub song: Option<SongFilter>,
    pub order: OrderParams,
    pub page: i64,
}

#[derive(Debug, Deserialize)]
pub struct SongFilter {
    pub song_name: Option<String>,
    pub autor_idx: Option<String>,
    pub song_year: Option<String>,
    pub song_content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct OrderParams {
    pub order_field: Option<String>,
    pub order_direction: Option<String>,
    pub order_count: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct IdxRequest {
    pub idx: String,
}

#[derive(Debug, Deserialize)]
pub struct SongCreateRequest {
    pub song: SongData,
}

#[derive(Debug, Deserialize)]
pub struct SongData {
    pub song_name: String,
    pub autor_idx: Option<String>,
    pub song_year: Option<String>,
    pub song_content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SongUpdateRequest {
    pub song: SongData,
    pub idx: String,
}

// GET ALL
pub async fn all(
    State(db): State<Arc<Database>>,
    Json(body): Json<SongAllRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();
    let per_page = if body.order.order_count.unwrap_or(0) == 0 {
        30
    } else {
        body.order.order_count.unwrap_or(30)
    };
    let page = if body.page <= 0 { 0 } else { body.page };
    let offset = per_page * page;

    let order_field = body.order.order_field.as_deref().unwrap_or("song_name");
    let order_dir = body.order.order_direction.as_deref().unwrap_or("ASC");

    // Prefix order field with table alias if it's a song field
    let order_clause = match order_field {
        "autor_name" => format!("a.autor_name {}", order_dir),
        f => format!("s.{} {}", f, order_dir),
    };

    let mut where_clause = String::from("1=1");
    let mut params_vec: Vec<String> = Vec::new();

    if let Some(ref song) = body.song {
        if let Some(ref name) = song.song_name {
            where_clause.push_str(" AND s.song_name LIKE ?");
            params_vec.push(format!("%{}%", name));
        }
        if let Some(ref autor_idx) = song.autor_idx {
            where_clause.push_str(" AND s.autor_idx LIKE ?");
            params_vec.push(format!("%{}%", autor_idx));
        }
        if let Some(ref year) = song.song_year {
            where_clause.push_str(" AND s.song_year LIKE ?");
            params_vec.push(format!("%{}%", year));
        }
        if let Some(ref content) = song.song_content {
            where_clause.push_str(" AND s.song_content LIKE ?");
            params_vec.push(format!("%{}%", content));
        }
    }

    let count_sql = format!(
        "SELECT COUNT(*) FROM songs s WHERE {}",
        where_clause
    );

    let query_sql = format!(
        "SELECT s.idx, s.song_name, s.autor_idx, s.song_year, s.song_content, s.createdAt, s.updatedAt, \
         a.idx as a_idx, a.autor_name, a.createdAt as a_createdAt, a.updatedAt as a_updatedAt \
         FROM songs s LEFT JOIN autors a ON s.autor_idx = a.idx \
         WHERE {} ORDER BY {} LIMIT ? OFFSET ?",
        where_clause, order_clause
    );

    let total: i64 = match params_vec.len() {
        0 => conn.query_row(&count_sql, [], |row| row.get(0)).unwrap_or(0),
        _ => conn
            .query_row(&count_sql, rusqlite::params_from_iter(&params_vec), |row| {
                row.get(0)
            })
            .unwrap_or(0),
    };

    let mut query_params: Vec<String> = params_vec.clone();
    query_params.push(per_page.to_string());
    query_params.push(offset.to_string());

    let mut stmt = match conn.prepare(&query_sql) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            );
        }
    };

    let songs: Vec<Song> = stmt
        .query_map(rusqlite::params_from_iter(&query_params), |row| {
            let a_idx: Option<String> = row.get(7)?;
            let autor = a_idx.map(|idx| Autor {
                idx,
                autor_name: row.get(8).unwrap_or_default(),
                created_at: row.get(9).ok(),
                updated_at: row.get(10).ok(),
            });

            Ok(Song {
                idx: row.get(0)?,
                song_name: row.get(1)?,
                autor_idx: row.get(2)?,
                song_year: row.get(3)?,
                song_content: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                autor,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    let size = songs.len() as i64;
    let pages = if total > 0 {
        (total as f64 / per_page as f64).ceil() as i64
    } else {
        0
    };

    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "songs": songs,
            "from": offset + 1,
            "to": offset + size,
            "size": size,
            "total": total,
            "page": page,
            "pages": pages,
        })),
    )
}

// SELECTION
pub async fn selection(
    State(db): State<Arc<Database>>,
    Json(body): Json<serde_json::Value>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    let mut where_clause = String::from("1=1");
    let mut params_vec: Vec<String> = Vec::new();

    if let Some(song) = body.get("song") {
        if let Some(name) = song.get("song_name").and_then(|v| v.as_str()) {
            where_clause.push_str(" AND s.song_name LIKE ?");
            params_vec.push(format!("%{}%", name));
        }
        if let Some(autor_idx) = song.get("autor_idx").and_then(|v| v.as_str()) {
            where_clause.push_str(" AND s.autor_idx LIKE ?");
            params_vec.push(format!("%{}%", autor_idx));
        }
        if let Some(year) = song.get("song_year").and_then(|v| v.as_str()) {
            where_clause.push_str(" AND s.song_year LIKE ?");
            params_vec.push(format!("%{}%", year));
        }
        if let Some(content) = song.get("song_content").and_then(|v| v.as_str()) {
            where_clause.push_str(" AND s.song_content LIKE ?");
            params_vec.push(format!("%{}%", content));
        }
    }

    let query_sql = format!(
        "SELECT s.idx, s.song_name, a.autor_name \
         FROM songs s LEFT JOIN autors a ON s.autor_idx = a.idx \
         WHERE {} ORDER BY s.song_name ASC",
        where_clause
    );

    let mut stmt = match conn.prepare(&query_sql) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            );
        }
    };

    let songs: Vec<Value> = stmt
        .query_map(rusqlite::params_from_iter(&params_vec), |row| {
            let idx: String = row.get(0)?;
            let name: String = row.get(1)?;
            let description: Option<String> = row.get(2)?;
            Ok(json!({
                "idx": idx,
                "name": name,
                "description": description
            }))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "songs": songs,
        })),
    )
}

// GET ONE
pub async fn get(
    State(db): State<Arc<Database>>,
    Json(body): Json<IdxRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    let result = conn.query_row(
        "SELECT s.idx, s.song_name, s.autor_idx, s.song_year, s.song_content, s.createdAt, s.updatedAt, \
         a.idx, a.autor_name, a.createdAt, a.updatedAt \
         FROM songs s LEFT JOIN autors a ON s.autor_idx = a.idx WHERE s.idx = ?1",
        rusqlite::params![body.idx],
        |row| {
            let a_idx: Option<String> = row.get(7)?;
            let autor = a_idx.map(|idx| Autor {
                idx,
                autor_name: row.get(8).unwrap_or_default(),
                created_at: row.get(9).ok(),
                updated_at: row.get(10).ok(),
            });

            Ok(Song {
                idx: row.get(0)?,
                song_name: row.get(1)?,
                autor_idx: row.get(2)?,
                song_year: row.get(3)?,
                song_content: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                autor,
            })
        },
    );

    match result {
        Ok(song) => (
            StatusCode::OK,
            Json(json!({
                "code": "00",
                "msg": "success",
                "song": song,
            })),
        ),
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "code": "01",
                "msg": "success",
                "song": null,
            })),
        ),
    }
}

// CREATE
pub async fn create(
    State(db): State<Arc<Database>>,
    Json(body): Json<SongCreateRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    // Check duplicate
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM songs WHERE song_name LIKE ?1",
            rusqlite::params![format!("%{}%", body.song.song_name)],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if exists {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"code": "20", "msg": "Ya existe una canción con este nombre"})),
        );
    }

    let idx = generate_uuid();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    match conn.execute(
        "INSERT INTO songs (idx, song_name, autor_idx, song_year, song_content, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            idx,
            body.song.song_name,
            body.song.autor_idx,
            body.song.song_year,
            body.song.song_content,
            now,
            now
        ],
    ) {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({"code": "00", "msg": "success"})),
        ),
        Err(e) => {
            eprintln!("Error: {}", e);
            if e.to_string().contains("UNIQUE") {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"code": "20", "msg": "Registro duplicado"})),
                )
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"code": "98", "msg": "Error inesperado"})),
                )
            }
        }
    }
}

// UPDATE
pub async fn update(
    State(db): State<Arc<Database>>,
    Json(body): Json<SongUpdateRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    // Check duplicate excluding current
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM songs WHERE song_name LIKE ?1 AND idx != ?2",
            rusqlite::params![format!("%{}%", body.song.song_name), body.idx],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if exists {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"code": "20", "msg": "Ya existe una canción con este nombre"})),
        );
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    match conn.execute(
        "UPDATE songs SET song_name = ?1, autor_idx = ?2, song_year = ?3, song_content = ?4, updatedAt = ?5 WHERE idx = ?6",
        rusqlite::params![
            body.song.song_name,
            body.song.autor_idx,
            body.song.song_year,
            body.song.song_content,
            now,
            body.idx
        ],
    ) {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({"code": "00", "msg": "success"})),
        ),
        Err(e) => {
            eprintln!("Error: {}", e);
            if e.to_string().contains("UNIQUE") {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"code": "20", "msg": "Registro duplicado"})),
                )
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"code": "98", "msg": "Error inesperado"})),
                )
            }
        }
    }
}

// REMOVE
pub async fn remove(
    State(db): State<Arc<Database>>,
    Json(body): Json<IdxRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    match conn.execute("DELETE FROM songs WHERE idx = ?1", rusqlite::params![body.idx]) {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({"code": "00", "msg": "success"})),
        ),
        Err(e) => {
            eprintln!("Error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            )
        }
    }
}
