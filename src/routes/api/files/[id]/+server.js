import { json, requireUser, safeJson } from '#lib/server/http.js';
import { record } from '#lib/server/audit.js';
import { getFile, moveFile, purgeFile, renameFile, restoreFile, toggleStar, trashFile } from '#lib/server/files.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const file = getFile(user.id, event.params.id);
	if (!file) return json({ error: 'Not found' }, 404);
	return json({ file });
}

/** PATCH handles rename / move / star in one place. */
export async function PATCH(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const body = await safeJson(event.request);
	try {
		let file;
		if (body.action === 'move') file = moveFile(user.id, event.params.id, body.parentId ?? null);
		else if (body.action === 'star') file = toggleStar(user.id, event.params.id);
		else if (body.name) file = renameFile(user.id, event.params.id, body.name);
		if (!file) return json({ error: 'Nothing to update' }, 400);
		record({
			userId: user.id,
			action: body.action === 'move' ? 'move' : body.action === 'star' ? 'star' : 'rename',
			targetId: file.id,
			targetName: file.name,
			ip: event.getClientAddress?.() ?? null
		});
		return json({ file });
	} catch (err) {
		return json({ error: err.message }, 400);
	}
}

export async function DELETE(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const permanent = event.url.searchParams.get('permanent') === '1';
	try {
		if (permanent) {
			if (!getFile(user.id, event.params.id)) return json({ error: 'Not found' }, 404);
			purgeFile(user.id, event.params.id);
			return json({ ok: true, purged: true });
		}
		const result = trashFile(user.id, event.params.id);
		if (!result.trashed) return json({ error: 'Not found' }, 404);
		const trashed = getFile(user.id, event.params.id);
		record({
			userId: user.id,
			action: 'trash',
			targetId: event.params.id,
			targetName: trashed?.name ?? null,
			ip: event.getClientAddress?.() ?? null
		});
		return json(result);
	} catch (err) {
		return json({ error: err.message }, 400);
	}
}

/** POST = restore from trash. */
export async function POST(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	try {
		return json({ file: restoreFile(user.id, event.params.id) });
	} catch (err) {
		return json({ error: err.message }, 400);
	}
}
