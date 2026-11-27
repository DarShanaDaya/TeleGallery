# Design plan

Written against the `frontend-design` skill brief, before touching code.

## The brief, in one line

A file manager whose files are not on a server at all — they are documents in a
Telegram chat, cut into chunks and stitched back together on the way out.

Audience: someone who already has Telegram open in another tab. Their job: put a
file somewhere permanent, and get it back.

## What the subject actually gives us

Two things that are specific to this product and not to cloud storage in general:

1. **The drive is a chat log.** Every file is a message. The mental model is a
   conversation you keep with a bot, not a folder tree in a data centre.
2. **Every file is stitched.** A 212 MB file is five documents. The assembly step
   is the interesting engineering and the honest explanation of the size limits.

So the visual idea is a **seam**: one thin dashed thread that runs down the file
list, with each file's glyph sitting on it. It encodes the real thing (files
threaded in from a chat) instead of decorating the page, and it is the single
bold element — everything around it stays quiet.

## Tokens

Colour — cool mist and petrol, not warm cream (that look is a default, and it was
the previous pass):

| Name | Light | Dark | Role |
|---|---|---|---|
| mist | `#E9EEEA` | `#101B1D` | page canvas |
| shell | `#FCFDFC` | `#16262A` | panels, list rows |
| ink | `#13211F` | `#E8EFEC` | primary text |
| slate | `#5C6E69` | `#8FA5A1` | secondary text |
| thread | `#0F7C7B` | `#5AD1C8` | accent: actions, active, the seam |
| wine | `#A63D53` | `#E08A9B` | destructive only |

Green-grey canvas with a teal accent is derived from Telegram's blue without
copying the brand, and from "cloud" without a gradient.

Type — two families, clearly distinct:

- **Bricolage Grotesque** (display): headlines, product name, big numbers. It has
  human irregularity — slightly wonky terminals — so it doesn't read as
  Inter-with-letter-spacing.
- **Instrument Sans** (UI): body copy, controls, tables. Neutral enough to be
  legible at 12px, distinct enough from Bricolage to justify two files.
- No monospace, no all-caps labels. Numbers use `font-variant-numeric: tabular-nums`.

Layout:

```
landing                         drive
┌────────────────────────┐      ┌──────┬──────────────────────┐
│ TeleDrive      [Log in]│      │ nav  │ My Drive    [Upload]  │
│                        │      │      ├──────────────────────┤
│ Put a file somewhere   │      │      │ │ ● clip.mp4   212 MB │  ← the seam
│ permanent.             │      │      │ │ ● notes.md    12 KB │     is this
│                        │      │      │ │ ● Backup      folder│     rail
│ [Log in]  How it works │      │      │ │                      │
│                        │      │      ├──────────────────────┤
│  ┌─ your Telegram ─┐   │      │      │ ● = file glyph on the │
│  │  ●  clip.mp4    │   │      │      │     thread           │
│  │  ●  notes.md    │   │      │      └──────────────────────┘
│  └─ your drive ────┘   │
└────────────────────────┘
```

Left-aligned throughout. Content column capped at ~68ch for prose.

Principles:

1. The seam is the only memorable device. Use it once, in the file list.
2. Sentence case everywhere. No eyebrow labels, no caps-with-tracking.
3. Structure must mean something: the thread means "these came from a chat".
4. Radius 10–12px on interactive surfaces, 0 on the thread itself.
5. One orchestrated motion: the seam draws down once on load.

## Critique pass, before building

Checked my own plan against the tells a generated page falls into:

- Warm cream + high-contrast serif + terracotta accent → **removed**. That was
  exactly the previous pass. Replaced with cool mist + grotesque + teal.
- ALL-CAPS tracked labels and mono metadata → **removed**; sentence case, no mono.
- `01 / 02 / 03` section markers → **removed** from features and FAQ. Kept only in
  "How it works", where the content genuinely is a sequence, and even there the
  thread does the numbering visually.
- `A · B · C` middle-dot meta strings → replaced with prose ("5 files, 212 MB").
- Arrows appended to buttons → removed.
- Identical rounded cards for everything → list rows separated by the seam,
  hierarchy from weight and size rather than boxes.
- Serif italic on one word of a headline → removed.

Kept deliberately: the thread count on the seam (information, not decoration).

## What I could not do

The skill asks for screenshots to critique my own work. This sandbox has no
browser and cannot download Chromium, so the visual review was done by reading
the rendered HTML and the CSS, not by looking at pixels. Flagged in the commit.

## Later: browse by photo

`GET /api/library?kind=image|video` plus a Photos tab that shows a justified
grid of image files grouped by month. This is the most useful addition for a
personal drive and it reuses the existing `mime` column.
