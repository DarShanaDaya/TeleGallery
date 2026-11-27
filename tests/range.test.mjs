import { test } from 'node:test';
import assert from 'node:assert/strict';

const { parseRange } = await import('../src/lib/server/naming.js');

test('parseRange returns null when there is no Range header', () => {
	assert.equal(parseRange(null, 1000), null);
	assert.equal(parseRange('', 1000), null);
});

test('parseRange handles an open-ended range (bytes=500-)', () => {
	assert.deepEqual(parseRange('bytes=500-', 1000), { start: 500, end: 999 });
});

test('parseRange handles an explicit range (bytes=100-199)', () => {
	assert.deepEqual(parseRange('bytes=100-199', 1000), { start: 100, end: 199 });
});

test('parseRange handles a suffix range (bytes=-500)', () => {
	assert.deepEqual(parseRange('bytes=-500', 1000), { start: 500, end: 999 });
});

test('parseRange clamps an end beyond the file size', () => {
	assert.deepEqual(parseRange('bytes=900-99999', 1000), { start: 900, end: 999 });
});

test('parseRange clamps a suffix larger than the file', () => {
	assert.deepEqual(parseRange('bytes=-5000', 1000), { start: 0, end: 999 });
});

test('parseRange reports a start past the end as unsatisfiable', () => {
	assert.deepEqual(parseRange('bytes=2000-', 1000), { unsatisfiable: true });
});

test('parseRange ignores a malformed header instead of throwing', () => {
	assert.equal(parseRange('bytes=abc', 1000), null);
	assert.equal(parseRange('items=0-10', 1000), null);
});

test('parseRange serves the whole single-byte remainder correctly', () => {
	assert.deepEqual(parseRange('bytes=999-', 1000), { start: 999, end: 999 });
});
