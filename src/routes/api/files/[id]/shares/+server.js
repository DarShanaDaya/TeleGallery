import { json, requireUser, safeJson } from '#lib/server/http.js';
import { createShare, listShares, revokeShare } from '#lib/server/shares.js';
import { record } from '#lib/server/audit.js';

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
		record({ userId: user.id, action: 'share.create', targetId: event.params.id, detail: share.url });
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
	const revoked = revokeShare(user.id, shareId);
	record({ userId: user.id, action: 'share.revoke', targetId: event.params.id });
	return json({ revoked });
}
