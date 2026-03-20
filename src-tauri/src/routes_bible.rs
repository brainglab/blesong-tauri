use axum::{extract::State, http::StatusCode, Json};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;

use crate::db::{BibleBible, BibleBook, BibleVerse, Database};

#[derive(Debug, Deserialize)]
pub struct BibleBibleIdxRequest {
    #[allow(dead_code)]
    pub bible_bible_idx: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct BibleChapterRequest {
    pub bible_bible_idx: serde_json::Value,
    pub bible_book_idx: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct BibleVerseRequest {
    pub bible_bible_idx: serde_json::Value,
    pub bible_book_idx: serde_json::Value,
    pub bible_chapter_idx: serde_json::Value,
}

fn value_to_i64(v: &serde_json::Value) -> Option<i64> {
    v.as_i64().or_else(|| v.as_str().and_then(|s| s.parse::<i64>().ok()))
}

// SELECTION - get all bibles
pub async fn selection(State(db): State<Arc<Database>>) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    let mut stmt = match conn.prepare(
        "SELECT idx, name, abreviation, createdAt, updatedAt FROM bible_bibles",
    ) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            );
        }
    };

    let bibles: Vec<BibleBible> = stmt
        .query_map([], |row| {
            Ok(BibleBible {
                idx: row.get(0)?,
                name: row.get(1)?,
                abreviation: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "bible_bibles": bibles,
        })),
    )
}

// SELECTION BOOKS
pub async fn selection_books(
    State(db): State<Arc<Database>>,
    Json(_body): Json<BibleBibleIdxRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    let mut stmt = match conn.prepare(
        "SELECT idx, name, testament, createdAt, updatedAt FROM bible_books",
    ) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            );
        }
    };

    let books: Vec<BibleBook> = stmt
        .query_map([], |row| {
            Ok(BibleBook {
                idx: row.get(0)?,
                name: row.get(1)?,
                testament: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "bible_books": books,
        })),
    )
}

// SELECTION CHAPTERS
pub async fn selection_chapters(
    State(db): State<Arc<Database>>,
    Json(body): Json<BibleChapterRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    let bible_idx = value_to_i64(&body.bible_bible_idx).unwrap_or(0);
    let book_idx = value_to_i64(&body.bible_book_idx).unwrap_or(0);

    let mut stmt = match conn.prepare(
        "SELECT idx, bible_bible_idx, bible_book_idx, chapter, verse, text, createdAt, updatedAt \
         FROM bible_verses WHERE bible_bible_idx = ?1 AND bible_book_idx = ?2 GROUP BY chapter",
    ) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            );
        }
    };

    let chapters: Vec<BibleVerse> = stmt
        .query_map(rusqlite::params![bible_idx, book_idx], |row| {
            Ok(BibleVerse {
                idx: row.get(0)?,
                bible_bible_idx: row.get(1)?,
                bible_book_idx: row.get(2)?,
                chapter: row.get(3)?,
                verse: row.get(4)?,
                text: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "bible_chapters": chapters,
        })),
    )
}

// SELECTION VERSES
pub async fn selection_verses(
    State(db): State<Arc<Database>>,
    Json(body): Json<BibleVerseRequest>,
) -> (StatusCode, Json<Value>) {
    let conn = db.conn.lock().unwrap();

    let bible_idx = value_to_i64(&body.bible_bible_idx).unwrap_or(0);
    let book_idx = value_to_i64(&body.bible_book_idx).unwrap_or(0);
    let chapter_idx = value_to_i64(&body.bible_chapter_idx).unwrap_or(0);

    println!(
        "bible_bible_idx: {}, bible_book_idx: {}, bible_chapter_idx: {}",
        bible_idx, book_idx, chapter_idx
    );

    let mut stmt = match conn.prepare(
        "SELECT idx, bible_bible_idx, bible_book_idx, chapter, verse, text, createdAt, updatedAt \
         FROM bible_verses WHERE bible_bible_idx = ?1 AND bible_book_idx = ?2 AND chapter = ?3",
    ) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "98", "msg": "Error inesperado"})),
            );
        }
    };

    let verses: Vec<BibleVerse> = stmt
        .query_map(rusqlite::params![bible_idx, book_idx, chapter_idx], |row| {
            let mut text: Option<String> = row.get(5)?;
            // Clean special characters (same as Node version)
            if let Some(ref mut t) = text {
                *t = t.replace("{\\\\cf6 ", "\"");
                *t = t.replace("}", "\"");
            }
            Ok(BibleVerse {
                idx: row.get(0)?,
                bible_bible_idx: row.get(1)?,
                bible_book_idx: row.get(2)?,
                chapter: row.get(3)?,
                verse: row.get(4)?,
                text,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    (
        StatusCode::OK,
        Json(json!({
            "code": "00",
            "msg": "success",
            "bible_verses": verses,
        })),
    )
}
