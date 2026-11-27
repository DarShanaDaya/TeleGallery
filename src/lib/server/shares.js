import crypto from 'node:crypto';
import { db, nowIso } from './db.js';
import { SESSION_SECRET } from './config.js';

const DAY = 24 * 60 * 60 * 1000;

function newToken() {
	// 24 bytes → 32 url-safe chars: long enough to be unguessable, short enough to paste.
	return crypto.randomBytes(24).toString('base64url');
}

function ownerFile(userId, fileId) {
	const row = db
		.prepare(`SELECT * FROM files WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND kind = 'file'`)
		.get(fileId, userId);
	if (!row) throw new Error('File not found');
	return row;
}

export function createShare(userId, fileId, { days = 0 } = {}) {
	const file = ownerFile(userId, fileId);
	const id = crypto.randomBytes(8).toString('hex');
	const token = newToken();
	const expiresAt = days > 0 ? new Date(Date.now() + days * DAY).toISOString() : null;
	db.prepare(
		`INSERT INTO shares (id, token, file_id, user_id, created_at, expires_at) VALUES (?,?,?,?,?,?)`
	).run(id, token, file.id, userId, nowIso(), expiresAt);
	return { id, token, fileId: file.id, expiresAt, url: `/s/${token}` };
}

export function listShares(userId, fileId) {
	return db
		.prepare('SELECT * FROM shares WHERE user_id = ? AND file_id = ? ORDER BY created_at DESC')
		.all(userId, fileId)
		.map((row) => ({
			id: row.id,
			token: row.token,
			url: `/s/${row.token}`,
			createdAt: row.created_at,
			expiresAt: row.expires_at,
			views: row.views,
			active: !row.expires_at || row.expires_at > nowIso()
		}));
}

export function revokeShare(userId, shareId) {
	return db.prepare('DELETE FROM shares WHERE id = ? AND user_id = ?').run(shareId, userId).changes > 0;
}

/** Resolve a public token to a live, uploaded file row (or null). No session required. */
export function resolveShare(token) {
	if (!token || typeof token !== 'string') return null;
	const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(token);
	if (!share) return null;
	if (share.expires_at && share.expires_at <= nowIso()) return null;
	const file = db
		.prepare(`SELECT * FROM files WHERE id = ? AND deleted_at IS NULL AND kind = 'file'`)
		.get(share.file_id);
	if (!file) return null;
	return file;
}

export function countShareView(shareId) {
	db.prepare('UPDATE shares SET views = views + 1 WHERE id = ?').run(shareId);
}

export function shareById(token) {
	return db.prepare('SELECT * FROM shares WHERE token = ?').get(token) || null;
}

export { SESSION_SECRET };
