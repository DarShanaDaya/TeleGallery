import { getSessionUser, SESSION_COOKIE } from './auth.js';

/** Resolve the signed-in user for a request, throwing a 401 JSON response when absent. */
export function requireUser(event) {
	const user = getSessionUser(event.cookies.get(SESSION_COOKIE));
	if (!user) {
		return { user: null, error: json({ error: 'Not authenticated' }, 401) };
	}
	return { user, error: null };
}

export function json(data, status = 200, headers = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json', ...headers }
	});
}

export function html(body, status = 200) {
	return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export const safeJson = async (request) => {
	try {
		return await request.json();
	} catch {
		return {};
	}
};
