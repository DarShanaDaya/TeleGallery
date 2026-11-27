import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { partsOf } from './files.js';
import { cacheChunk } from './telegram.js';
import { BLOB_DIR, STORAGE_CHAT_ID } from './config.js';
import { assertPathInside, parseRange } from './naming.js';

/**
 * Stream a file back to the client part by part.
 *
 * Range handling follows RFC 7233 closely enough for browsers and ffmpeg:
 * 206 for a valid partial request, 416 + Content-Range for an unsatisfiable one,
 * 200 with the full body otherwise. `HEAD` returns the same headers and no body,
 * which is what makes native video seeking work.
 */
export async function streamFile(event, fileRow, { inline = false } = {}) {
	const parts = partsOf(fileRow.id);
	if (!parts.length) return null;

	const total = parts.reduce((s, p) => s + p.size, 0);
	const mime = fileRow.mime || 'application/octet-stream';
	const method = event.request.method;
	const filename = encodeURIComponent(fileRow.name);

	const range = parseRange(event.request.headers.get('range'), total);

	if (range?.unsatisfiable) {
		return new Response(null, {
			status: 416,
			headers: { 'content-range': `bytes */${total}`, 'accept-ranges': 'bytes' }
		});
	}

	const start = range ? range.start : 0;
	const end = range ? range.end : total - 1;
	const headers = new Headers({
		'content-type': mime,
		'content-length': String(total === 0 ? 0 : end - start + 1),
		'accept-ranges': 'bytes',
		'cache-control': 'private, no-store',
		'content-security-policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'",
		'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${filename}`,
		'x-content-type-options': 'nosniff'
	});
	if (range) headers.set('content-range', `bytes ${start}-${end}/${total}`);

	// HEAD: headers only. Never touch storage.
	if (method === 'HEAD') {
		return new Response(null, { status: range ? 206 : 200, headers });
	}

	async function* generate() {
		let offset = 0;
		for (const part of parts) {
			const partStart = offset;
			const partEnd = offset + part.size - 1;
			offset += part.size;
			if (partEnd < start) continue;
			if (partStart > end) break;

			const from = Math.max(0, start - partStart);
			const to = Math.min(part.size - 1, end - partStart);

			let source;
			try {
				source = await resolvePartPath(part, fileRow.id);
			} catch {
				continue;
			}
			const stream = fs.createReadStream(source, { start: from, end: to });
			for await (const chunk of stream) yield chunk;
		}
	}

	return new Response(Readable.toWeb(Readable.from(generate())), {
		status: range ? 206 : 200,
		headers
	});
}

/**
 * Telegram can serve a file directly when the whole thing lives in one chunk and we
 * have a bot token — the browser then streams from Telegram's CDN instead of through
 * this server. Returns null when that shortcut isn't available.
 */
export async function directTelegramUrl(fileRow, { getFilePath }) {
	if (!STORAGE_CHAT_ID) return null;
	const parts = partsOf(fileRow.id);
	if (parts.length !== 1) return null;
	const part = parts[0];
	if (!part.tg_file_id || part.blob_path) return null;
	try {
		return await getFilePath(part.tg_file_id);
	} catch {
		return null;
	}
}

async function resolvePartPath(part, fileId) {
	if (part.blob_path && assertPathInside(BLOB_DIR, part.blob_path) && fs.existsSync(part.blob_path)) {
		return part.blob_path;
	}
	if (!part.tg_file_id) throw new Error('Part has no storage reference');
	const dir = path.join(BLOB_DIR, fileId);
	fs.mkdirSync(dir, { recursive: true });
	const dest = path.join(dir, `${part.idx}.part`);
	if (fs.existsSync(dest) && fs.statSync(dest).size === part.size) return dest;
	await cacheChunk(part, dest);
	return dest;
}
