import { redirect } from '@sveltejs/kit';
export function load({ locals, url, cookies }) {
	const next = url.searchParams.get('next');
	const safe = next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/drive';
	if (locals.user && url.searchParams.get('add') !== '1') throw redirect(303, safe);
	cookies.set('tg_login_next', safe, { path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', maxAge: 600 });
	return { error: url.searchParams.get('error'), next: safe };
}
