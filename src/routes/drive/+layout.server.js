import { usage } from '#lib/server/files.js';
import { telegramLoginEnabled } from '#lib/server/config.js';

export function load({ locals }) {
	return {
		usage: usage(locals.user.id),
		telegramConnected: telegramLoginEnabled && !locals.user.isDemo
	};
}
