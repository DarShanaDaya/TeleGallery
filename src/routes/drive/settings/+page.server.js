import { BOT_USERNAME, STORAGE_CHAT_ID, telegramEnabled, telegramLoginEnabled, SITE_NAME } from '#lib/server/config.js';
import { listSessions, SESSION_COOKIE, browserAccounts } from '#lib/server/auth.js';

export function load(event) {
	const { locals, cookies } = event;
	return {
        accounts: browserAccounts(event).map(({ id, user }) => ({ user, current: id === cookies.get(SESSION_COOKIE) })),
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
