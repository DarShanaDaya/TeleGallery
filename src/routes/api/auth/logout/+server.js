import { deleteSession, SESSION_COOKIE, forgetAccount } from '#lib/server/auth.js';

export async function POST(event) {
	const id = event.cookies.get(SESSION_COOKIE);
	forgetAccount(event, id);
	deleteSession(id);
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
	return new Response(null, { status: 303, headers: { location: '/' } });
}
