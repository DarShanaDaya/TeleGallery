import crypto from 'node:crypto';
import { upsertUser, createSession, SESSION_COOKIE } from '#lib/server/auth.js';
import { json } from '#lib/server/http.js';
import { ALLOW_DEMO_LOGIN } from '#lib/server/config.js';

/**
 * Demo sign-in used when no bot token is configured yet, so the whole product can be
 * explored locally. Everything stays on this machine — no Telegram calls are made.
 */
export async function POST(event) {
	if (!ALLOW_DEMO_LOGIN) return json({ error: 'Demo login is disabled' }, 403);
	// Each visitor gets their own throwaway demo account. A single shared
	// "demo" account would show one visitor another visitor's files.
	const suffix = crypto.randomBytes(4).toString('hex');
	const userId = upsertUser({
		tgId: `demo-${suffix}`,
		username: `demo-${suffix}`,
		firstName: 'Demo',
		lastName: `#${suffix.slice(0, 4)}`,
		language: 'en',
		isDemo: true
	});
	const { id, expires } = createSession(userId, {
		userAgent: event.request.headers.get('user-agent'),
		ip: event.getClientAddress?.() ?? null
	});
	event.cookies.set(SESSION_COOKIE, id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:',
		expires
	});
	return json({ ok: true });
}
