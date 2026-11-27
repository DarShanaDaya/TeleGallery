import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'teledrive-sess-'));
process.env.TELEGRAM_BOT_TOKEN = '';
process.env.SHARE_SECRET = 'test-share-secret';

const dbMod = await import('../src/lib/server/db.js');
const { db } = dbMod;
const auth = await import('../src/lib/server/auth.js');
const shares = await import('../src/lib/server/shares.js');

const uid = Number(
	db
		.prepare(`INSERT INTO users (tg_id, first_name, is_demo, created_at) VALUES ('u1','Ada',1,?)`)
		.run(new Date().toISOString()).lastInsertRowid
);

const iphone =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const macChrome =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

test('a user can hold several live sessions at once', () => {
	const phone = auth.createSession(uid, { userAgent: iphone, ip: '1.2.3.4' });
	const laptop = auth.createSession(uid, { userAgent: macChrome, ip: '5.6.7.8' });
	assert.notEqual(phone.id, laptop.id);

	const list = auth.listSessions(uid, laptop.id);
	assert.equal(list.length, 2);
	const current = list.filter((s) => s.current);
	assert.equal(current.length, 1);
	assert.equal(current[0].id, laptop.id);
});

test('sessions are described in human terms for the UI', () => {
	const { id } = auth.createSession(uid, { userAgent: iphone, ip: '1.2.3.4' });
	const entry = auth.listSessions(uid, null).find((s) => s.id === id);
	assert.match(entry.device, /iPhone/);
	assert.match(entry.device, /Safari/);
	assert.equal(entry.ip, '1.2.3.4');
});

test('revoking one session leaves the others signed in', () => {
	const a = auth.createSession(uid, { userAgent: iphone });
	const b = auth.createSession(uid, { userAgent: macChrome });
	assert.ok(auth.getSessionUser(a.id));
	auth.revokeSession(uid, a.id);
	assert.equal(auth.getSessionUser(a.id), null);
	assert.ok(auth.getSessionUser(b.id));
});

test('revoking another user’s session id is not possible', () => {
	const other = Number(
		db
			.prepare(`INSERT INTO users (tg_id, first_name, is_demo, created_at) VALUES ('u2','Bob',1,?)`)
			.run(new Date().toISOString()).lastInsertRowid
	);
	const victim = auth.createSession(other, { userAgent: iphone });
	assert.equal(auth.revokeSession(uid, victim.id), false);
	assert.ok(auth.getSessionUser(victim.id));
});

test('revokeOthers signs out every device except the current one', () => {
	const keep = auth.createSession(uid, { userAgent: macChrome });
	const drop1 = auth.createSession(uid, { userAgent: iphone });
	const drop2 = auth.createSession(uid, { userAgent: iphone });
	const removed = auth.revokeOthers(uid, keep.id);
	assert.ok(removed >= 2);
	assert.ok(auth.getSessionUser(keep.id));
	assert.equal(auth.getSessionUser(drop1.id), null);
	assert.equal(auth.getSessionUser(drop2.id), null);
});

test('an expired session id is not accepted', () => {
	const { id } = auth.createSession(uid, { userAgent: iphone });
	db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').run(new Date(Date.now() - 1000).toISOString(), id);
	assert.equal(auth.getSessionUser(id), null);
});

// ---------------------------------------------------------------- shares

function addFile(name = 'clip.mp4', parentId = null, deletedAt = null) {
	const id = 'f' + Math.random().toString(16).slice(2, 10);
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO files (id, user_id, parent_id, name, kind, size, mime, storage, created_at, updated_at, deleted_at)
		 VALUES (?,?,?,?,'file',2048,'video/mp4','local',?,?,?)`
	).run(id, uid, parentId, name, now, now, deletedAt);
	return id;
}

test('a share link resolves to its file for anyone, with no session', () => {
	const fileId = addFile('holiday.mp4');
	const share = shares.createShare(uid, fileId, { days: 7 });
	assert.ok(share.token);
	const resolved = shares.resolveShare(share.token);
	assert.equal(resolved.id, fileId);
	assert.equal(resolved.name, 'holiday.mp4');
});

test('share tokens are unguessable and unique', () => {
	const fileId = addFile();
	const tokens = new Set(Array.from({ length: 20 }, () => shares.createShare(uid, fileId, {}).token));
	assert.equal(tokens.size, 20);
	for (const token of tokens) assert.ok(token.length >= 20);
});

test('a share for a file you do not own is refused', () => {
	const other = Number(
		db
			.prepare(`INSERT INTO users (tg_id, first_name, is_demo, created_at) VALUES ('u3','Eve',1,?)`)
			.run(new Date().toISOString()).lastInsertRowid
	);
	const fileId = addFile('mine.mp4');
	assert.throws(() => shares.createShare(other, fileId, {}), /not found/i);
});

test('a share for a trashed file is refused', () => {
	const fileId = addFile('gone.mp4', null, new Date().toISOString());
	assert.throws(() => shares.createShare(uid, fileId, {}), /not found/i);
});

test('an expired share stops resolving', () => {
	const fileId = addFile();
	const share = shares.createShare(uid, fileId, { days: 1 });
	db.prepare('UPDATE shares SET expires_at = ? WHERE id = ?').run(new Date(Date.now() - 1000).toISOString(), share.id);
	assert.equal(shares.resolveShare(share.token), null);
});

test('a revoked share stops resolving', () => {
	const fileId = addFile();
	const share = shares.createShare(uid, fileId, {});
	assert.ok(shares.resolveShare(share.token));
	assert.equal(shares.revokeShare(uid, share.id), true);
	assert.equal(shares.resolveShare(share.token), null);
});

test('an unknown token resolves to nothing', () => {
	assert.equal(shares.resolveShare('nope-token-nope'), null);
	assert.equal(shares.resolveShare(''), null);
});

test('listing shares for a file shows its active links', () => {
	const fileId = addFile();
	shares.createShare(uid, fileId, {});
	const list = shares.listShares(uid, fileId);
	assert.equal(list.length, 1);
	assert.equal(list[0].active, true);
});
