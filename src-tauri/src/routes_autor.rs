use axum::{extract::State, http::StatusCode, Json};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;

use crate::db::{Autor, Database};
use crate::helpers::generate_uuid;

#[derive(Debug, Deserialize)]
pub struct AutorAllRequest {
    pub autor: Option<AutorFilter>,
    pub order: OrderParams,
    pub page: i64,
}

#[derive(Debug, Deserialize)]
pub struct AutorFilter {
    pub autor_name: Option<String>,
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
pub struct AutorCreateRequest {
    pub autor: AutorData,
}

#[derive(Debug, Deserialize)]
pub struct AutorData {
    pub autor_name: String,
}

#[derive(Debug, Deserialize)]
pub struct AutorUpdateRequest {
    pub autor: AutorData,
    pub idx: String,
}

// GET ALL
pub async fn all(
    State(db): State<Arc<Database>>,
    Json(body): Json<AutorAllRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();
    let per_page = if body.order.order_count.unwrap_or(0) == 0 {
        30
    } else {
        body.order.order_count.unwrap_or(30)
    };
    let page = if body.page <= 0 { 0 } else { body.page };
    let offset = per_page * page;

    let order_field = body
        .order
        .order_field
        .as_deref()
        .unwrap_or("createdAt");
    let order_dir = body
        .order
        .order_direction
        .as_deref()
        .unwrap_or("ASC");

    // Build WHERE clause
    let mut where_clause = String::from("1=1");
    let mut params_vec: Vec<String> = Vec::new();

    if let Some(ref autor) = body.autor {
        if let Some(ref name) = autor.autor_name {
            where_clause.push_str(" AND autor_name LIKE ?");
            params_vec.push(format!("%{}%", name));
        }
    }

    let count_sql = format!("SELECT COUNT(*) FROM autors WHERE {}", where_clause);
    let query_sql = format!(
        "SELECT idx, autor_name, createdAt, updatedAt FROM autors WHERE {} ORDER BY {} {} LIMIT ? OFFSET ?",
        where_clause, order_field, order_dir
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

    let autors: Vec<Autor> = stmt
        .query_map(rusqlite::params_from_iter(&query_params), |row| {
            Ok(Autor {
                idx: row.get(0)?,
                autor_name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    let size = autors.len() as i64;
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
            "autors": autors,
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
pub async fn selection(State(db): State<Arc<Database>>) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    let mut stmt = match conn
        .prepare("SELECT idx, autor_name FROM autors ORDER BY autor_name ASC")
    {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            );
        }
    };

    let autors: Vec<Value> = stmt
        .query_map([], |row| {
            let idx: String = row.get(0)?;
            let name: String = row.get(1)?;
            Ok(json!({"idx": idx, "name": name}))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "autors": autors,
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
        "SELECT idx, autor_name, createdAt, updatedAt FROM autors WHERE idx = ?1",
        rusqlite::params![body.idx],
        |row| {
            Ok(Autor {
                idx: row.get(0)?,
                autor_name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        },
    );

    match result {
        Ok(autor) => (
            StatusCode::OK,
            Json(json!({
                "code": "00",
                "msg": "success",
                "autor": autor,
            })),
        ),
        Err(_) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "code": "01",
                "msg": "success",
                "autor": null,
            })),
        ),
    }
}

// CREATE
pub async fn create(
    State(db): State<Arc<Database>>,
    Json(body): Json<AutorCreateRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    // Check duplicate
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM autors WHERE autor_name LIKE ?1",
            rusqlite::params![format!("%{}%", body.autor.autor_name)],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if exists {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"code": "20", "msg": "Ya existe un autor con ese nombre"})),
        );
    }

    let idx = generate_uuid();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    match conn.execute(
        "INSERT INTO autors (idx, autor_name, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![idx, body.autor.autor_name, now, now],
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
    Json(body): Json<AutorUpdateRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    // Check duplicate excluding current
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM autors WHERE autor_name LIKE ?1 AND idx != ?2",
            rusqlite::params![format!("%{}%", body.autor.autor_name), body.idx],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if exists {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"code": "20", "msg": "Ya existe un autor con ese nombre"})),
        );
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    match conn.execute(
        "UPDATE autors SET autor_name = ?1, updatedAt = ?2 WHERE idx = ?3",
        rusqlite::params![body.autor.autor_name, now, body.idx],
    ) {
        Ok(updated) => {
            if updated == 0 {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"code": "20", "msg": "Error al actualizar el autor"})),
                )
            } else {
                (
                    StatusCode::OK,
                    Json(json!({"code": "00", "msg": "success"})),
                )
            }
        }
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

    // Check if autor has songs
    let has_songs: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM songs WHERE autor_idx = ?1",
            rusqlite::params![body.idx],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if has_songs {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"code": "01", "msg": "No se puede eliminar el autor porque tiene canciones asociadas"})),
        );
    }

    match conn.execute("DELETE FROM autors WHERE idx = ?1", rusqlite::params![body.idx]) {
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
