import { count, list } from '#lib/server/audit.js';

export function load({ locals, url }) {
	const action = url.searchParams.get('action') || null;
	return {
		action,
		entries: list(locals.user.id, { action, limit: 200 }),
		total: count(locals.user.id, { action }),
		actions: [
			null,
			'import',
			'upload',
			'download',
			'share.create',
			'rename',
			'move',
			'star',
			'trash',
			'restore',
			'purge',
			'auth.login'
		]
	};
}
