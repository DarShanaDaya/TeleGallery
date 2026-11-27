import { requestShare } from '#lib/server/shares.js';
import { requireUser, json } from '#lib/server/http.js';
export async function POST(event) {
    const { user, error } = requireUser(event);
    if (error) return error;
    return requestShare(event.params.token, user.id) ? json({ ok: true }) : json({ error: 'Link unavailable' }, 404);
}
