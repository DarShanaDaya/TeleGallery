# TeleDrive — Unlimited Personal Cloud

A clean-room clone of [drive.kriztech.in](https://drive.kriztech.in/) built with **Node.js**, **SvelteKit**, **Svelte 5**, **Tailwind CSS 4** and **SQLite**. Users log in with their Telegram account and their files are stored as documents inside Telegram itself — so the drive really is unlimited.

The interface follows what is loosely called the **Fable 5.2** design direction: warm paper-and-ink neutrals, hairline rules instead of stacked cards, a high-contrast serif for display type, Inter for UI copy and mono for data and labels, with colour reserved for meaning (action, danger, status) and a separately tuned dark theme rather than an inverted light one.

```
Landing page  →  Login with Telegram  →  File manager  →  Files live in Telegram
```

## Features

| | |
|---|---|
| **Telegram login** | Official Telegram Login Widget, verified with HMAC-SHA256 against the bot token (replay-protected with `auth_date`). |
| **Unlimited storage** | Every upload is split into 45 MB chunks and stored as a Telegram document in your private storage chat. Nothing is kept on the server. |
| **Streamed downloads** | Files are reassembled on the fly with `Range` support, so video/audio seek and large downloads stream. |
| **Full file manager** | Folders, breadcrumbs, rename, move, star, trash, restore, delete forever, global search, grid + list views. |
| **Preview** | Images, video, audio and PDFs preview inline. |
| **Dashboard** | Storage usage, per-type breakdown, Telegram connection status, drag-and-drop uploads with live progress. |
| **Demo mode** | Works — and stores files locally — before you even create a bot. |
| **Multiple sessions** | Every device gets its own session. Settings lists them with device, IP and last activity, and you can sign one out — or all others — without touching the rest. |
| **Streamable video** | Proper RFC 7233 ranges: `206` with `Content-Range`, `416` when unsatisfiable, and `HEAD` for metadata. Seeking works in browsers and `ffmpeg`. |
| **Direct links** | Share a file with an expiring, revocable, unguessable token (`/s/<token>`) — no sign-in needed to stream or download. |
| **Downloads & save a copy** | Attachment downloads, plus "Save a copy" which re-encodes the filename server-side. |
| **Two palettes** | Light "paper" and a hand-tuned "ink" dark theme, toggled in the UI and remembered. Set before first paint, so no flash. |

## Quick start

```bash
npm install
cp .env.example .env      # optional: fill in your bot credentials
npm run dev               # http://localhost:5173
```

Without a bot token the app runs in **demo storage mode**: you can sign in with the *Try the demo account* button and everything (upload, preview, trash, search) works against local disk. This is the fastest way to click through the UI.

### Docker (recommended)

```bash
cp .env.example .env      # fill in the Telegram values you need
docker compose up -d --build
```

The app is then on <http://localhost:3000>. State lives in the `teledrive-data`
volume at `/data` (SQLite database + blob cache); the container runs as the
unprivileged `node` user and has a healthcheck on `/api/health`.

Plain Docker, without Compose:

```bash
docker build -t teledrive .
docker run -d --name teledrive \
  -p 3000:3000 \
  -v teledrive-data:/data \
  --env-file .env \
  --restart unless-stopped \
  teledrive
docker logs -f teledrive
```

**Image layout.** Three stages: a `deps` stage with `python3/make/g++` (needed
only if `better-sqlite3` has no prebuilt binary for the platform), a `build`
stage that runs `npm run build` and prunes dev dependencies, and a slim runtime
stage that copies only `build/`, `node_modules/`, `package.json`, `server.js`
and `healthcheck.js`. The toolchain never reaches the runtime image.

**Why Debian slim, not Alpine.** `better-sqlite3` is a native module. Alpine's
musl libc has no prebuilt binaries, so the image would have to compile it on
every build and carry the compiler into the runtime layer to stay upgradeable.
Bookworm ships glibc and gets the prebuild.

**Runtime behaviour.**

| Setting | Default | Notes |
|---|---|---|
| `PORT` | `3000` | Port the server binds inside the container. |
| `HOST` | `0.0.0.0` | Must be `0.0.0.0` in a container, not `127.0.0.1`. |
| `DATA_DIR` | `/data` | Mount a volume here or all state is lost on `docker rm`. |
| `ORIGIN` | – | Set to your public URL when behind a TLS proxy. |

`server.js` handles `SIGTERM`/`SIGINT` by draining open connections (up to 20s)
before exiting, so `docker stop` doesn't truncate an in-flight upload.

**Behind a reverse proxy.** Terminate TLS at the proxy and pass `ORIGIN=https://drive.example.com`, then remember to run `/setdomain` in BotFather for the same host — the Telegram login widget refuses a mismatch.

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 0;      # uploads are chunked, but don't cap them
    proxy_request_buffering off; # stream chunks straight through
    proxy_read_timeout 300s;
}
```

### Without Docker

```bash
npm run build
node server.js            # PORT / HOST and .env are respected
```

## Connecting Telegram

1. **Create the bot** — message [@BotFather](https://t.me/BotFather), send `/newbot`, keep the token.
   ```env
   TELEGRAM_BOT_TOKEN=123456789:AA...
   TELEGRAM_BOT_USERNAME=your_bot_name
   ```
2. **Enable the login widget** — in BotFather run `/setdomain`, pick your bot, and set the exact domain you serve the app from (e.g. `drive.example.com`). Telegram's widget only appears for a matching domain, and it requires HTTPS.
3. **Choose the storage chat** — send your bot any message (or create a private channel and add the bot as admin), then read the chat id:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates | grep -o '"chat":{"id":[-0-9]*'
   ```
   ```env
   TELEGRAM_STORAGE_CHAT_ID=-1001234567890
   ```
   Leaving it empty stores files in each user's own chat with the bot instead.
4. **Set a session secret** — `SESSION_SECRET=$(openssl rand -hex 32)`.
5. Restart. The login page now renders the real Telegram widget and the status banner in **Settings** confirms the connection.

> **Size limits.** The public Bot API accepts uploads up to 50 MB and allows downloads up to 20 MB. TeleDrive splits uploads into 45 MB chunks (`TELEGRAM_CHUNK_SIZE`) so uploads work out of the box, but to store and retrieve *large* files you should run [Telegram's local Bot API server](https://github.com/tdlib/telegram-bot-api) and point `TELEGRAM_API_BASE` at it — that raises the limits to 2 GB per chunk with no download cap.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | – | Bot token from BotFather. Enables real storage + login. |
| `TELEGRAM_BOT_USERNAME` | – | Bot username (no `@`) for the login widget. |
| `TELEGRAM_STORAGE_CHAT_ID` | user's chat | Chat/channel where documents are stored. |
| `TELEGRAM_API_BASE` | `https://api.telegram.org` | Point at a self-hosted Bot API server. |
| `SESSION_SECRET` | dev value | Cookie signing secret — change in production. |
| `SITE_NAME` | `TeleDrive` | Branding shown across the UI. |
| `DATA_DIR` | `data` | SQLite database + local blob cache. |
| `ALLOW_DEMO_LOGIN` | `true` | Show the demo sign-in button. Set to `false` when going live. |
| `MAX_FILE_SIZE` | 4 GiB | Largest accepted upload. |
| `TELEGRAM_CHUNK_SIZE` | 45 MB | Chunk size for Telegram documents. |

## Design system

Tokens live in `src/app.css`; every colour is a CSS variable mapped through Tailwind's `@theme inline`, so both palettes share one set of utility names (`bg-paper-2`, `text-ink-2`, `border-rule`).

| Token | Light "paper" | Dark "ink" | Used for |
|---|---|---|---|
| `--paper` | `#f5f2ea` | `#13120e` | page canvas |
| `--paper-2` | `#fffdf7` | `#1a1914` | panels, cards |
| `--ink` | `#191712` | `#f2ede1` | headings, primary text |
| `--ink-2` | `#4d4739` | `#c4bdad` | body copy |
| `--ink-3` | `#857e6e` | `#8b8475` | metadata, labels |
| `--rule` | 14% ink | 15% ink | hairline dividers |
| `--accent` | `#1e46c8` | `#89a4ff` | links, active states |
| `--danger` / `--success` / `--warn` | rust / forest / ochre | softened equivalents | meaning only |

Type: **Instrument Serif** (display), **Inter** (UI), **JetBrains Mono** (labels and data). Motion is CSS-only and disabled under `prefers-reduced-motion`.

## How it works

```
src/
├─ lib/
│  ├─ server/
│  │  ├─ config.js      env loading + paths
│  │  ├─ db.js          SQLite schema (users, sessions, files, parts)
│  │  ├─ auth.js        sessions, user upsert
│  │  ├─ telegram.js    HMAC login verification, sendDocument, getFile
│  │  ├─ files.js       folder tree, rename/move/star/trash/search/usage
│  │  ├─ upload.js      chunk intake + finalize
│  │  └─ download.js    multipart reassembly with Range support
│  ├─ components/       Sidebar, Topbar, FileGrid, PreviewModal, …
│  ├─ uploader.svelte.js   chunked XHR uploader with live progress
│  └─ drive.svelte.js      shared drive state + API helper
└─ routes/
   ├─ +page.svelte           marketing landing page
   ├─ login/                 Telegram widget + demo login
   ├─ drive/                 file manager (my drive, starred, recent, trash, search, settings)
   └─ api/                   auth, files, upload, trash, status
```

A file is one row in `files` plus one row per chunk in `parts` (Telegram chat id, message id, file id). On download the parts are fetched from Telegram (and cached on disk) and piped to the client in order.

## Sessions, sharing and streaming

**Sessions.** A row per device in `sessions` (user agent, IP, last seen). `GET /api/sessions` lists them, `DELETE /api/sessions` with `{ id }` revokes one or `{ all: true }` keeps only the caller. Revocation is scoped by `user_id`, so an id belonging to someone else is inert.

**Share links.** `POST /api/files/:id/shares` with `{ days }` (0 = never) returns a token; `/s/<token>` is the public page and `/s/<token>/file` the raw bytes. Tokens are 24 random bytes (base64url). This is a capability URL: anyone with it can read the file, so treat it like a password and revoke when done. Links stop working when revoked, expired, or when the file is trashed.

**Streaming.** `streamFile()` parses `Range` via `parseRange()` in `naming.js` and answers `206`/`416`/`200` per RFC 7233, with `HEAD` handled without touching storage. Telegram chunks are cached to disk on first read, so a second seek costs nothing.

**A note on the Bot API ceiling.** Public `api.telegram.org` refuses `getFile` above 20 MB, so files past that are assembled chunk by chunk through this server. Point `TELEGRAM_API_BASE` at a self-hosted Bot API server and the ceiling goes away (and a single-chunk file can be redirected straight to Telegram's CDN, which `download.js` already supports via `directTelegramUrl`).

> **Demo accounts are per-visitor.** Each demo sign-in creates a unique throwaway account, so two people clicking "Try the demo" never see each other's files. Set `ALLOW_DEMO_LOGIN=false` in production.

## Testing

```bash
npm test        # unit tests (node:test) — auth signing, file tree, search, paths
npm run smoke   # end-to-end against a running server: npm run dev, then npm run smoke
```

`tests/security.test.mjs` covers the Telegram HMAC verifier (valid, tampered, wrong secret, replay, missing hash), blob-path containment and the `Content-Disposition` filename parser. `tests/files.test.mjs` covers folder de-duplication, move-cycle rejection, trash cascade/restore, usage accounting and LIKE escaping in search. Both defects found this way — `createFolder` ignoring de-duplication, and `%`/`_` acting as SQL wildcards in search — have named regression tests that were verified to fail before the fix.

## Notes

- Sessions are httpOnly cookies, 30 days, stored in SQLite — rotate them by deleting rows from `sessions`.
- Files in trash keep their Telegram messages; *delete forever* removes them from Telegram as well.
- `data/` is git-ignored; back it up if you rely on the local blob cache.
