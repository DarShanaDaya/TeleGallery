import { deleteSession, SESSION_COOKIE } from '$lib/server/auth.js';

export async function POST(event) {
	deleteSession(event.cookies.get(SESSION_COOKIE));
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
	return new Response(null, { status: 303, headers: { location: '/' } });
}
