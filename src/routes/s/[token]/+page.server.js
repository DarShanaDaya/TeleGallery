import { resolveShare, shareById } from '#lib/server/shares.js';
import { fileCategory } from '#lib/format.js';

const PREVIEWABLE = new Set(['image', 'video', 'audio', 'pdf', 'text']);

export function load({ params }) {
	const file = resolveShare(params.token);
	if (!file) return { file: null };

	const share = shareById(params.token);
	const kind = fileCategory(file.mime, file.name);
	return {
		file: {
			name: file.name,
			size: file.size,
			mime: file.mime,
			kind,
			previewable: PREVIEWABLE.has(kind),
			createdAt: file.created_at
		},
		expiresAt: share?.expires_at ?? null,
		src: `/s/${params.token}/file?inline=1`,
		download: `/s/${params.token}/file`
	};
}
