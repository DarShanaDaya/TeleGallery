import crypto from 'node:crypto';
import { db, nowIso } from './db.js';
import { parseTelegramLink, telegramMessageLink } from './links.js';
import { record } from './audit.js';

/** Candidate media objects on a Telegram message, in the order we care about. */
function mediaOf(message) {
	if (!message) return null;
	const doc = message.document || message.video || message.audio || message.animation || message.voice;
	if (doc) {
		return {
			tgFileId: doc.file_id,
			size: doc.file_size ?? 0,
			mime: doc.mime_type || 'application/octet-stream',
			name: doc.file_name || guessName(doc, message)
		};
	}
	if (message.photo?.length) {
		const largest = message.photo[message.photo.length - 1];
		return {
			tgFileId: largest.file_id,
			size: largest.file_size ?? 0,
			mime: 'image/jpeg',
			name: `photo-${message.message_id}.jpg`
		};
	}
	if (message.video_note) {
		return {
			tgFileId: message.video_note.file_id,
			size: message.video_note.file_size ?? 0,
			mime: 'video/mp4',
			name: `video-note-${message.message_id}.mp4`
		};
	}
	return null;
}

function guessName(media, message) {
	const extByMime = {
		'video/mp4': '.mp4',
		'audio/mpeg': '.mp3',
		'audio/ogg': '.ogg',
		'image/jpeg': '.jpg',
		'application/pdf': '.pdf'
	};
	return `telegram-${message?.message_id ?? 'file'}${extByMime[media.mime_type] || ''}`;
}

/**
 * Import a Telegram post into the drive by copying the message into the storage chat.
 *
 * The bytes never pass through this server. We copy the message, read the resulting
 * document, and store a single `parts` row pointing at it — so the imported file
 * downloads through exactly the same path as an uploaded one.
 */
export async function importFromLink({ userId, link, destination, copy }) {
	const parsed = parseTelegramLink(link);
	if (!parsed) throw new Error('That is not a valid Telegram post link.');
	if (!parsed.messageId) {
		throw new Error('That link points at a chat, not a post. Open the specific message and copy its link.');
	}
	if (!destination?.chatId) throw new Error('Choose a destination chat first.');
	if (String(destination.chatId) === String(parsed.chatRef)) {
		throw new Error('The storage chat and the source are the same chat, so there is nothing to copy.');
	}

	const sourceUrl = normaliseUrl(link);
	const duplicate = db
		.prepare(
			`SELECT f.* FROM file_sources s JOIN files f ON f.id = s.file_id
			 WHERE s.source_url = ? AND f.user_id = ? AND f.deleted_at IS NULL LIMIT 1`
		)
		.get(sourceUrl, userId);
	if (duplicate) return { file: toFileShape(duplicate), duplicate: true };

	let message;
	try {
		message = await copy({
			fromChatId: parsed.chatRef,
			messageId: parsed.messageId,
			toChatId: destination.chatId
		});
	} catch (err) {
		throw new Error(friendlyCopyError(err, parsed));
	}

	const media = mediaOf(message);
	if (!media) {
		throw new Error(
			'That post has no file in it — it may be text only, or the bot may not be allowed to read that chat.'
		);
	}

	const now = nowIso();
	const id = crypto.randomBytes(12).toString('hex');
	const name = uniqueName(userId, media.name);

	db.transaction(() => {
		db.prepare(
			`INSERT INTO files (id, user_id, parent_id, name, kind, size, mime, storage, created_at, updated_at)
			 VALUES (?,?,NULL,?,'file',?,?, 'telegram', ?, ?)`
		).run(id, userId, name, media.size, media.mime, now, now);

		db.prepare(
			`INSERT INTO parts (file_id, idx, size, tg_chat_id, tg_message_id, tg_file_id)
			 VALUES (?,?,?,?,?,?)`
		).run(id, 0, media.size, String(destination.chatId), message.message_id, media.tgFileId);

		db.prepare(
			`INSERT INTO file_sources (file_id, origin_chat_id, origin_message_id, source_url, telegram_link, imported_at)
			 VALUES (?,?,?,?,?,?)`
		).run(
			id,
			String(message.chat?.id ?? destination.chatId),
			message.message_id,
			sourceUrl,
			telegramMessageLink({
				chatId: message.chat?.id ?? destination.chatId,
				username: message.chat?.username ?? null,
				messageId: message.message_id
			}),
			now
		);
	})();

	record({
		userId,
		action: 'import',
		targetId: id,
		targetName: name,
		detail: `from ${sourceUrl}`
	});

	return { file: toFileShape(db.prepare('SELECT * FROM files WHERE id = ?').get(id)), duplicate: false };
}

function friendlyCopyError(err, parsed) {
	const text = String(err?.message || err);
	if (/not enough rights/i.test(text))
		return 'The bot is not allowed to read that chat. Add it as an admin, or import from a chat it can access.';
	if (/chat not found/i.test(text))
		return `Telegram could not find ${parsed.chatRef}. Private chats only work for chats the bot is already in.`;
	if (/message to copy not found/i.test(text)) return 'That post no longer exists, or it was deleted.';
	return `Telegram refused the import: ${text}`;
}

function normaliseUrl(link) {
	const trimmed = String(link || '').trim();
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	return `https://${trimmed.replace(/^\/+/, '')}`;
}

function uniqueName(userId, name) {
	const clean = (name || 'imported file').replace(/[\\/\u0000]/g, '_').slice(0, 180);
	const dot = clean.lastIndexOf('.');
	const base = dot > 0 ? clean.slice(0, dot) : clean;
	const ext = dot > 0 ? clean.slice(dot) : '';
	let candidate = clean;
	let i = 2;
	while (
		db
			.prepare(
				`SELECT id FROM files WHERE user_id = ? AND deleted_at IS NULL AND name COLLATE NOCASE = ? AND parent_id IS NULL LIMIT 1`
			)
			.get(userId, candidate)
	) {
		candidate = `${base} (${i++})${ext}`;
	}
	return candidate;
}

function toFileShape(row) {
	return {
		id: row.id,
		parentId: row.parent_id,
		name: row.name,
		kind: row.kind,
		size: row.size,
		mime: row.mime,
		storage: row.storage,
		starred: Boolean(row.starred),
		createdAt: row.created_at
	};
}

/** Links attached to a file: its Telegram message and any share tokens. */
export function fileLinks(userId, fileId) {
	const source = db.prepare('SELECT * FROM file_sources WHERE file_id = ?').get(fileId);
	const parts = db.prepare('SELECT * FROM parts WHERE file_id = ? AND tg_message_id IS NOT NULL').all(fileId);
	const telegramLink =
		source?.telegram_link ||
		(parts[0]
			? telegramMessageLink({
					chatId: parts[0].tg_chat_id,
					username: usernameFor(parts[0].tg_chat_id),
					messageId: parts[0].tg_message_id
				})
			: null);

	return {
		telegramLink,
		sourceUrl: source?.source_url ?? null,
		importedAt: source?.imported_at ?? null,
		shares: db
			.prepare('SELECT token, expires_at FROM shares WHERE file_id = ? AND user_id = ? ORDER BY created_at DESC')
			.all(fileId, userId)
			.map((row) => ({
				url: `/s/${row.token}`,
				expiresAt: row.expires_at,
				active: !row.expires_at || row.expires_at > nowIso()
			}))
	};
}

function usernameFor(chatId) {
	const row = db.prepare('SELECT username FROM chat_links WHERE chat_id = ?').get(String(chatId));
	return row?.username ?? null;
}

export function rememberChat(chat) {
	db.prepare(
		`INSERT INTO chat_links (chat_id, username, title, updated_at) VALUES (?,?,?,?)
		 ON CONFLICT(chat_id) DO UPDATE SET username = excluded.username, title = excluded.title, updated_at = excluded.updated_at`
	).run(String(chat.chatId), chat.username ?? null, chat.title ?? null, nowIso());
}

export function knownDestinations() {
	return db.prepare('SELECT * FROM chat_links ORDER BY updated_at DESC').all();
}
