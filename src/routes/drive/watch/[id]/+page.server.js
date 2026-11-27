import { getFile, listFolder } from '#lib/server/files.js';
import { db } from '#lib/server/db.js';
import { fileLinks } from '#lib/server/imports.js';
import { fileCategory } from '#lib/format.js';
import { record } from '#lib/server/audit.js';
import { error } from '@sveltejs/kit';

const PLAYABLE = new Set(['video', 'audio', 'image']);

export function load({ locals, params }) {
	const file = getFile(locals.user.id, params.id);
	if (!file || file.kind !== 'file' || file.deletedAt) throw error(404, 'That file is not in your drive');

	record({
		userId: locals.user.id,
		action: 'file.open',
		targetId: file.id,
		targetName: file.name
	});

	const kind = fileCategory(file.mime, file.name);
	const siblings = listFolder(locals.user.id, file.parentId ?? null)
		.filter((f) => f.kind === 'file' && PLAYABLE.has(fileCategory(f.mime, f.name)))
		.map((f) => ({
			id: f.id,
			name: f.name,
			mime: f.mime,
			kind: fileCategory(f.mime, f.name),
			size: f.size,
			createdAt: f.createdAt
		}));

	// a single-file queue when the folder has nothing else playable
	const queue = siblings.some((s) => s.id === file.id) ? siblings : [{ ...file, kind }];

	const parts = db.prepare('SELECT COUNT(*) AS c FROM parts WHERE file_id = ?').get(file.id).c;

	return {
		file: { ...file, kind },
		queue,
		parts,
		links: fileLinks(locals.user.id, file.id),
		crumbs: file.parentId ? listFolder(locals.user.id, file.parentId).length : 0
	};
}
