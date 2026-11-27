import { redirect } from '@sveltejs/kit';

export function load({ locals, url }) {
	if (locals.user) {
		throw redirect(303, url.searchParams.get('next') || '/drive');
	}
	return { error: url.searchParams.get('error') };
}
