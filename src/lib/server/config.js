import fs from 'node:fs';
import path from 'node:path';

/**
 * Minimal .env loader so the app behaves the same in `vite dev` and in production
 * (`node build/index.js`) without extra dependencies.
 */
function loadEnvFile() {
	for (const candidate of ['.env.local', '.env']) {
		try {
			const raw = fs.readFileSync(path.resolve(process.cwd(), candidate), 'utf8');
			for (const line of raw.split('\n')) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.startsWith('#')) continue;
				const eq = trimmed.indexOf('=');
				if (eq === -1) continue;
				const key = trimmed.slice(0, eq).trim();
				let value = trimmed.slice(eq + 1).trim();
				if (
					(value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))
				) {
					value = value.slice(1, -1);
				}
				if (process.env[key] === undefined) process.env[key] = value;
			}
		} catch {
			/* file is optional */
		}
	}
}

loadEnvFile();

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
export const BLOB_DIR = path.join(DATA_DIR, 'blobs');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(BLOB_DIR, { recursive: true });

export const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
export const BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '').trim();
export const STORAGE_CHAT_ID = (process.env.TELEGRAM_STORAGE_CHAT_ID || '').trim();
export const TELEGRAM_API = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(
	/\/$/,
	''
);
export const SESSION_SECRET = process.env.SESSION_SECRET || 'telegallery-dev-secret-change-me';
export const ALLOW_DEMO_LOGIN = (process.env.ALLOW_DEMO_LOGIN ?? 'true') !== 'false';
export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 4 * 1024 * 1024 * 1024);
export const CHUNK_SIZE = Number(process.env.TELEGRAM_CHUNK_SIZE || 45 * 1024 * 1024);
export const SITE_NAME = process.env.SITE_NAME || 'TeleDrive';
export const SESSION_DAYS = 30;

export const telegramEnabled = Boolean(BOT_TOKEN);
/** Telegram logins through the official widget need a public domain configured in BotFather. */
export const telegramLoginEnabled = Boolean(BOT_TOKEN && BOT_USERNAME);
