import { json, requireUser } from '#lib/server/http.js';
import { db } from '#lib/server/db.js';
import { streamFile } from '#lib/server/download.js';
import { decodeInlineFilename } from '#lib/server/naming.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const fileId = event.params.id;
	const row = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(fileId, user.id);
	if (!row || row.kind !== 'file' || row.deleted_at) return json({ error: 'Not found' }, 404);

	// `?inline=1` lets the browser preview images, video, audio and PDFs.
	// `?name=` optionally overrides the download filename (used by "save as" links);
	// it is re-encoded server-side and never trusted as a raw header value.
	const inline = event.url.searchParams.get('inline') === '1';
	const overrideName = event.url.searchParams.get('name');
	if (overrideName) {
		const decoded = decodeInlineFilename(`inline; filename*=UTF-8''${encodeURIComponent(overrideName)}`);
		if (decoded) row.name = decoded;
	}
	const res = await streamFile(event, row, { inline });
	if (!res) return json({ error: 'File has no stored content' }, 404);
	return res;
}
