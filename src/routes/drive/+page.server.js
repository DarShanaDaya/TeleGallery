import { breadcrumbs, getFile, listFolder } from '$lib/server/files.js';

export function load({ locals, url }) {
	const parentId = url.searchParams.get('folder') || null;
	const parent = parentId ? getFile(locals.user.id, parentId) : null;
	if (parentId && !parent) {
		return { notFound: true, files: [], crumbs: [{ id: null, name: 'My Drive' }], parentId: null };
	}
	return {
		files: listFolder(locals.user.id, parentId),
		crumbs: breadcrumbs(locals.user.id, parentId),
		parentId,
		notFound: false
	};
}
