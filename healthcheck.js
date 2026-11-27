/**
 * Container healthcheck. Deliberately dependency-free (Node built-ins only) so it
 * works in the runtime image, where `curl` and `wget` are intentionally absent.
 *
 * Exit 0 = healthy, 1 = unhealthy. Used by both the Dockerfile HEALTHCHECK and
 * docker-compose, so the logic lives in one place.
 */
const port = process.env.PORT || 3000;
const url = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${port}/api/health`;
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 4000);

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);

try {
	const res = await fetch(url, { signal: controller.signal });
	const body = await res.text();
	if (!res.ok) {
		console.error(`unhealthy: ${res.status} ${body.slice(0, 200)}`);
		process.exit(1);
	}
	console.log(`healthy: ${body}`);
	process.exit(0);
} catch (err) {
	console.error(`unhealthy: ${err.name === 'AbortError' ? 'timed out' : err.message}`);
	process.exit(1);
} finally {
	clearTimeout(timer);
}
