import { test } from 'node:test';
import assert from 'node:assert/strict';

// Config is read at import time, so the bot token must exist before we load the module.
process.env.TELEGRAM_BOT_TOKEN = '123456:TEST-TOKEN';
process.env.DATA_DIR = new URL('../.tmp-test-data', import.meta.url).pathname;

const crypto = await import('node:crypto');
const { verifyTelegramAuth } = await import('../src/lib/server/telegram.js');
const { assertPathInside, decodeInlineFilename } = await import('../src/lib/server/naming.js');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const secret = crypto.createHash('sha256').update(TOKEN).digest();

function sign(fields) {
	const check = Object.keys(fields)
		.sort()
		.map((k) => `${k}=${fields[k]}`)
		.join('\n');
	return crypto.createHmac('sha256', secret).update(check).digest('hex');
}

const fresh = () => ({ id: 42, first_name: 'Ada', username: 'ada', auth_date: Math.floor(Date.now() / 1000) });

test('verifyTelegramAuth accepts a correctly signed payload', () => {
	const payload = fresh();
	const result = verifyTelegramAuth({ ...payload, hash: sign(payload) });
	assert.equal(result.id, 42);
	assert.equal(result.first_name, 'Ada');
});

test('verifyTelegramAuth rejects a tampered field', () => {
	const payload = fresh();
	const hash = sign(payload);
	assert.equal(verifyTelegramAuth({ ...payload, first_name: 'Eve', hash }), null);
});

test('verifyTelegramAuth rejects a payload signed with another secret', () => {
	const payload = fresh();
	const wrong = crypto.createHmac('sha256', crypto.createHash('sha256').update('other').digest());
	assert.equal(verifyTelegramAuth({ ...payload, hash: wrong.update('id=42').digest('hex') }), null);
});

test('verifyTelegramAuth rejects a stale auth_date (replay)', () => {
	const payload = { ...fresh(), auth_date: Math.floor(Date.now() / 1000) - 60 * 60 * 48 };
	assert.equal(verifyTelegramAuth({ ...payload, hash: sign(payload) }), null);
});

test('verifyTelegramAuth rejects a payload with no hash', () => {
	assert.equal(verifyTelegramAuth(fresh()), null);
});

test('assertPathInside rejects traversal outside the root', () => {
	const root = '/srv/data/blobs';
	assert.ok(assertPathInside(root, `${root}/abc/0.part`));
	assert.equal(assertPathInside(root, `${root}/../secrets`), false);
	assert.equal(assertPathInside(root, '/srv/data/blobs-evil/x'), false);
	assert.equal(assertPathInside(root, root), false);
});

test('decodeInlineFilename reads an RFC 5987 filename*', () => {
	assert.equal(
		decodeInlineFilename("inline; filename*=UTF-8''report%20q3.pdf"),
		'report q3.pdf'
	);
});

test('decodeInlineFilename reads a quoted filename', () => {
	assert.equal(decodeInlineFilename('attachment; filename="plain.txt"'), 'plain.txt');
});

test('decodeInlineFilename ignores a filename* smuggled inside a quoted value', () => {
	// Same-origin: the query string controls Content-Disposition, so a crafted
	// value must not be able to flip the header to attachment or inject a name.
	const header = `inline; filename="inline; filename*=UTF-8''shell.php"; filename*=UTF-8''shell.php`;
	assert.equal(decodeInlineFilename(header), 'shell.php');
	assert.equal(decodeInlineFilename("inline; filename*=UTF-8''%0d%0aSet-Cookie:%20x=1"), null);
});
