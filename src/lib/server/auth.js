import crypto from 'node:crypto';
import { db, nowIso } from './db.js';
import { SESSION_DAYS } from './config.js';

export const SESSION_COOKIE = 'tg_session';
export const MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export function createSession(userId) {
	const id = crypto.randomBytes(32).toString('hex');
	const expires = new Date(Date.now() + MAX_AGE * 1000);
	db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?,?,?,?)').run(
		id,
		userId,
		nowIso(),
		expires.toISOString()
	);
	db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(nowIso(), userId);
	return { id, expires };
}

export function getSessionUser(sessionId) {
	if (!sessionId) return null;
	try {
		const row = db
			.prepare(
				`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
				 WHERE s.id = ? AND s.expires_at > ?`
			)
			.get(sessionId, nowIso());
		if (!row) return null;
		return {
			id: row.id,
			tgId: row.tg_id,
			username: row.username,
			firstName: row.first_name,
			lastName: row.last_name,
			photoUrl: row.photo_url,
			language: row.language,
			isDemo: Boolean(row.is_demo),
			createdAt: row.created_at
		};
	} catch {
		return null;
	}
}

export function deleteSession(sessionId) {
	if (!sessionId) return;
	db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function profileName(user) {
	if (!user) return 'Guest';
	return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Telegram user';
}

export function initials(user) {
	if (!user) return 'TG';
	const s = profileName(user)
		.replace(/[^\p{L}\p{N} ]/gu, '')
		.trim();
	if (!s) return 'TG';
	const parts = s.split(/\s+/);
	return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

/** Upsert a telegram (or demo) account and return the internal user row id. */
export function upsertUser({ tgId, username, firstName, lastName, photoUrl, language, isDemo = false }) {
	const existing = tgId ? db.prepare('SELECT * FROM users WHERE tg_id = ?').get(String(tgId)) : null;
	if (existing) {
		db.prepare(
			`UPDATE users SET username=?, first_name=?, last_name=?, photo_url=COALESCE(?, photo_url),
			 language=COALESCE(?, language), last_login_at=? WHERE id=?`
		).run(username ?? null, firstName ?? null, lastName ?? null, photoUrl ?? null, language ?? null, nowIso(), existing.id);
		return existing.id;
	}
	const info = db
		.prepare(
			`INSERT INTO users (tg_id, username, first_name, last_name, photo_url, language, is_demo, created_at, last_login_at)
			 VALUES (?,?,?,?,?,?,?,?,?)`
		)
		.run(tgId ?? null, username ?? null, firstName ?? null, lastName ?? null, photoUrl ?? null, language ?? null, isDemo ? 1 : 0, nowIso(), nowIso());
	return Number(info.lastInsertRowid);
}

export { crypto };
