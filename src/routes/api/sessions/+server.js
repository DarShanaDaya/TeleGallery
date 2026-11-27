import { json, requireUser, safeJson } from '#lib/server/http.js';
import { listSessions, revokeOthers, revokeSession, SESSION_COOKIE } from '#lib/server/auth.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	return json({ sessions: listSessions(user.id, event.cookies.get(SESSION_COOKIE)) });
}

export async function DELETE(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const body = await safeJson(event.request);
	const currentId = event.cookies.get(SESSION_COOKIE);

	if (body.all === true) {
		// keep this device signed in, drop the rest
		return json({ revoked: revokeOthers(user.id, currentId) });
	}
	if (!body.id) return json({ error: 'Session id is required' }, 400);

	const revoked = revokeSession(user.id, body.id);
	if (revoked && body.id === currentId) event.cookies.delete(SESSION_COOKIE, { path: '/' });
	return json({ revoked });
}
