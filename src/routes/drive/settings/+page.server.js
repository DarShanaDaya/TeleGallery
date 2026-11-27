import { BOT_USERNAME, STORAGE_CHAT_ID, telegramEnabled, telegramLoginEnabled, SITE_NAME } from '#lib/server/config.js';
import { listSessions, SESSION_COOKIE } from '#lib/server/auth.js';

export function load({ locals, cookies }) {
	return {
		sessions: listSessions(locals.user.id, cookies.get(SESSION_COOKIE)),
		settings: {
			siteName: SITE_NAME,
			botUsername: BOT_USERNAME || null,
			storageChat: STORAGE_CHAT_ID || null,
			telegramEnabled,
			telegramLoginEnabled
		}
	};
}
