import http from 'node:http';
import { handler } from './build/handler.js';

/**
 * Production entrypoint used by the Docker image.
 *
 * SvelteKit's generated index.js is a fine default, but container platforms send
 * SIGTERM and expect an orderly exit. We also want a single, predictable log line
 * on startup so orchestrators can see the bind address.
 */
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const server = http.createServer(handler);
server.keepAliveTimeout = 65_000; // longer than typical proxy idle timeouts
server.headersTimeout = 70_000;

server.listen(port, host, () => {
	console.log(`[teledrive] listening on http://${host}:${port}`);
	console.log(
		`[teledrive] data dir: ${process.env.DATA_DIR || 'data'} · storage: ${
			process.env.TELEGRAM_BOT_TOKEN ? 'telegram' : 'local (no bot token)'
		}`
	);
});

let shuttingDown = false;

function shutdown(signal) {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`[teledrive] ${signal} received — draining connections`);

	// Give in-flight uploads/downloads a chance to finish, then exit regardless.
	const force = setTimeout(() => {
		console.error('[teledrive] drain timed out, exiting');
		process.exit(1);
	}, 20_000);
	force.unref();

	server.close(() => {
		console.log('[teledrive] closed cleanly');
		process.exit(0);
	});
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// A rejected promise must not take the process down silently in production.
process.on('unhandledRejection', (reason) => {
	console.error('[teledrive] unhandled rejection:', reason);
});
