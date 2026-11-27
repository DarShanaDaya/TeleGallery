import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { partsOf } from './files.js';
import { cacheChunk } from './telegram.js';
import { BLOB_DIR } from './config.js';
import { assertPathInside } from './naming.js';

/**
 * Stream a file back to the client part by part. Telegram chunks are cached on disk on
 * first access, which makes range requests (video seeking) cheap afterwards.
 */
export async function streamFile(event, fileRow, { inline = false } = {}) {
	const parts = partsOf(fileRow.id);
	if (!parts.length) return null;

	const filename = encodeURIComponent(fileRow.name);
	const total = parts.reduce((s, p) => s + p.size, 0);
	const mime = fileRow.mime || 'application/octet-stream';

	let start = 0;
	let end = total - 1;
	let partial = false;
	const range = event.request.headers.get('range');
	if (range) {
		const m = /bytes=(\d*)-(\d*)/.exec(range);
		if (m) {
			start = m[1] ? Number(m[1]) : 0;
			end = m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
			if (start > end) start = 0;
			partial = true;
		}
	}

	const headers = new Headers({
		'content-type': mime,
		'content-length': String(end - start + 1),
		'accept-ranges': 'bytes',
		'cache-control': 'private, max-age=3600',
		'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${filename}`,
		'x-content-type-options': 'nosniff'
	});
	if (partial) headers.set('content-range', `bytes ${start}-${end}/${total}`);

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
		status: partial ? 206 : 200,
		headers
	});
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
