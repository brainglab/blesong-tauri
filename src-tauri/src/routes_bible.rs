use axum::{extract::State, http::StatusCode, Json};
use once_cell::sync::Lazy;
use regex::Regex;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::Arc;

// ---------------------------------------------------------------- state

/// Resolves the directory containing the `.bblx` files. Falls back through
/// a small list of well-known locations so the same code works in dev (cwd
/// = src-tauri or repo root) and in production bundles.
pub fn get_bibles_dir() -> Option<PathBuf> {
    let cwd = std::env::current_dir().unwrap_or_default();
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.to_path_buf()))
        .unwrap_or_else(|| cwd.clone());

    let candidates: Vec<PathBuf> = vec![
        cwd.join("data/bibles"),                               // repo root
        cwd.join("../data/bibles"),                            // src-tauri dev
        exe_dir.join("resources/bibles"),                      // portable
        exe_dir.join("../Resources/resources/bibles"),         // macOS bundle
    ];

    candidates.into_iter().find(|p| p.is_dir())
}

#[derive(Clone)]
pub struct BibleConfig {
    pub dir: PathBuf,
}

// ---------------------------------------------------------------- helpers

/// Strips RTF control words and braces, decodes `\'XX` (Windows-1252 byte)
/// escapes, collapses runs of whitespace. `\par` becomes a newline.
fn strip_rtf(input: &str) -> String {
    static HEX_ESC: Lazy<Regex> = Lazy::new(|| Regex::new(r"\\'([0-9a-fA-F]{2})").unwrap());
    static CTRL_WORD: Lazy<Regex> = Lazy::new(|| Regex::new(r"\\[a-zA-Z]+-?\d*\s?").unwrap());
    static MULTI_SPACE: Lazy<Regex> = Lazy::new(|| Regex::new(r"[ \t]+").unwrap());
    static MULTI_NL: Lazy<Regex> = Lazy::new(|| Regex::new(r"\n\s*\n+").unwrap());

    // `\par` → newline (do before generic control-word strip).
    let mut s = input.replace("\\par", "\n");

    // `\'XX` → the matching character. Latin-1 ⊂ Unicode codepoints so a
    // direct cast covers the Spanish accent range cleanly.
    s = HEX_ESC
        .replace_all(&s, |c: &regex::Captures| {
            let byte = u8::from_str_radix(&c[1], 16).unwrap_or(b'?');
            char::from(byte).to_string()
        })
        .to_string();

    // Remove other control words / control symbols.
    s = CTRL_WORD.replace_all(&s, "").to_string();

    // Braces are RTF group markers — drop them but keep their inner text.
    s = s.replace('{', "").replace('}', "");

    // Tidy whitespace.
    s = MULTI_SPACE.replace_all(&s, " ").to_string();
    s = MULTI_NL.replace_all(&s, "\n").to_string();
    s.trim().to_string()
}

/// Canonical 66-book ordering used by e-Sword `.bblx` modules.
const BOOK_NAMES_ES: [&str; 66] = [
    // Antiguo Testamento (1–39)
    "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio",
    "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel",
    "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras",
    "Nehemías", "Ester", "Job", "Salmos", "Proverbios",
    "Eclesiastés", "Cantares", "Isaías", "Jeremías", "Lamentaciones",
    "Ezequiel", "Daniel", "Oseas", "Joel", "Amós",
    "Abdías", "Jonás", "Miqueas", "Nahum", "Habacuc",
    "Sofonías", "Hageo", "Zacarías", "Malaquías",
    // Nuevo Testamento (40–66)
    "Mateo", "Marcos", "Lucas", "Juan", "Hechos",
    "Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios",
    "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo",
    "2 Timoteo", "Tito", "Filemón", "Hebreos", "Santiago",
    "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan",
    "Judas", "Apocalipsis",
];

fn book_name(book_id: i64) -> Option<&'static str> {
    if (1..=66).contains(&book_id) {
        Some(BOOK_NAMES_ES[(book_id - 1) as usize])
    } else {
        None
    }
}

fn testament_for(book_id: i64) -> &'static str {
    if book_id <= 39 { "AT" } else { "NT" }
}

/// Resolve a bible filename to a path inside the configured bibles dir,
/// rejecting traversal attempts.
fn resolve_bible_path(config: &BibleConfig, filename: &str) -> Option<PathBuf> {
    if filename.contains('/') || filename.contains('\\') || filename.contains("..") {
        return None;
    }
    let path = config.dir.join(filename);
    if path.is_file() { Some(path) } else { None }
}

// ---------------------------------------------------------------- /selection (list bibles)

#[derive(Debug, Serialize)]
pub struct BibleListItem {
    pub idx: String,
    pub name: String,
    pub abreviation: String,
}

pub async fn selection(
    State(config): State<Arc<BibleConfig>>,
) -> (StatusCode, Json<Value>) {
    let mut items: Vec<BibleListItem> = Vec::new();

    let entries = match std::fs::read_dir(&config.dir) {
        Ok(e) => e,
        Err(_) => {
            return (
                StatusCode::OK,
                Json(json!({ "code": "00", "msg": "success", "bible_bibles": [] })),
            );
        }
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("bblx") {
            continue;
        }
        let filename = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };

        // Read Details (Description, Abbreviation). If the open fails or the
        // table is missing we still surface the file with sensible defaults.
        let (description, abbreviation) = match Connection::open(&path) {
            Ok(conn) => conn
                .query_row(
                    "SELECT Description, Abbreviation FROM Details LIMIT 1",
                    [],
                    |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
                )
                .unwrap_or_else(|_| (filename.clone(), filename.clone())),
            Err(_) => (filename.clone(), filename.clone()),
        };

        items.push(BibleListItem {
            idx: filename.clone(),
            name: description,
            abreviation: abbreviation,
        });
    }

    items.sort_by(|a, b| a.name.cmp(&b.name));

    (
        StatusCode::OK,
        Json(json!({ "code": "00", "msg": "success", "bible_bibles": items })),
    )
}

// ---------------------------------------------------------------- /selection_books

#[derive(Debug, Deserialize)]
pub struct SelectionBooksRequest {
    pub bible_bible_idx: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct BibleBookItem {
    pub idx: i64,
    pub name: String,
    pub testament: String,
}

pub async fn selection_books(
    State(config): State<Arc<BibleConfig>>,
    Json(body): Json<SelectionBooksRequest>,
) -> (StatusCode, Json<Value>) {
    let Some(filename) = body.bible_bible_idx else {
        return error("Missing bible_bible_idx");
    };
    let Some(path) = resolve_bible_path(&config, &filename) else {
        return error("Bible not found");
    };
    let conn = match Connection::open(&path) {
        Ok(c) => c,
        Err(e) => return error(&format!("Could not open bible: {}", e)),
    };

    let mut stmt = match conn.prepare("SELECT DISTINCT Book FROM Bible ORDER BY Book ASC") {
        Ok(s) => s,
        Err(e) => return error(&format!("Query failed: {}", e)),
    };
    let rows = stmt
        .query_map([], |row| row.get::<_, i64>(0))
        .unwrap();

    let books: Vec<BibleBookItem> = rows
        .flatten()
        .filter_map(|book| {
            book_name(book).map(|n| BibleBookItem {
                idx: book,
                name: n.to_string(),
                testament: testament_for(book).to_string(),
            })
        })
        .collect();

    (
        StatusCode::OK,
        Json(json!({ "code": "00", "msg": "success", "bible_books": books })),
    )
}

// ---------------------------------------------------------------- /selection_chapters

#[derive(Debug, Deserialize)]
pub struct SelectionChaptersRequest {
    pub bible_bible_idx: Option<String>,
    pub bible_book_idx: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct BibleChapterItem {
    pub chapter: i64,
}

pub async fn selection_chapters(
    State(config): State<Arc<BibleConfig>>,
    Json(body): Json<SelectionChaptersRequest>,
) -> (StatusCode, Json<Value>) {
    let Some(filename) = body.bible_bible_idx else {
        return error("Missing bible_bible_idx");
    };
    let Some(book) = body.bible_book_idx else {
        return error("Missing bible_book_idx");
    };
    let Some(path) = resolve_bible_path(&config, &filename) else {
        return error("Bible not found");
    };
    let conn = match Connection::open(&path) {
        Ok(c) => c,
        Err(e) => return error(&format!("Could not open bible: {}", e)),
    };

    let mut stmt = match conn
        .prepare("SELECT DISTINCT Chapter FROM Bible WHERE Book = ?1 ORDER BY Chapter ASC")
    {
        Ok(s) => s,
        Err(e) => return error(&format!("Query failed: {}", e)),
    };
    let chapters: Vec<BibleChapterItem> = stmt
        .query_map(rusqlite::params![book], |row| {
            Ok(BibleChapterItem { chapter: row.get(0)? })
        })
        .map(|iter| iter.flatten().collect())
        .unwrap_or_default();

    (
        StatusCode::OK,
        Json(json!({ "code": "00", "msg": "success", "bible_chapters": chapters })),
    )
}

// ---------------------------------------------------------------- /selection_verses

#[derive(Debug, Deserialize)]
pub struct SelectionVersesRequest {
    pub bible_bible_idx: Option<String>,
    pub bible_book_idx: Option<i64>,
    pub bible_chapter_idx: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct BibleVerseItem {
    pub verse: i64,
    pub text: String,
}

pub async fn selection_verses(
    State(config): State<Arc<BibleConfig>>,
    Json(body): Json<SelectionVersesRequest>,
) -> (StatusCode, Json<Value>) {
    let Some(filename) = body.bible_bible_idx else {
        return error("Missing bible_bible_idx");
    };
    let Some(book) = body.bible_book_idx else {
        return error("Missing bible_book_idx");
    };
    let chapter: i64 = match body
        .bible_chapter_idx
        .as_deref()
        .and_then(|s| s.parse().ok())
    {
        Some(n) => n,
        None => return error("Missing bible_chapter_idx"),
    };

    let Some(path) = resolve_bible_path(&config, &filename) else {
        return error("Bible not found");
    };
    let conn = match Connection::open(&path) {
        Ok(c) => c,
        Err(e) => return error(&format!("Could not open bible: {}", e)),
    };

    let mut stmt = match conn.prepare(
        "SELECT Verse, Scripture FROM Bible WHERE Book = ?1 AND Chapter = ?2 ORDER BY Verse ASC",
    ) {
        Ok(s) => s,
        Err(e) => return error(&format!("Query failed: {}", e)),
    };

    let verses: Vec<BibleVerseItem> = stmt
        .query_map(rusqlite::params![book, chapter], |row| {
            let verse: i64 = row.get(0)?;
            let raw: String = row.get(1)?;
            Ok(BibleVerseItem { verse, text: strip_rtf(&raw) })
        })
        .map(|iter| iter.flatten().collect())
        .unwrap_or_default();

    (
        StatusCode::OK,
        Json(json!({ "code": "00", "msg": "success", "bible_verses": verses })),
    )
}

// ---------------------------------------------------------------- error helper

fn error(msg: &str) -> (StatusCode, Json<Value>) {
    eprintln!("bible route error: {}", msg);
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "code": "98", "msg": msg })),
    )
}
