import { json, requireUser, safeJson } from '#lib/server/http.js';
import { createShare, listShares, revokeShare } from '#lib/server/shares.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	return json({ shares: listShares(user.id, event.params.id) });
}

export async function POST(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const body = await safeJson(event.request);
	try {
		const share = createShare(user.id, event.params.id, { days: Number(body.days) || 0 });
		return json({ share: { ...share, active: true, views: 0 } });
	} catch (err) {
		return json({ error: err.message }, 400);
	}
}

export async function DELETE(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const shareId = event.url.searchParams.get('shareId');
	if (!shareId) return json({ error: 'shareId is required' }, 400);
	return json({ revoked: revokeShare(user.id, shareId) });
}
