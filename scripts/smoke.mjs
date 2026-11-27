#!/usr/bin/env node
/**
 * End-to-end smoke test against a running TeleDrive instance.
 *
 *   npm run dev            # in another terminal
 *   node scripts/smoke.mjs http://localhost:5173
 */
const base = process.argv[2] || 'http://localhost:5173';
const cookies = new Map();

const log = (ok, label, extra = '') => console.log(`${ok ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);

async function req(path, options = {}) {
	const res = await fetch(base + path, {
		...options,
		headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(cookies.size ? { cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join('; ') } : {}), ...(options.headers || {}) },
		redirect: 'manual'
	});
	for (const header of res.headers.getSetCookie()) {
		const pair = header.split(';')[0];
		const i = pair.indexOf('=');
		const name = pair.slice(0, i), value = pair.slice(i + 1);
		if (value) cookies.set(name, value);
		else cookies.delete(name);
	}
	return res;
}

const results = [];
const check = (ok, label, extra) => {
	results.push(ok);
	log(ok, label, extra);
};

// 1. Public pages
check((await req('/')).status === 200, 'landing page loads');
check((await req('/login')).status === 200, 'login page loads');
const guarded = await req('/drive');
check(guarded.status === 303 && guarded.headers.get('location')?.includes('/login'), 'drive is protected');

// 2. Demo login
check((await req('/api/auth/demo', { method: 'POST' })).status === 200, 'demo login');
check((await req('/drive')).status === 200, 'drive loads when signed in');

// 3. Folder
const folderRes = await req('/api/files', { method: 'POST', body: JSON.stringify({ name: `smoke-${Date.now()}`, parentId: null }) });
const folder = (await folderRes.json()).folder;
check(Boolean(folder?.id), 'create folder', folder?.name);

// 4. Upload + download roundtrip
const payload = Buffer.from('TeleDrive smoke test payload '.repeat(2000));
const init = await (await req('/api/upload/init', {
	method: 'POST',
	body: JSON.stringify({ name: 'smoke.txt', size: payload.length, mime: 'text/plain', parentId: folder.id })
})).json();
const chunkRes = await req(`/api/upload/chunk?fileId=${init.id}&index=0`, {
	method: 'POST',
	body: payload,
	headers: { 'content-type': 'application/octet-stream' }
});
check(chunkRes.status === 200, 'upload chunk');
const finished = await (await req('/api/upload/finish', { method: 'POST', body: JSON.stringify({ fileId: init.id }) })).json();
check(finished.file?.size === payload.length, 'finalize upload', `${finished.file?.size} bytes`);

const download = await req(`/api/files/${init.id}/download`);
const body = Buffer.from(await download.arrayBuffer());
check(body.length === payload.length && body.equals(payload), 'download roundtrip is byte-identical');

// 5. Search / star / trash / restore
const search = await (await req('/api/search?q=smoke')).json();
check(search.files.some((f) => f.id === init.id), 'search finds the file');
const starred = await req(`/api/files/${init.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'star' }) });
check((await starred.json()).file?.starred === true, 'star toggles');
check((await req(`/api/files/${init.id}`, { method: 'DELETE' })).status === 200, 'move to trash');
const trash = await (await req('/api/trash')).json();
check(trash.files.some((f) => f.id === init.id), 'trash lists the file');
check((await req(`/api/files/${init.id}`, { method: 'POST' })).status === 200, 'restore from trash');
check((await req(`/api/files/${init.id}?permanent=1`, { method: 'DELETE' })).status === 200, 'delete forever');

// 6. Logout
check((await req('/api/auth/logout', { method: 'POST' })).status === 303, 'logout');
check((await req('/drive')).status === 303, 'drive is protected again');

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
