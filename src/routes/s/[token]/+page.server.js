import { resolveShare, shareAccess, sharedChildren } from '#lib/server/shares.js';
import { fileCategory } from '#lib/format.js';

export function load({ params, locals, url }) {
	const access = shareAccess(params.token, locals.user?.id);
	if (access.status !== 'allowed' && access.status !== 'approved') return { access: access.status, file: null, token: params.token };
	const file = resolveShare(params.token, locals.user?.id, url.searchParams.get('item'));
	if (!file) return { access: 'missing', file: null, token: params.token };
	const kind = file.kind === 'folder' ? 'folder' : fileCategory(file.mime, file.name);
	const suffix = file.id === access.share.file_id ? '' : `?item=${encodeURIComponent(file.id)}`;
	return {
		access: 'allowed', token: params.token,
		file: { name: file.name, size: file.size, mime: file.mime, kind, createdAt: file.created_at },
		children: kind === 'folder' ? sharedChildren(params.token, locals.user?.id, file.id) : [],
		expiresAt: access.share.expires_at,
		src: `/s/${params.token}/file${suffix}${suffix ? '&' : '?'}inline=1`,
		download: `/s/${params.token}/file${suffix}`
	};
}
