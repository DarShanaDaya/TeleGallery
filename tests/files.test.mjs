import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'teledrive-test-'));
process.env.DATA_DIR = DATA_DIR;
process.env.TELEGRAM_BOT_TOKEN = ''; // force local storage, no network

const files = await import('../src/lib/server/files.js');
const { db } = await import('../src/lib/server/db.js');

let userId;

function seedUser() {
	const info = db
		.prepare(
			`INSERT INTO users (tg_id, username, first_name, is_demo, created_at) VALUES (?,?,?,1,?)`
		)
		.run(`test-${Math.random()}`, 'tester', 'Test', new Date().toISOString());
	userId = Number(info.lastInsertRowid);
}

seedUser();

const addFile = (name, parentId = null, size = 0) => {
	const id = files.newId();
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO files (id, user_id, parent_id, name, kind, size, mime, storage, created_at, updated_at)
		 VALUES (?,?,?,?,'file',?,'text/plain','local',?,?)`
	).run(id, userId, parentId, name, size, now, now);
	return id;
};

test('createFolder strips path separators from the name', () => {
	const folder = files.createFolder(userId, null, '../../etc/passwd');
	// every separator becomes an underscore, so the name can never escape the tree
	assert.equal(folder.name, '.._.._etc_passwd');
	assert.ok(!folder.name.includes('/'));
});

test('uniqueName keeps collisions apart, case-insensitively', () => {
	files.createFolder(userId, null, 'Docs');
	const second = files.createFolder(userId, null, 'docs');
	assert.equal(second.name, 'docs (2)');
});

test('moveFile refuses to move a folder into its own descendant', () => {
	const parent = files.createFolder(userId, null, 'Parent');
	const child = files.createFolder(userId, parent.id, 'Child');
	assert.throws(() => files.moveFile(userId, parent.id, child.id), /own subfolder/i);
});

test('trash cascades to children and restore brings them back', () => {
	const parent = files.createFolder(userId, null, 'Trip');
	const child = files.createFolder(userId, parent.id, 'Day 1');
	const nestedId = addFile('notes.txt', child.id, 120);

	files.trashFile(userId, parent.id);
	assert.equal(files.getFile(userId, child.id).deletedAt !== null, true);
	assert.equal(files.getFile(userId, nestedId).deletedAt !== null, true);

	files.restoreFile(userId, parent.id);
	assert.equal(files.getFile(userId, child.id).deletedAt, null);
	assert.equal(files.getFile(userId, nestedId).deletedAt, null);
});

test('usage counts only live files and reports trash separately', () => {
	const before = files.usage(userId);
	const id = addFile('weighs.txt', null, 500);
	const after = files.usage(userId);
	assert.equal(after.bytes, before.bytes + 500);
	assert.equal(after.files, before.files + 1);

	files.trashFile(userId, id);
	const trashed = files.usage(userId);
	assert.equal(trashed.bytes, before.bytes);
	assert.equal(trashed.trashFiles, before.trashFiles + 1);
});

test('search treats % and _ as literal characters, not wildcards', () => {
	addFile('100% done.txt');
	addFile('under_score.txt');
	addFile('ordinary.txt');

	const percent = files.search(userId, '%');
	assert.deepEqual(
		percent.map((f) => f.name),
		['100% done.txt']
	);

	// the folder from the sanitisation test also contains underscores, so assert membership
	const underscore = files.search(userId, '_').map((f) => f.name);
	assert.ok(underscore.includes('under_score.txt'));
	assert.ok(!underscore.includes('ordinary.txt'));

	// and nothing but the underscore matches contain an underscore
	assert.ok(underscore.every((name) => name.includes('_')));
});

test('search still does a normal substring match', () => {
	addFile('holiday-photo.jpg');
	const hits = files.search(userId, 'holida');
	assert.ok(hits.some((f) => f.name === 'holiday-photo.jpg'));
});

test('two folders with the same name stay distinct (regression: createFolder ignored de-duplication)', () => {
	const a = files.createFolder(userId, null, 'Budget');
	const b = files.createFolder(userId, null, 'Budget');
	assert.notEqual(a.id, b.id);
	assert.notEqual(a.name, b.name);
	assert.equal(b.name, 'Budget (2)');
});

test('a search for % finds only literal percent signs (regression: LIKE wildcard leak)', () => {
	const hits = files.search(userId, '%').map((f) => f.name);
	assert.ok(hits.includes('100% done.txt'));
	assert.ok(hits.every((name) => name.includes('%')));
});

test('breadcrumbs walks from the root down to the current folder', () => {
	const a = files.createFolder(userId, null, 'A');
	const b = files.createFolder(userId, a.id, 'B');
	const trail = files.breadcrumbs(userId, b.id);
	assert.deepEqual(
		trail.map((c) => c.name),
		['My Drive', 'A', 'B']
	);
});

test('trashing a file owned by someone else reports nothing trashed', () => {
	const otherId = Number(
		db
			.prepare(`INSERT INTO users (tg_id, first_name, is_demo, created_at) VALUES (?,?,1,?)`)
			.run(`other-${Math.random()}`, 'Other', new Date().toISOString()).lastInsertRowid
	);
	const victimFile = addFile('not-yours.txt');
	const result = files.trashFile(otherId, victimFile);

	assert.equal(result.trashed, 0);
	assert.equal(files.getFile(userId, victimFile).deletedAt, null, 'the file must be untouched');
});

test('restoring someone else’s trashed file is refused', () => {
	const otherId = Number(
		db
			.prepare(`INSERT INTO users (tg_id, first_name, is_demo, created_at) VALUES (?,?,1,?)`)
			.run(`other2-${Math.random()}`, 'Other', new Date().toISOString()).lastInsertRowid
	);
	const trashed = addFile('mine-trashed.txt');
	files.trashFile(userId, trashed);
	assert.throws(() => files.restoreFile(otherId, trashed), /not found/i);
	assert.notEqual(files.getFile(userId, trashed).deletedAt, null, 'still trashed');
});
