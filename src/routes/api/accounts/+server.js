import { browserAccounts, SESSION_COOKIE, MAX_AGE } from '#lib/server/auth.js';
import { json, requireUser, safeJson } from '#lib/server/http.js';
export function GET(event) {
    const { error } = requireUser(event); if (error) return error;
    const current = event.cookies.get(SESSION_COOKIE);
    return json({ accounts: browserAccounts(event).map(({id,user}) => ({ user, current: id === current })) });
}
export async function POST(event) {
    const { error } = requireUser(event); if (error) return error;
    const body = await safeJson(event.request);
    const account = browserAccounts(event).find(({user}) => user.id === body.userId);
    if (!account) return json({error: 'Account not available'}, 404);
    event.cookies.set(SESSION_COOKIE, account.id, { path:'/', httpOnly:true, sameSite:'lax', secure:event.url.protocol === 'https:', maxAge: MAX_AGE });
    return json({ok:true});
}
