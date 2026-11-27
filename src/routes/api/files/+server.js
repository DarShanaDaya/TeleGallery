import { json, requireUser, safeJson } from '#lib/server/http.js';
import { listFolder, createFolder, getFile } from '#lib/server/files.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const parentId = event.url.searchParams.get('parent') || null;
	return json({ files: listFolder(user.id, parentId) });
}

export async function POST(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const body = await safeJson(event.request);
	try {
		const folder = createFolder(user.id, body.parentId || null, body.name);
		return json({ folder });
	} catch (err) {
		return json({ error: err.message }, 400);
	}
}
