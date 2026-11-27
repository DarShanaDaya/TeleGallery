import { BOT_USERNAME, STORAGE_CHAT_ID, telegramEnabled, telegramLoginEnabled, SITE_NAME } from '#lib/server/config.js';

export function load({ locals }) {
	return {
		settings: {
			siteName: SITE_NAME,
			botUsername: BOT_USERNAME || null,
			storageChat: STORAGE_CHAT_ID || null,
			telegramEnabled,
			telegramLoginEnabled
		}
	};
}
