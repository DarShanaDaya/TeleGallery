import { json } from '$lib/server/http.js';
import { BOT_USERNAME, telegramEnabled, telegramLoginEnabled, STORAGE_CHAT_ID } from '$lib/server/config.js';
import { getMe } from '$lib/server/telegram.js';

/** Small health/config probe used by the UI banner and by deploy checks. */
export async function GET() {
	let bot = null;
	if (telegramEnabled) {
		try {
			const me = await getMe();
			bot = { username: me.username, name: me.first_name };
		} catch (err) {
			bot = { error: err.message };
		}
	}
	return json({
		telegram: telegramEnabled,
		telegramLogin: telegramLoginEnabled,
		botUsername: BOT_USERNAME || bot?.username || null,
		bot,
		storageChat: STORAGE_CHAT_ID || null,
		ok: true
	});
}
