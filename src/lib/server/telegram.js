import crypto from 'node:crypto';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { BOT_TOKEN, BOT_USERNAME, STORAGE_CHAT_ID, TELEGRAM_API, CHUNK_SIZE, telegramEnabled } from './config.js';

/** Telegram Bot API helper with upload/download + graceful local fallback. */
async function call(method, body, { signal } = {}) {
	if (!telegramEnabled) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
	const res = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/${method}`, {
		method: 'POST',
		body,
		signal
	});
	const json = await res.json().catch(() => null);
	if (!res.ok || !json?.ok) {
		throw new Error(`Telegram ${method} failed: ${json?.description || res.status}`);
	}
	return json.result;
}

export async function getMe() {
	return call('getMe', new FormData());
}

/**
 * Authenticate a user coming from the Telegram Login Widget / Mini App.
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(payload) {
	const { hash, ...fields } = payload || {};
	if (!hash || !BOT_TOKEN) return null;
	const dataCheckString = Object.keys(fields)
		.filter((k) => fields[k] !== undefined && fields[k] !== null)
		.sort()
		.map((k) => `${k}=${fields[k]}`)
		.join('\n');
	const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
	const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
	if (hmac.length !== hash.length) return null;
	if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(hash, 'hex'))) return null;
	const authDate = Number(fields.auth_date || 0);
	if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
	return fields;
}

/**
 * Store one chunk of a file in Telegram as a document.
 * Returns the Telegram coordinates of the stored message.
 */
export async function uploadChunk({ buffer, filename, chatId, signal }) {
	if (!telegramEnabled) {
		return { storage: 'local' };
	}
	const chat = chatId || STORAGE_CHAT_ID;
	if (!chat) throw new Error('TELEGRAM_STORAGE_CHAT_ID or chat_id from the login flow is required');

	const form = new FormData();
	form.append('chat_id', chat);
	form.append('disable_notification', 'true');
	form.append('caption', filename.slice(0, 1000));
	form.append('document', new Blob([buffer], { type: 'application/octet-stream' }), filename);

	const result = await call('sendDocument', form, { signal });
	const doc = result.document || result.audio || result.video;
	if (!doc) throw new Error('Telegram did not return a document');
	return {
		storage: 'telegram',
		tgChatId: String(result.chat.id),
		tgMessageId: result.message_id,
		tgFileId: doc.file_id,
		size: doc.file_size ?? buffer.length
	};
}

/**
 * Copy a message from one chat to another inside Telegram. This is how import works:
 * the bytes never travel through this server, so an import is instant regardless of
 * file size, and the original sender/message stay intact.
 */
export async function copyMessage({ fromChatId, messageId, toChatId, caption }) {
	if (!telegramEnabled) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
	const form = new FormData();
	form.append('chat_id', String(toChatId));
	form.append('from_chat_id', String(fromChatId));
	form.append('message_id', String(messageId));
	form.append('disable_notification', 'true');
	if (caption) form.append('caption', String(caption).slice(0, 1000));

	const message = await call('copyMessage', form);
	// copyMessage returns only the new message_id; fetch the message to learn the file.
	return getMessage(toChatId, message.message_id);
}

/** Fetch a single message so we can read its document/photo/video metadata. */
export async function getMessage(chatId, messageId) {
	const form = new FormData();
	form.append('chat_id', String(chatId));
	form.append('message_id', String(messageId));
	const result = await call('copyMessages_get', form).catch(() => null);
	if (result) return result;

	// Bot API has no getMessage; forwardMessage to the same chat is the reliable trick.
	const forward = new FormData();
	forward.append('chat_id', String(chatId));
	forward.append('from_chat_id', String(chatId));
	forward.append('message_id', String(messageId));
	forward.append('disable_notification', 'true');
	const copied = await call('forwardMessage', forward);
	// remove the duplicate immediately so the chat is not polluted
	await deleteMessages(chatId, [copied.message_id]);
	return copied;
}

/** Which chats the bot has seen — used to offer import destinations. */
export async function listKnownChats() {
	const result = await call('getUpdates', form_({ limit: 100, allowed_updates: '["message","channel_post"]' })).catch(
		() => []
	);
	const seen = new Map();
	for (const update of result || []) {
		const message = update.message || update.channel_post || update.edited_message;
		const chat = message?.chat;
		if (!chat) continue;
		seen.set(String(chat.id), {
			chatId: String(chat.id),
			username: chat.username || null,
			title: chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || String(chat.id)
		});
	}
	return [...seen.values()];
}

export async function deleteMessages(chatId, messageIds) {
	if (!telegramEnabled || !chatId || !messageIds?.length) return false;
	const form = new FormData();
	form.append('chat_id', chatId);
	form.append('message_ids', JSON.stringify(messageIds));
	try {
		await call('deleteMessages', form);
		return true;
	} catch {
		return false;
	}
}

/** Turn a telegram part record into a readable web stream (via getFile + file endpoint). */
export async function downloadChunk(part) {
	const file = await call('getFile', form_({ file_id: part.tg_file_id }));
	if (!file.file_path) throw new Error('Telegram file path unavailable');
	const res = await fetch(`${TELEGRAM_API}/file/bot${BOT_TOKEN}/${file.file_path}`);
	if (!res.ok) throw new Error(`Telegram download failed: ${res.status}`);
	return Readable.fromWeb(res.body);
}

function form_(obj) {
	const f = new FormData();
	for (const [k, v] of Object.entries(obj)) f.append(k, String(v));
	return f;
}

/** Download a single telegram chunk into the local blob cache and return the path. */
export async function cacheChunk(part, destPath) {
	const stream = await downloadChunk(part);
	await new Promise((resolve, reject) => {
		const out = fs.createWriteStream(destPath);
		stream.pipe(out);
		out.on('finish', resolve);
		out.on('error', reject);
		stream.on('error', reject);
	});
	return destPath;
}

export const chunkLimit = CHUNK_SIZE;
export { BOT_USERNAME, telegramEnabled };
export const telegramChatIdFor = (user) => STORAGE_CHAT_ID || user?.tg_id || null;
