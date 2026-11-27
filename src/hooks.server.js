import { getSessionUser, SESSION_COOKIE } from '$lib/server/auth.js';

const PROTECTED = ['/drive'];

export async function handle({ event, resolve }) {
	event.locals.user = getSessionUser(event.cookies.get(SESSION_COOKIE));

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
