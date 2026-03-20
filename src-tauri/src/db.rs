use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Autor {
    pub idx: String,
    pub autor_name: String,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Song {
    pub idx: String,
    pub song_name: String,
    pub autor_idx: Option<String>,
    pub song_year: Option<String>,
    pub song_content: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
    #[serde(rename = "autor")]
    pub autor: Option<Autor>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BibleBible {
    pub idx: i64,
    pub name: Option<String>,
    pub abreviation: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BibleBook {
    pub idx: i64,
    pub name: Option<String>,
    pub testament: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BibleVerse {
    pub idx: i64,
    pub bible_bible_idx: Option<i64>,
    pub bible_book_idx: Option<i64>,
    pub chapter: Option<i64>,
    pub verse: Option<i64>,
    pub text: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
}

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> SqliteResult<Self> {
        let conn = Connection::open(&db_path)?;
        // Use DELETE journal mode instead of WAL to avoid creating -shm/-wal
        // sidecar files that trigger Tauri's file watcher and cause rebuild loops.
        conn.execute_batch("PRAGMA journal_mode=DELETE; PRAGMA foreign_keys=ON;")?;

        // Create tables if not exist (Sequelize-compatible schema)
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS `autors` (
                `idx` VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY,
                `autor_name` VARCHAR(255) NOT NULL UNIQUE,
                `createdAt` DATETIME,
                `updatedAt` DATETIME
            );

            CREATE TABLE IF NOT EXISTS `songs` (
                `idx` VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY,
                `song_name` VARCHAR(255) NOT NULL UNIQUE,
                `autor_idx` VARCHAR(255),
                `song_year` VARCHAR(255),
                `song_content` TEXT,
                `createdAt` DATETIME,
                `updatedAt` DATETIME
            );

            CREATE TABLE IF NOT EXISTS `bible_bibles` (
                `idx` INTEGER PRIMARY KEY AUTOINCREMENT,
                `name` TEXT NOT NULL,
                `abreviation` TEXT NOT NULL,
                `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
                `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS `bible_books` (
                `idx` INTEGER PRIMARY KEY AUTOINCREMENT,
                `name` TEXT NOT NULL,
                `testament` TEXT NOT NULL,
                `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
                `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS `bible_verses` (
                `idx` INTEGER PRIMARY KEY AUTOINCREMENT,
                `bible_bible_idx` INTEGER NOT NULL,
                `bible_book_idx` INTEGER NOT NULL,
                `chapter` INTEGER NOT NULL,
                `verse` INTEGER NOT NULL,
                `text` TEXT NOT NULL,
                `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
                `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_verses_bible ON bible_verses (bible_bible_idx);
            CREATE INDEX IF NOT EXISTS idx_verses_book ON bible_verses (bible_book_idx);
            CREATE INDEX IF NOT EXISTS idx_verses_verse ON bible_verses (verse);
            CREATE INDEX IF NOT EXISTS idx_verses_chapter ON bible_verses (chapter);
            ",
        )?;

        println!("Conexión a SQLite establecida.");
        println!("Modelos sincronizados.");

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }
}
