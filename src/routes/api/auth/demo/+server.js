import { upsertUser, createSession, SESSION_COOKIE } from '#lib/server/auth.js';
import { json } from '#lib/server/http.js';
import { ALLOW_DEMO_LOGIN } from '#lib/server/config.js';

/**
 * Demo sign-in used when no bot token is configured yet, so the whole product can be
 * explored locally. Everything stays on this machine — no Telegram calls are made.
 */
export async function POST(event) {
	if (!ALLOW_DEMO_LOGIN) return json({ error: 'Demo login is disabled' }, 403);
	const userId = upsertUser({
		tgId: 'demo-1',
		username: 'demo',
		firstName: 'Demo',
		lastName: 'Explorer',
		language: 'en',
		isDemo: true
	});
	const { id, expires } = createSession(userId);
	event.cookies.set(SESSION_COOKIE, id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:',
		expires
	});
	return json({ ok: true });
}
