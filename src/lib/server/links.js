/**
 * Telegram post links.
 *
 *   https://t.me/channel/123          public post
 *   https://t.me/channel/45/678       post inside a forum topic → trailing id wins
 *   https://t.me/c/1234567890/42      private chat post → -100<id>
 *
 * Returns { chatRef, messageId, kind } or null. Never throws.
 */
export function parseTelegramLink(input) {
	if (!input || typeof input !== 'string') return null;
	let raw = input.trim();
	if (!raw) return null;

	// bare @username is a valid chat reference but not a post link
	if (/^@[a-zA-Z0-9_]{4,}$/.test(raw)) return { chatRef: raw, messageId: null, kind: 'public' };

	raw = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
	raw = raw.split('?')[0].split('#')[0];

	const match = /^(?:t\.me|telegram\.me|telegram\.dog)\/(?:s\/)?(.+)$/i.exec(raw);
	if (!match) return null;

	const segments = match[1].split('/').filter(Boolean);
	if (!segments.length) return null;

	if (segments[0] === 'c') {
		const [, chatId, messageId] = segments;
		if (!/^\d+$/.test(chatId ?? '') || !/^\d+$/.test(messageId ?? '')) return null;
		return { chatRef: `-100${chatId}`, messageId: Number(messageId), kind: 'private' };
	}

	const chat = segments[0];
	if (!/^[a-zA-Z0-9_]{4,}$/.test(chat)) return null;
	const extra = segments.slice(1);
	const numeric = extra.filter((s) => /^\d+$/.test(s));
	if (!numeric.length) {
		// `t.me/channel` is a chat; `t.me/channel/anything-else` is a typo, not a post
		return extra.length === 0 ? { chatRef: `@${chat}`, messageId: null, kind: 'public' } : null;
	}

	return { chatRef: `@${chat}`, messageId: Number(numeric[numeric.length - 1]), kind: 'public' };
}

/**
 * Inverse of parseTelegramLink for a stored message. Returns null when the chat is a
 * plain user chat, whose messages have no public web link.
 */
export function telegramMessageLink({ chatId, username, messageId }) {
	if (!messageId) return null;
	if (username) return `https://t.me/${String(username).replace(/^@/, '')}/${messageId}`;
	const id = String(chatId ?? '');
	if (id.startsWith('-100')) return `https://t.me/c/${id.slice(4)}/${messageId}`;
	return null;
}

/** True when a value looks like something a user could paste as a Telegram link. */
export function looksLikeTelegramLink(input) {
	return Boolean(parseTelegramLink(input));
}
