import { getSessionUser, SESSION_COOKIE, touchSession } from '#lib/server/auth.js';

const PROTECTED = ['/drive'];

export async function handle({ event, resolve }) {
	const sessionId = event.cookies.get(SESSION_COOKIE);
	event.locals.user = getSessionUser(sessionId);
	if (event.locals.user) touchSession(sessionId);

	if (PROTECTED.some((p) => event.url.pathname === p || event.url.pathname.startsWith(p + '/'))) {
		if (!event.locals.user) {
			const target = event.url.pathname + event.url.search;
			return new Response(null, {
				status: 303,
				headers: { location: `/login?next=${encodeURIComponent(target)}` }
			});
		}
	}

	const response = await resolve(event);
	response.headers.set('x-frame-options', 'SAMEORIGIN');
	response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
	return response;
}
