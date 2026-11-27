import path from 'node:path';

/**
 * True when `target` resolves to something strictly inside `root`.
 * Used before touching any file whose path was derived from stored metadata.
 */
export function assertPathInside(root, target) {
	const resolvedRoot = path.resolve(root);
	const resolved = path.resolve(target);
	if (resolved === resolvedRoot) return false;
	return resolved.startsWith(resolvedRoot + path.sep);
}

/**
 * Content-Disposition is partly driven by a same-origin query string, so it is
 * parsed defensively: `filename*` wins (RFC 5987), a quoted `filename` is the
 * fallback, and anything with control characters is rejected outright.
 */
export function decodeInlineFilename(header) {
	if (typeof header !== 'string') return null;

	const extended = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
	let name = extended ? safeDecode(extended[1].replace(/^"|"$/g, '')) : null;

	if (!name) {
		const quoted = header.match(/filename\s*=\s*"([^"]*)"/i);
		const bare = header.match(/filename\s*=\s*([^;\s]+)/i);
		const raw = quoted ? quoted[1] : bare ? bare[1] : null;
		name = raw ? raw.replace(/%22|%0d|%0a/gi, '') : null;
	}
	if (!name) return null;
	// Control characters would let a caller forge further header lines.
	if (/[\u0000-\u001f\u007f]/.test(name)) return null;
	return name.slice(0, 255);
}

function safeDecode(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/**
 * Parse a single-range `Range: bytes=…` header against a known total size.
 * Returns { start, end } (inclusive), { unsatisfiable: true }, or null when the
 * header is absent/malformed/should be ignored. Multi-range requests are treated
 * as a full response — we never emit multipart/byteranges.
 */
export function parseRange(header, total) {
	if (!header || typeof header !== 'string' || total <= 0) return null;
	const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
	if (!match) return null;
	const [, rawStart, rawEnd] = match;
	if (!rawStart && !rawEnd) return null;

	// suffix form: bytes=-N → the last N bytes
	if (!rawStart) {
		const suffix = Number(rawEnd);
		if (!Number.isFinite(suffix) || suffix <= 0) return null;
		return { start: Math.max(0, total - suffix), end: total - 1 };
	}

	const start = Number(rawStart);
	if (!Number.isFinite(start) || start >= total) return { unsatisfiable: true };
	let end = rawEnd ? Number(rawEnd) : total - 1;
	if (!Number.isFinite(end)) end = total - 1;
	end = Math.min(end, total - 1);
	if (end < start) return { unsatisfiable: true };
	return { start, end };
}
