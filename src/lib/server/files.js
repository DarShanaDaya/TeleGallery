import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db, nowIso } from './db.js';
import { BLOB_DIR } from './config.js';

export function newId() {
	return crypto.randomBytes(12).toString('hex');
}

export function listFolder(userId, parentId) {
	const rows = db
		.prepare(
			`SELECT * FROM files WHERE user_id = ? AND deleted_at IS NULL
			 AND ((? IS NULL AND parent_id IS NULL) OR parent_id = ?)
			 ORDER BY kind = 'folder' DESC, name COLLATE NOCASE ASC`
		)
		.all(userId, parentId ?? null, parentId ?? null);
	return rows.map(toFile);
}

export function toFile(row) {
	if (!row) return null;
	return {
		id: row.id,
		parentId: row.parent_id,
		name: row.name,
		kind: row.kind,
		size: row.size,
		mime: row.mime,
		storage: row.storage,
		starred: Boolean(row.starred),
		deletedAt: row.deleted_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function getFile(userId, fileId) {
	return toFile(db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, userId));
}

export function breadcrumbs(userId, parentId) {
	const chain = [];
	let current = parentId;
	let guard = 0;
	while (current && guard++ < 100) {
		const row = db
			.prepare('SELECT id, name, parent_id FROM files WHERE id = ? AND user_id = ?')
			.get(current, userId);
		if (!row) break;
		chain.unshift({ id: row.id, name: row.name });
		current = row.parent_id;
	}
	return [{ id: null, name: 'My Drive' }, ...chain];
}

export function createFolder(userId, parentId, name) {
	const clean = sanitizeName(name);
	if (!clean) throw new Error('Folder name is required');
	ensureUniqueName(userId, parentId, clean);
	const id = newId();
	const now = nowIso();
	db.prepare(
		`INSERT INTO files (id, user_id, parent_id, name, kind, size, mime, storage, created_at, updated_at)
		 VALUES (?,?,?,?,'folder',0,NULL,'local',?,?)`
	).run(id, userId, parentId ?? null, clean, now, now);
	return getFile(userId, id);
}

export function sanitizeName(name) {
	return String(name || '')
		.replace(/[\\/\u0000]/g, '_')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 180);
}

function ensureUniqueName(userId, parentId, name, ignoreId = null) {
	const clash = db
		.prepare(
			`SELECT id FROM files WHERE user_id = ? AND deleted_at IS NULL
			 AND name COLLATE NOCASE = ? AND ((? IS NULL AND parent_id IS NULL) OR parent_id = ?)
			 AND id != ? LIMIT 1`
		)
		.get(userId, name, parentId ?? null, parentId ?? null, ignoreId ?? '');
	if (!clash) return name;
	const dot = name.lastIndexOf('.');
	const base = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot) : '';
	let i = 2;
	let candidate = `${base} (${i})${ext}`;
	while (
		db
			.prepare(
				`SELECT id FROM files WHERE user_id = ? AND deleted_at IS NULL AND name COLLATE NOCASE = ?
				 AND ((? IS NULL AND parent_id IS NULL) OR parent_id = ?) AND id != ? LIMIT 1`
			)
			.get(userId, candidate, parentId ?? null, parentId ?? null, ignoreId ?? '')
	) {
		i++;
		candidate = `${base} (${i})${ext}`;
	}
	return candidate;
}

export function uniqueName(userId, parentId, name) {
	return ensureUniqueName(userId, parentId, sanitizeName(name) || 'Untitled');
}

export function initUpload(userId, { parentId, name, size, mime, totalParts }) {
	const clean = uniqueName(userId, parentId ?? null, name || 'Untitled');
	const id = newId();
	const now = nowIso();
	db.prepare(
		`INSERT INTO files (id, user_id, parent_id, name, kind, size, mime, storage, created_at, updated_at)
		 VALUES (?,?,?,?,'file',?,?, 'pending', ?, ?)`
	).run(id, userId, parentId ?? null, clean, Number(size) || 0, mime || 'application/octet-stream', now, now);
	return { id, name: clean, totalParts: Math.max(1, Number(totalParts) || 1) };
}

export function addPart(fileId, idx, { size, storage, tgChatId, tgMessageId, tgFileId, blobPath }) {
	db.prepare(
		`INSERT INTO parts (file_id, idx, size, tg_chat_id, tg_message_id, tg_file_id, blob_path)
		 VALUES (?,?,?,?,?,?,?)`
	).run(fileId, idx, size, tgChatId ?? null, tgMessageId ?? null, tgFileId ?? null, blobPath ?? null);
}

export function partsOf(fileId) {
	return db.prepare('SELECT * FROM parts WHERE file_id = ? ORDER BY idx ASC').all(fileId);
}

export function completeUpload(fileId) {
	const parts = partsOf(fileId);
	const total = parts.reduce((sum, p) => sum + p.size, 0);
	const storage = parts.every((p) => p.blob_path) ? 'local' : 'telegram';
	db.prepare('UPDATE files SET size = ?, storage = ?, updated_at = ? WHERE id = ?').run(
		total,
		storage,
		nowIso(),
		fileId
	);
	return getFile(null, fileId) || db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
}

export function renameFile(userId, fileId, name) {
	const file = getFile(userId, fileId);
	if (!file) throw new Error('Not found');
	const clean = ensureUniqueName(userId, file.parentId, sanitizeName(name) || file.name, fileId);
	db.prepare('UPDATE files SET name = ?, updated_at = ? WHERE id = ?').run(clean, nowIso(), fileId);
	return getFile(userId, fileId);
}

export function toggleStar(userId, fileId) {
	const file = getFile(userId, fileId);
	if (!file) throw new Error('Not found');
	db.prepare('UPDATE files SET starred = ? WHERE id = ?').run(file.starred ? 0 : 1, fileId);
	return getFile(userId, fileId);
}

export function descendants(userId, fileId) {
	const out = [];
	const stack = [fileId];
	while (stack.length) {
		const current = stack.pop();
		const children = db
			.prepare('SELECT id FROM files WHERE user_id = ? AND parent_id = ?')
			.all(userId, current);
		for (const child of children) {
			out.push(child.id);
			stack.push(child.id);
		}
	}
	return out;
}

export function moveFile(userId, fileId, targetParentId) {
	const file = getFile(userId, fileId);
	if (!file) throw new Error('Not found');
	if (fileId === targetParentId) throw new Error('Cannot move a folder into itself');
	if (targetParentId) {
		const target = getFile(userId, targetParentId);
		if (!target || target.kind !== 'folder') throw new Error('Target folder not found');
		if (descendants(userId, fileId).includes(targetParentId)) {
			throw new Error('Cannot move a folder into its own subfolder');
		}
	}
	const name = ensureUniqueName(userId, targetParentId ?? null, file.name, fileId);
	db.prepare('UPDATE files SET parent_id = ?, name = ?, updated_at = ? WHERE id = ?').run(
		targetParentId ?? null,
		name,
		nowIso(),
		fileId
	);
	return getFile(userId, fileId);
}

export function trashFile(userId, fileId) {
	const ids = [fileId, ...descendants(userId, fileId)];
	const now = nowIso();
	const stmt = db.prepare('UPDATE files SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?');
	const tx = db.transaction(() => {
		for (const id of ids) stmt.run(now, now, id, userId);
	});
	tx();
	return { trashed: ids.length };
}

export function restoreFile(userId, fileId) {
	const file = getFile(userId, fileId);
	if (!file) throw new Error('Not found');
	const ids = [fileId, ...descendants(userId, fileId)];
	const root = db.prepare('SELECT id FROM files WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(file.parentId, userId);
	const parentId = file.parentId && root ? file.parentId : null;
	const now = nowIso();
	const tx = db.transaction(() => {
		db.prepare('UPDATE files SET deleted_at = NULL, parent_id = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
			parentId,
			now,
			fileId,
			userId
		);
		for (const id of ids.slice(1)) {
			db.prepare('UPDATE files SET deleted_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?').run(now, id, userId);
		}
	});
	tx();
	return getFile(userId, fileId);
}

export function listTrash(userId) {
	return db
		.prepare('SELECT * FROM files WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC')
		.all(userId)
		.map(toFile);
}

export function purgeFile(userId, fileId) {
	const ids = [fileId, ...descendants(userId, fileId)];
	for (const id of ids) {
		const parts = partsOf(id);
		for (const part of parts) {
			if (part.blob_path) {
				try {
					fs.unlinkSync(part.blob_path);
				} catch {
					/* already gone */
				}
			}
		}
		db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?').run(id, userId);
	}
}

export function emptyTrash(userId) {
	const rows = listTrash(userId);
	for (const row of rows) purgeFile(userId, row.id);
	return rows.length;
}

export function listStarred(userId) {
	return db
		.prepare('SELECT * FROM files WHERE user_id = ? AND deleted_at IS NULL AND starred = 1 ORDER BY updated_at DESC')
		.all(userId)
		.map(toFile);
}

export function listRecent(userId, limit = 24) {
	return db
		.prepare(
			`SELECT * FROM files WHERE user_id = ? AND deleted_at IS NULL AND kind = 'file'
			 ORDER BY created_at DESC LIMIT ?`
		)
		.all(userId, limit)
		.map(toFile);
}

export function search(userId, query) {
	const q = `%${String(query || '').replace(/[%_]/g, '')}%`;
	return db
		.prepare(
			`SELECT * FROM files WHERE user_id = ? AND deleted_at IS NULL AND name LIKE ? COLLATE NOCASE
			 ORDER BY kind = 'folder' DESC, name COLLATE NOCASE ASC LIMIT 200`
		)
		.all(userId, q)
		.map(toFile);
}

export function usage(userId) {
	const row = db
		.prepare(
			`SELECT COUNT(*) AS files, COALESCE(SUM(size),0) AS bytes FROM files
			 WHERE user_id = ? AND deleted_at IS NULL AND kind = 'file'`
		)
		.get(userId);
	const trashed = db
		.prepare(
			`SELECT COUNT(*) AS files, COALESCE(SUM(size),0) AS bytes FROM files
			 WHERE user_id = ? AND deleted_at IS NOT NULL AND kind = 'file'`
		)
		.get(userId);
	const byKind = db
		.prepare(
			`SELECT mime, COUNT(*) AS count, COALESCE(SUM(size),0) AS bytes FROM files
			 WHERE user_id = ? AND deleted_at IS NULL AND kind='file' GROUP BY mime`
		)
		.all(userId);
	return {
		files: row.files,
		bytes: row.bytes,
		trashFiles: trashed.files,
		trashBytes: trashed.bytes,
		folders: db.prepare(`SELECT COUNT(*) AS c FROM files WHERE user_id=? AND deleted_at IS NULL AND kind='folder'`).get(userId).c,
		marked: rowsToKinds(byKind)
	};
}

function rowsToKinds(rows) {
	const buckets = { image: 0, video: 0, audio: 0, document: 0, other: 0 };
	for (const r of rows) {
		const mime = r.mime || '';
		if (mime.startsWith('image/')) buckets.image += r.bytes;
		else if (mime.startsWith('video/')) buckets.video += r.bytes;
		else if (mime.startsWith('audio/')) buckets.audio += r.bytes;
		else if (mime.includes('pdf') || mime.includes('word') || mime.includes('sheet') || mime.includes('text') || mime.includes('zip'))
			buckets.document += r.bytes;
		else buckets.other += r.bytes;
	}
	return buckets;
}

export function blobPath(part, fileId) {
	const dir = path.join(BLOB_DIR, fileId);
	fs.mkdirSync(dir, { recursive: true });
	return path.join(dir, `${part.idx}.part`);
}
