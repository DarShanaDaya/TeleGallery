import { db, nowIso } from './db.js';

/**
 * Append-only activity log. Every meaningful mutation records one row so the drive
 * can answer "what happened, and when" without guessing from file timestamps.
 *
 * Actions are dotted verbs: auth.login, import, upload, download, rename, move,
 * star, trash, restore, purge, share.create, share.revoke, session.revoke.
 */
export function record({ userId, action, targetId = null, targetName = null, detail = null, ip = null }) {
	if (!userId || !action) return;
	db.prepare(
		`INSERT INTO audit_log (user_id, action, target_id, target_name, detail, ip, created_at)
		 VALUES (?,?,?,?,?,?,?)`
	).run(userId, action, targetId, targetName, detail, ip, nowIso());
}

export function list(userId, { action = null, limit = 100, offset = 0 } = {}) {
	const rows = db
		.prepare(
			`SELECT * FROM audit_log WHERE user_id = ? AND (? IS NULL OR action = ?)
			 ORDER BY id DESC LIMIT ? OFFSET ?`
		)
		.all(userId, action, action, Math.min(Number(limit) || 100, 500), Number(offset) || 0);

	return rows.map((row) => ({
		id: row.id,
		action: row.action,
		targetId: row.target_id,
		targetName: row.target_name,
		detail: row.detail,
		ip: row.ip,
		createdAt: row.created_at
	}));
}

export function count(userId, { action = null } = {}) {
	return db
		.prepare('SELECT COUNT(*) AS c FROM audit_log WHERE user_id = ? AND (? IS NULL OR action = ?)')
		.get(userId, action, action).c;
}

/** Remove everything older than `days`; returns how many rows went. */
export function prune(userId, days = 90) {
	const cutoff = new Date(Date.now() - days * 86400000).toISOString();
	return db.prepare('DELETE FROM audit_log WHERE user_id = ? AND created_at < ?').run(userId, cutoff).changes;
}
