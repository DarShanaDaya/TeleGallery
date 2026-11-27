import { json, requireUser } from '#lib/server/http.js';
import { receiveChunk } from '#lib/server/upload.js';

export async function POST(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const fileId = event.url.searchParams.get('fileId');
	const index = Number(event.url.searchParams.get('index'));
	if (!fileId || Number.isNaN(index)) return json({ error: 'fileId and index are required' }, 400);
	const result = await receiveChunk(event, { fileId, index });
	if (result.error) return json({ error: result.error }, result.status);
	return json(result);
}
