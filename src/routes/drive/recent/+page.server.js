import { listRecent } from '$lib/server/files.js';

export function load({ locals }) {
	return { files: listRecent(locals.user.id, 48) };
}
