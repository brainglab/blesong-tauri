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
            ",
        )?;

        println!("Conexión a SQLite establecida.");
        println!("Modelos sincronizados.");

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }
}
