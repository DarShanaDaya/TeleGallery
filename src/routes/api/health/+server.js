import { db } from '#lib/server/db.js';
import { telegramEnabled } from '#lib/server/config.js';

/**
 * Container health probe. Deliberately shallow: it must answer fast and must not
 * touch Telegram, so a slow network never marks a healthy container as failing.
 */
export function GET() {
	let database = 'ok';
	try {
		db.prepare('SELECT 1').get();
	} catch {
		database = 'error';
	}
	const body = {
		status: database === 'ok' ? 'ok' : 'degraded',
		uptime: Math.round(process.uptime()),
		database,
		storage: telegramEnabled ? 'telegram' : 'local'
	};
	return new Response(JSON.stringify(body), {
		status: database === 'ok' ? 200 : 503,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
	});
}
