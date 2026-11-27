import { listStarred } from '$lib/server/files.js';

export function load({ locals }) {
	return { files: listStarred(locals.user.id) };
}
