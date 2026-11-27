import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'teledrive-links-'));
process.env.TELEGRAM_BOT_TOKEN = '';

const { parseTelegramLink, telegramMessageLink } = await import('../src/lib/server/links.js');
const { db } = await import('../src/lib/server/db.js');
const audit = await import('../src/lib/server/audit.js');
const imports = await import('../src/lib/server/imports.js');

// ---------------------------------------------------------------- parsing

test('parses a public channel post link', () => {
	assert.deepEqual(parseTelegramLink('https://t.me/durov/123'), {
		chatRef: '@durov',
		messageId: 123,
		kind: 'public'
	});
});

test('parses a forum-topic post link by taking the trailing message id', () => {
	assert.deepEqual(parseTelegramLink('https://t.me/somechannel/45/6789'), {
		chatRef: '@somechannel',
		messageId: 6789,
		kind: 'public'
	});
});

test('parses a private post link into a -100 chat id', () => {
	assert.deepEqual(parseTelegramLink('https://t.me/c/1234567890/42'), {
		chatRef: '-1001234567890',
		messageId: 42,
		kind: 'private'
	});
});

test('accepts links with no scheme, a leading @, or a trailing query', () => {
	assert.equal(parseTelegramLink('t.me/durov/9').messageId, 9);
	assert.equal(parseTelegramLink('@durov').chatRef, '@durov');
	assert.equal(parseTelegramLink('https://t.me/durov/9?single').messageId, 9);
});

test('rejects things that are not post links', () => {
	// a chat link with no post id is still a valid chat reference (messageId null)
	assert.deepEqual(parseTelegramLink('https://t.me/durov'), { chatRef: '@durov', messageId: null, kind: 'public' });

	for (const bad of ['', 'hello', 'https://example.com/a/b', 'https://t.me/durov/abc', 'not t.me/durov/1']) {
		assert.equal(parseTelegramLink(bad), null, `should reject: ${bad}`);
	}
});

test('builds a public message link from a username', () => {
	assert.equal(telegramMessageLink({ chatId: '-100123', username: 'durov', messageId: 55 }), 'https://t.me/durov/55');
});

test('builds a private message link from a -100 chat id', () => {
	assert.equal(
		telegramMessageLink({ chatId: '-1001234567890', username: null, messageId: 55 }),
		'https://t.me/c/1234567890/55'
	);
});

test('returns null when the chat is a plain user chat (links would not work)', () => {
	assert.equal(telegramMessageLink({ chatId: '1234567', username: null, messageId: 5 }), null);
});

// ---------------------------------------------------------------- audit

const uid = Number(
	db
		.prepare(`INSERT INTO users (tg_id, first_name, is_demo, created_at) VALUES ('auditor','Ada',1,?)`)
		.run(new Date().toISOString()).lastInsertRowid
);

test('records an audit entry with actor, action and target', () => {
	audit.record({ userId: uid, action: 'import', targetId: 'f1', targetName: 'clip.mp4', detail: 'from t.me/x/1', ip: '1.2.3.4' });
	const entries = audit.list(uid);
	assert.equal(entries.length, 1);
	assert.equal(entries[0].action, 'import');
	assert.equal(entries[0].targetName, 'clip.mp4');
	assert.equal(entries[0].ip, '1.2.3.4');
	assert.ok(entries[0].createdAt);
});

test('audit entries are per-user and newest first', () => {
	const other = Number(
		db
			.prepare(`INSERT INTO users (tg_id, first_name, is_demo, created_at) VALUES ('other','Bob',1,?)`)
			.run(new Date().toISOString()).lastInsertRowid
	);
	audit.record({ userId: uid, action: 'upload', targetName: 'a.txt' });
	audit.record({ userId: other, action: 'upload', targetName: 'b.txt' });

	const mine = audit.list(uid);
	assert.ok(mine.every((e) => e.action !== undefined));
	assert.equal(mine[0].targetName, 'a.txt', 'newest first');
	assert.equal(audit.list(other).length, 1);
});

test('audit list can be filtered by action', () => {
	audit.record({ userId: uid, action: 'share.create', targetName: 'a.txt' });
	const importsOnly = audit.list(uid, { action: 'import' });
	assert.equal(importsOnly.length, 1);
	assert.equal(importsOnly[0].action, 'import');
});

test('audit list respects a limit and reports a total', () => {
	for (let i = 0; i < 5; i++) audit.record({ userId: uid, action: 'download', targetName: `f${i}` });
	const page = audit.list(uid, { limit: 3 });
	assert.equal(page.length, 3);
	assert.ok(audit.count(uid) >= 8);
});

// ---------------------------------------------------------------- import

function addDestinationChat() {
	db.prepare(
		`INSERT INTO chat_links (chat_id, username, title, updated_at) VALUES (?,?,?,?)
		 ON CONFLICT(chat_id) DO UPDATE SET username = excluded.username, updated_at = excluded.updated_at`
	).run('-100999', 'mychannel', 'My Drive Channel', new Date().toISOString());
	return '-100999';
}

test('import copies the message instead of re-uploading, and files the result', async () => {
	const chatId = addDestinationChat();
	let copyArgs = null;

	const result = await imports.importFromLink({
		userId: uid,
		link: 'https://t.me/sourcechannel/77',
		destination: { chatId },
		copy: async (args) => {
			copyArgs = args;
			return {
				message_id: 501,
				chat: { id: Number(chatId) },
				document: { file_id: 'FILE123', file_name: 'clip.mp4', mime_type: 'video/mp4', file_size: 2048 }
			};
		}
	});

	assert.equal(copyArgs.fromChatId, '@sourcechannel');
	assert.equal(copyArgs.messageId, 77);
	assert.equal(result.file.name, 'clip.mp4');
	assert.equal(result.file.size, 2048);
	assert.equal(result.file.storage, 'telegram');
});

test('an imported file can be downloaded by its parts record', async () => {
	const chatId = addDestinationChat();
	const result = await imports.importFromLink({
		userId: uid,
		link: 'https://t.me/sourcechannel/78',
		destination: { chatId },
		copy: async () => ({
			message_id: 502,
			chat: { id: Number(chatId) },
			document: { file_id: 'FILE999', file_name: 'notes.txt', file_size: 12 }
		})
	});
	const parts = db.prepare('SELECT * FROM parts WHERE file_id = ?').all(result.file.id);
	assert.equal(parts.length, 1);
	assert.equal(parts[0].tg_message_id, 502);
	assert.equal(parts[0].tg_file_id, 'FILE999');
	assert.equal(parts[0].size, 12);
});

test('import refuses a link it cannot parse', async () => {
	await assert.rejects(
		() => imports.importFromLink({ userId: uid, link: 'not a link', destination: { chatId: '-100999' }, copy: async () => ({}) }),
		/post link/i
	);
});

test('import surfaces a copy failure as a readable error', async () => {
	await assert.rejects(
		() =>
			imports.importFromLink({
				userId: uid,
				link: 'https://t.me/privatesource/5',
				destination: { chatId: '-100999' },
				copy: async () => {
					throw new Error('Bad Request: chat not found');
				}
			}),
		/could not find @privatesource/i
	);
});

test('importing the same message twice does not create a duplicate file', async () => {
	const chatId = addDestinationChat();
	const copy = async () => ({
		message_id: 777,
		chat: { id: Number(chatId) },
		document: { file_id: 'DUP', file_name: 'same.mp4', file_size: 10 }
	});
	const first = await imports.importFromLink({ userId: uid, link: 'https://t.me/dupsource/1', destination: { chatId }, copy });
	const second = await imports.importFromLink({ userId: uid, link: 'https://t.me/dupsource/1', destination: { chatId }, copy });
	assert.equal(first.file.id, second.file.id);
	assert.equal(second.duplicate, true);
});

test('a chat-only link is refused with a specific message', async () => {
	await assert.rejects(
		() =>
			imports.importFromLink({
				userId: uid,
				link: 'https://t.me/durov',
				destination: { chatId: '-100999' },
				copy: async () => ({})
			}),
		/points at a chat, not a post/i
	);
});

test('importing from the storage chat into itself is refused', async () => {
	await assert.rejects(
		() =>
			imports.importFromLink({
				userId: uid,
				link: 'https://t.me/c/999/12',
				destination: { chatId: '-100999' },
				copy: async () => ({})
			}),
		/same chat/i
	);
});
