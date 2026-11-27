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
		.prepare(`SELECT * FROM files WHERE id = ? AND user_id = ? AND deleted_at IS NULL `)
		.get(fileId, userId);
	if (!row) throw new Error('File not found');
	return row;
}

export function createShare(userId, fileId, { days = 0, mode = 'anyone' } = {}) {
	const file = ownerFile(userId, fileId);
	if (!['anyone', 'approval'].includes(mode)) throw new Error('Invalid access mode');
	if (!Number.isFinite(days) || days < 0 || days > 3650) throw new Error('Invalid expiry');
	const id = crypto.randomBytes(8).toString('hex');
	const token = newToken();
	const expiresAt = days > 0 ? new Date(Date.now() + days * DAY).toISOString() : null;
	db.prepare(
		`INSERT INTO shares (id, token, file_id, user_id, created_at, expires_at, access_mode) VALUES (?,?,?,?,?,?,?)`
	).run(id, token, file.id, userId, nowIso(), expiresAt, mode);
	return { id, token, fileId: file.id, expiresAt, mode, url: `/s/${token}` };
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
			mode: row.access_mode,
			requests: listRequests(userId, row.id),
			active: !row.expires_at || row.expires_at > nowIso()
		}));
}

export function revokeShare(userId, shareId) {
	return db.prepare('DELETE FROM shares WHERE id = ? AND user_id = ?').run(shareId, userId).changes > 0;
}

/** Resolve the link and ensure its root is still live. */
export function liveShare(token) {
    if (!token || typeof token !== 'string') return null;
    return db.prepare(`SELECT s.* FROM shares s JOIN files f ON f.id=s.file_id AND f.user_id=s.user_id
        WHERE s.token=? AND f.deleted_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > ?)`)
        .get(token, nowIso()) || null;
}

export function shareAccess(token, userId) {
    const share = liveShare(token);
    if (!share) return { status: 'missing' };
    if (share.access_mode === 'anyone' || (userId && userId === share.user_id)) return { status: 'allowed', share };
    if (!userId) return { status: 'signin', share };
    const request = db.prepare('SELECT status FROM share_requests WHERE share_id=? AND user_id=?').get(share.id, userId);
    return { status: request?.status || 'request', share };
}

export function requestShare(token, userId) {
    const access = shareAccess(token, userId);
    if (!userId || !access.share || access.share.access_mode !== 'approval' || access.share.user_id === userId) return false;
    db.prepare(`INSERT INTO share_requests (share_id,user_id,status,created_at) VALUES (?,?,'pending',?)
        ON CONFLICT(share_id,user_id) DO UPDATE SET status='pending', created_at=excluded.created_at WHERE status='denied'`)
        .run(access.share.id, userId, nowIso());
    return true;
}

export function listRequests(ownerId, shareId) {
    return db.prepare(`SELECT r.user_id AS userId, r.status, r.created_at AS createdAt,
        u.first_name AS firstName, u.last_name AS lastName, u.username
        FROM share_requests r JOIN users u ON u.id=r.user_id JOIN shares s ON s.id=r.share_id
        WHERE s.id=? AND s.user_id=? ORDER BY r.created_at DESC`).all(shareId, ownerId);
}

export function decideRequest(ownerId, shareId, userId, status) {
    if (!['approved', 'denied'].includes(status)) throw new Error('Invalid decision');
    return db.prepare(`UPDATE share_requests SET status=? WHERE share_id=? AND user_id=?
        AND EXISTS (SELECT 1 FROM shares WHERE id=? AND user_id=?)`).run(status, shareId, userId, shareId, ownerId).changes > 0;
}

/** Only the shared root or a live descendant of a shared folder may be read. */
export function resolveShare(token, userId = null, itemId = null) {
    const access = shareAccess(token, userId);
    if (access.status !== 'allowed' && access.status !== 'approved') return null;
    const share = access.share;
    const root = db.prepare('SELECT * FROM files WHERE id=? AND user_id=? AND deleted_at IS NULL').get(share.file_id, share.user_id);
    if (!itemId || itemId === root.id) return root;
    if (root.kind !== 'folder') return null;
    let row = db.prepare('SELECT * FROM files WHERE id=? AND user_id=? AND deleted_at IS NULL').get(itemId, share.user_id);
    const target = row;
    const seen = new Set();
    while (row && row.id !== root.id && !seen.has(row.id)) {
        seen.add(row.id);
        row = db.prepare('SELECT * FROM files WHERE id=? AND user_id=? AND deleted_at IS NULL').get(row.parent_id, share.user_id);
    }
    return row?.id === root.id ? target : null;
}

export function sharedChildren(token, userId, folderId) {
    const folder = resolveShare(token, userId, folderId);
    if (!folder || folder.kind !== 'folder') return [];
    return db.prepare(`SELECT id,name,kind,size FROM files WHERE user_id=? AND parent_id=? AND deleted_at IS NULL
        ORDER BY kind='folder' DESC, name COLLATE NOCASE`).all(folder.user_id, folder.id);
}

export function countShareView(shareId) {
	db.prepare('UPDATE shares SET views = views + 1 WHERE id = ?').run(shareId);
}

export function shareById(token) {
	return db.prepare('SELECT * FROM shares WHERE token = ?').get(token) || null;
}

export { SESSION_SECRET };
