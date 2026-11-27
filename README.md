# TeleDrive — Unlimited Personal Cloud

A clean-room clone of [drive.kriztech.in](https://drive.kriztech.in/) built with **Node.js**, **SvelteKit**, **Svelte 5**, **Tailwind CSS 4** and **SQLite**. Users log in with their Telegram account and their files are stored as documents inside Telegram itself — so the drive really is unlimited.

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

## Notes

- Sessions are httpOnly cookies, 30 days, stored in SQLite — rotate them by deleting rows from `sessions`.
- Files in trash keep their Telegram messages; *delete forever* removes them from Telegram as well.
- `data/` is git-ignored; back it up if you rely on the local blob cache.
