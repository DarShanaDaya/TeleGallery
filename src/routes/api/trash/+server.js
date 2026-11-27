import { json, requireUser } from '$lib/server/http.js';
import { emptyTrash, listTrash } from '$lib/server/files.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	return json({ files: listTrash(user.id) });
}

export async function DELETE(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	return json({ emptied: emptyTrash(user.id) });
}
