import { json, requireUser } from '#lib/server/http.js';
import { db } from '#lib/server/db.js';
import { streamFile } from '#lib/server/download.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const fileId = event.params.id;
	const row = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, user.id);
	if (!row || row.kind !== 'file' || row.deleted_at) return json({ error: 'Not found' }, 404);

	// `?inline=1` lets the browser preview images, video, audio and PDFs.
	const res = await streamFile(event, row, { inline: event.url.searchParams.get('inline') === '1' });
	if (!res) return json({ error: 'File has no stored content' }, 404);
	return res;
}
