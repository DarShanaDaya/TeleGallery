import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { DATA_DIR } from './config.js';

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'telegallery.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	tg_id TEXT UNIQUE,
	username TEXT,
	first_name TEXT,
	last_name TEXT,
	photo_url TEXT,
	language TEXT,
	is_demo INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TEXT NOT NULL,
	expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
	id TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	parent_id TEXT,
	name TEXT NOT NULL,
	kind TEXT NOT NULL CHECK (kind IN ('file','folder')),
	size INTEGER NOT NULL DEFAULT 0,
	mime TEXT,
	storage TEXT NOT NULL DEFAULT 'local',
	deleted_at TEXT,
	starred INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
	idx INTEGER NOT NULL,
	size INTEGER NOT NULL,
	tg_chat_id TEXT,
	tg_message_id INTEGER,
	tg_file_id TEXT,
	blob_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_user_parent ON files(user_id, parent_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_parts_file ON parts(file_id, idx);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`);

export const nowIso = () => new Date().toISOString();
