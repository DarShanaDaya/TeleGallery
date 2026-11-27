import { json, requireUser, safeJson } from '#lib/server/http.js';
import { initUpload } from '#lib/server/files.js';
import { MAX_CHUNK_BYTES, MAX_BYTES } from '#lib/server/upload.js';

export async function POST(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const body = await safeJson(event.request);
	const size = Number(body.size) || 0;
	if (size > MAX_BYTES) return json({ error: 'File is larger than the configured maximum size' }, 413);

	const totalParts = Math.max(1, Math.ceil(size / MAX_CHUNK_BYTES));
	const created = initUpload(user.id, {
		parentId: body.parentId || null,
		name: body.name,
		size,
		mime: body.mime,
		totalParts
	});
	return json({ ...created, chunkSize: MAX_CHUNK_BYTES });
}
