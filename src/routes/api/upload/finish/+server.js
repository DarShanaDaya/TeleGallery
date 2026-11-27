import { json, requireUser, safeJson } from '#lib/server/http.js';
import { finalizeUpload } from '#lib/server/upload.js';

export async function POST(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const body = await safeJson(event.request);
	const result = finalizeUpload(event, body.fileId);
	if (result.error) return json({ error: result.error }, result.status);
	return json(result);
}
