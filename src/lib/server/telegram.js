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
