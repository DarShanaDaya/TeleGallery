import { json, requireUser } from '$lib/server/http.js';
import { search } from '$lib/server/files.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const q = event.url.searchParams.get('q') || '';
	return json({ files: q.trim() ? search(user.id, q) : [] });
}
