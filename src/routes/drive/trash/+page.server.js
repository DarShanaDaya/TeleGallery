import { listTrash } from '$lib/server/files.js';

export function load({ locals }) {
	return { files: listTrash(locals.user.id) };
}
