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
| **Two palettes** | Light "paper" and a hand-tuned "ink" dark theme, toggled in the UI and remembered. Set before first paint, so no flash. |

## Quick start

```bash
npm install
cp .env.example .env      # optional: fill in your bot credentials
npm run dev               # http://localhost:5173
```

Without a bot token the app runs in **demo storage mode**: you can sign in with the *Try the demo account* button and everything (upload, preview, trash, search) works against local disk. This is the fastest way to click through the UI.

### Production

```bash
npm run build
node build/index.js       # PORT / HOST and .env are respected
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
