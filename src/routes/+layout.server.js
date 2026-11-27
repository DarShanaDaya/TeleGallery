import { BOT_USERNAME, ALLOW_DEMO_LOGIN, SITE_NAME, telegramLoginEnabled } from '$lib/server/config.js';

export function load({ locals }) {
	return {
		user: locals.user,
		botUsername: BOT_USERNAME || '',
		telegramLoginEnabled,
		demoLogin: ALLOW_DEMO_LOGIN,
		siteName: SITE_NAME
	};
}
