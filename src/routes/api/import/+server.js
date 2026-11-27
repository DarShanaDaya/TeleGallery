import { json, requireUser, safeJson } from '#lib/server/http.js';
import { importFromLink, rememberChat } from '#lib/server/imports.js';
import { copyMessage, listKnownChats } from '#lib/server/telegram.js';
import { parseTelegramLink } from '#lib/server/links.js';
import { STORAGE_CHAT_ID, telegramEnabled } from '#lib/server/config.js';
import { record } from '#lib/server/audit.js';

/** Offer the chats the bot already knows, plus the configured storage chat. */
export async function GET(event) {
	const { user, error } = requireUser(event);
	if (error) return error;

	const destinations = [];
	if (STORAGE_CHAT_ID) destinations.push({ chatId: STORAGE_CHAT_ID, title: 'Storage chat (configured)', username: null });

	if (telegramEnabled) {
		try {
			for (const chat of await listKnownChats()) {
				if (destinations.some((d) => d.chatId === chat.chatId)) continue;
				rememberChat(chat);
				destinations.push(chat);
			}
		} catch {
			/* getUpdates can fail when a webhook is set; the configured chat still works */
		}
	}

	return json({ destinations, telegram: telegramEnabled });
}

export async function POST(event) {
	const { user, error } = requireUser(event);
	if (error) return error;
	const body = await safeJson(event.request);

	// Validate the input before reporting a configuration problem, so a typo
	// never looks like a missing token.
	const parsed = parseTelegramLink(body.link);
	if (!parsed) return json({ error: 'That is not a valid Telegram link.' }, 400);
	if (!parsed.messageId) {
		return json({ error: 'That link points at a chat, not a post. Copy the link of a specific message.' }, 400);
	}

	{
		record({
			userId: user.id,
			action: 'import.request',
			detail: String(body.link).slice(0, 300),
			ip: event.getClientAddress?.() ?? null
		});
	}

	if (!telegramEnabled) {
		return json(
			{ error: 'Importing from Telegram needs TELEGRAM_BOT_TOKEN set on the server.' },
			503
		);
	}

	try {
		const result = await importFromLink({
			userId: user.id,
			link: body.link,
			destination: { chatId: body.chatId || STORAGE_CHAT_ID || user.tgId },
			copy: ({ fromChatId, messageId, toChatId }) => copyMessage({ fromChatId, messageId, toChatId })
		});
		return json({ file: result.file, duplicate: result.duplicate });
	} catch (err) {
		return json({ error: err.message }, 400);
	}
}
