import { upsertUser, createSession, SESSION_COOKIE } from '#lib/server/auth.js';
import { verifyTelegramAuth } from '#lib/server/telegram.js';
import { json } from '#lib/server/http.js';
import { telegramLoginEnabled } from '#lib/server/config.js';

function signIn(event, tgUser) {
	event.cookies.delete(SESSION_COOKIE, { path: '/' });
	const userId = upsertUser({
		tgId: tgUser.id,
		username: tgUser.username ?? null,
		firstName: tgUser.first_name ?? null,
		lastName: tgUser.last_name ?? null,
		photoUrl: tgUser.photo_url ?? null,
		language: tgUser.language_code ?? null
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
}

function redirectTo(target, extra = '') {
	return new Response(null, { status: 302, headers: { location: target + extra } });
}

/**
 * The Telegram Login Widget redirects the browser here with the signed payload in the
 * query string (data-auth-url). We verify the HMAC against the bot token, then set a cookie.
 */
export async function GET(event) {
	if (!telegramLoginEnabled) {
		return redirectTo('/login', '?error=telegram_not_configured');
	}
	const params = Object.fromEntries(event.url.searchParams);
	const verified = verifyTelegramAuth(params);
	if (!verified) return redirectTo('/login', '?error=invalid_signature');
	signIn(event, verified);
	return redirectTo('/drive');
}

/** Same flow for Mini Apps / custom buttons that POST the signed payload as JSON. */
export async function POST(event) {
	if (!telegramLoginEnabled) return json({ error: 'Telegram login is not configured' }, 400);
	let payload = {};
	try {
		payload = await event.request.json();
	} catch {
		return json({ error: 'Invalid payload' }, 400);
	}
	const verified = verifyTelegramAuth(payload);
	if (!verified) return json({ error: 'Invalid Telegram signature' }, 401);
	signIn(event, verified);
	return json({ ok: true });
}
