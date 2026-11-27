import { json, requireUser } from '#lib/server/http.js';
import { fileLinks } from '#lib/server/imports.js';
import { getFile } from '#lib/server/files.js';

/** Both links for a file, for the one-click copy buttons. */
export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	if (!getFile(user.id, event.params.id)) return json({ error: 'Not found' }, 404);
	return json(fileLinks(user.id, event.params.id));
}
