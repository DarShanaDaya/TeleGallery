import { resolveShare, shareById, countShareView } from '#lib/server/shares.js';
import { streamFile } from '#lib/server/download.js';

/**
 * Public download endpoint for a share token. Deliberately session-free: possession of
 * the token is the capability. Ranges and HEAD work exactly as on the private route.
 */
async function handle(event, { countView = false } = {}) {
	const file = resolveShare(event.params.token, event.locals.user?.id, event.url.searchParams.get('item'));
	if (!file || file.kind !== 'file') return new Response('This link is no longer available.', { status: 404 });
	if (countView) {
		const share = shareById(event.params.token);
		if (share) countShareView(share.id);
	}
	const inline = event.url.searchParams.get('inline') === '1';
	const res = await streamFile(event, file, { inline });
	return res ?? new Response('File has no stored content.', { status: 404 });
}

export async function GET(event) {
	// count a real "save this file" hit, not every range seek of a video
	const countView = event.request.headers.get('range') === null;
	return handle(event, { countView });
}

export async function HEAD(event) {
	return handle(event);
}
