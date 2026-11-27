import { json, requireUser } from '#lib/server/http.js';
import { count, list } from '#lib/server/audit.js';

export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const action = event.url.searchParams.get('action') || null;
	const limit = Number(event.url.searchParams.get('limit')) || 100;
	return json({
		entries: list(user.id, { action, limit }),
		total: count(user.id, { action })
	});
}
