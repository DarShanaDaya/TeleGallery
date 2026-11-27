import fs from 'node:fs';
import { CHUNK_SIZE, MAX_FILE_SIZE, STORAGE_CHAT_ID, telegramEnabled } from './config.js';
import { uploadChunk, deleteMessages } from './telegram.js';
import { db, nowIso } from './db.js';
import { addPart, blobPath, completeUpload, initUpload, partsOf, purgeFile, toFile } from './files.js';

export const MAX_CHUNK_BYTES = CHUNK_SIZE;
export const MAX_BYTES = MAX_FILE_SIZE;

/**
 * Receive a single chunk (as raw binary or multipart) and persist it either into the
 * user's Telegram chat or, when Telegram isn't configured, into local blob storage.
 */
export async function receiveChunk(event, { fileId, index, raw }) {
	const user = event.locals.user;
	const row = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, user.id);
	if (!row) return { error: 'Upload target not found', status: 404 };
	if (index === 0) db.prepare('DELETE FROM parts WHERE file_id = ?').run(fileId);

	const buffer = Buffer.from(await event.request.arrayBuffer());
	if (!buffer.length) return { error: 'Empty chunk', status: 400 };
	if (buffer.length > MAX_CHUNK_BYTES + 1024) return { error: 'Chunk too large', status: 413 };

	const chatId = STORAGE_CHAT_ID || user.tgId;
	let record;
	try {
		if (telegramEnabled && chatId) {
			const stored = await uploadChunk({
				buffer,
				filename: `${row.id}-${String(index).padStart(4, '0')}-${row.name}`.slice(0, 120),
				chatId
			});
			record = {
				size: buffer.length,
				tgChatId: stored.tgChatId,
				tgMessageId: stored.tgMessageId,
				tgFileId: stored.tgFileId,
				blobPath: null
			};
		} else {
			const dest = blobPath({ idx: index }, fileId);
			fs.writeFileSync(dest, buffer);
			record = { size: buffer.length, tgChatId: null, tgMessageId: null, tgFileId: null, blobPath: dest };
		}
	} catch (err) {
		return { error: `Storage failed: ${err.message}`, status: 502 };
	}

	addPart(fileId, index, record);
	db.prepare('UPDATE files SET updated_at = ? WHERE id = ?').run(nowIso(), fileId);
	return { ok: true, index, size: record.size };
}

export function finalizeUpload(event, fileId) {
	const user = event.locals.user;
	const row = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, user.id);
	if (!row) return { error: 'Upload not found', status: 404 };
	const parts = partsOf(fileId);
	const total = parts.reduce((s, p) => s + p.size, 0);
	const storage = parts.every((p) => p.blob_path) ? 'local' : 'telegram';
	db.prepare('UPDATE files SET size = ?, storage = ?, updated_at = ? WHERE id = ?').run(
		total,
		storage,
		nowIso(),
		fileId
	);
	return { ok: true, file: toFile(db.prepare('SELECT * FROM files WHERE id = ?').get(fileId)) };
}

export { initUpload, purgeFile, deleteMessages };
