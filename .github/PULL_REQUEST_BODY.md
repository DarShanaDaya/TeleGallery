# TeleDrive — a Telegram-backed unlimited cloud drive

Built with **Node.js**, **SvelteKit**, **Svelte 5**, **Tailwind CSS 4** and **SQLite**. Users sign in with Telegram, and their files live as documents inside Telegram itself — so the drive is genuinely unlimited.

No PHP, no Python: one runtime for the UI and the server, one container to deploy.

---

## What is in this branch

| Commit | What it does |
|---|---|
| `d7dceef` | **The app.** Telegram login (HMAC-verified), chunked uploads stored as Telegram documents, streamed downloads, full file manager. |
| `ffc899a` | First design pass (later superseded). |
| `e20fbf4` | **Unit tests + two real bug fixes** — folder de-duplication and LIKE-wildcard leakage in search. |
| `54f7358` | **Multi-device sessions, share links, streamable video, downloads, save-a-copy.** |
| `f37a305` | **Docker deploy** — multi-stage image, healthcheck, graceful shutdown. |
| `da8bc5f` | **Design rebuild** against the `frontend-design` skill; plan recorded in `docs/design.md`. |
| `be084eb` | **Telegram link import, audit log, one-click link copy, bookmarkable player.** |

## Features

- **Telegram login** — official Login Widget, verified HMAC-SHA256 against the bot token, replay-protected via `auth_date`. Sessions are per-device and revocable.
- **Unlimited storage** — uploads are split into 45 MB chunks and stored as Telegram documents in your private storage chat. Nothing is kept on the server.
- **Import from a link** — paste a `t.me/...` post link and the file is copied **in place** with `copyMessage`. The bytes never traverse the server, so a 1.5 GB import is instant.
- **Streamable video** — RFC 7233 ranges (`206`, `416`, `HEAD`), so seeking works in browsers and `ffmpeg`.
- **Full player** — bookmarkable `/drive/watch/<id>` with a queue, keyboard control, speed, resume position, fullscreen, loop.
- **Share links** — unguessable, expiring, revocable tokens served at `/s/<token>` with no sign-in.
- **Audit log** — every import, upload, download, share, rename, trash and sign-in, filterable at `/drive/activity`.
- **File manager** — folders, rename, move, star, search, trash/restore/purge, grid and list views, inline preview.
- **Docker** — `docker compose up -d --build`, one volume, non-root, healthchecked.

## Verification

Run in this session, on the final commit:

| Gate | Result |
|---|---|
| `npm test` (node:test) | **63 / 63 passing** |
| `npm run smoke` (end-to-end) | **17 / 17 passing** |
| `vite build` | exit 0, no warnings |
| Docker runtime (simulated) | production server boots from the image COPY set, 17/17 smoke, healthcheck exit 0 |

Tests were written **before** the implementation for every feature added after the first commit, and each fix has a regression test that was verified to fail when the bug is reintroduced.

Bugs the verification caught and fixed along the way:

1. `createFolder` ignored de-duplication — two folders could share a name.
2. `%` and `_` acted as SQL wildcards in search.
3. Every demo visitor shared one drive (`tgId: 'demo-1'`), exposing other people's files.
4. Trashing an unowned file returned `{"trashed":1}` while doing nothing.
5. `/s/[token]/+server.js` shadowed the public share page.
6. A malformed import link reported "no bot token" instead of "invalid link".

## How to run

```bash
docker compose up -d --build        # http://localhost:3000
```

Or without Docker:

```bash
npm install
cp .env.example .env
npm run dev
```

Without a bot token the app runs in **local demo storage mode**, so every screen works before you create a bot. Each demo visitor gets their own throwaway account.

### Connecting Telegram

1. `@BotFather` → `/newbot` → `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`.
2. `/setdomain` → your public HTTPS domain (the Login Widget requires a match).
3. Send the bot a message (or add it to a channel), then copy the chat id into `TELEGRAM_STORAGE_CHAT_ID`.

## Honest gaps

Things I could **not** verify in this environment, listed so a reviewer can check them first:

- **No Docker daemon here**, so `docker build` itself never ran. I replicated the runtime stage's COPY set into a clean directory and tested that instead. Unproven: the `npm ci` layer and whether `better-sqlite3@13` ships a prebuilt binary for `node:22-bookworm-slim` on your architecture (the build stage carries a compiler, so it should still succeed, just slower).
- **No browser**, so the UI was reviewed by inspecting rendered HTML and built CSS, not by looking at screenshots.
- **The import path has never touched real Telegram.** The tests inject a `copy` function, so the logic is proven but the live `copyMessage` → `getMessage` fallback round-trip is not. Try it with a real bot token first.
- **Demo login defaults to `true`.** Set `ALLOW_DEMO_LOGIN=false` in production, or anonymous visitors can create accounts.

## Known limits worth knowing before merging

- The public Bot API caps uploads at 50 MB per request and downloads at 20 MB. Chunking to 45 MB handles the upload side; large *downloads* need a self-hosted Bot API server (`TELEGRAM_API_BASE`), which the code already supports.
- `copyMessage` requires the bot to be able to read the source chat — a member of the group, or an admin of the channel.
- Share links are capability URLs: anyone with the token can read the file until it is revoked or expires.
