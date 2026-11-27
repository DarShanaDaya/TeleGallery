import { search } from '$lib/server/files.js';

export function load({ locals, url }) {
	const q = url.searchParams.get('q') || '';
	return { q, files: q.trim() ? search(locals.user.id, q) : [] };
}
