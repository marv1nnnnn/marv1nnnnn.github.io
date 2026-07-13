# Content directory

Site copy lives here and is compiled into `lib/signals.json` by `pnpm generate` (also run by `pnpm dev` / `pnpm build`). Public Media and Journal files are generated from Clin; edit their `site`-tagged notes instead of editing the generated files directly.

## Signals (folders)

| Folder | `pageType` | Notes |
|--------|------------|--------|
| `about/` | `profile` | `profile.json`: hero, sections, contact, optional `resume` `{ href, label?, subtitle? }` |
| `projects/` | `cards` | `cards/*.md` with frontmatter; optional `renderMode` in `signal.json` |
| `influences/` | `influences` | `influences.json` — vinyl-style records list |
| `listening/` | `list` | Generated `items.json` from public Clin media notes |
| `journal/` | `cards` | Generated cards from public Clin journal notes |

Each signal needs **`signal.json`** (metadata). Example:

```json
{
  "id": "your-signal-id",
  "freq": 95.0,
  "title": "YOUR TITLE",
  "pages": 1,
  "audioUrl": "/audio/your-ambient.mp3",
  "accentColor": "#FF0000",
  "background": "linear-gradient(...)",
  "pageType": "cards"
}
```

`freq` is a numeric ordering key used in generated data (not a live tuner in the current UI).

### Profile (`pageType`: `"profile"`)

`profile.json` example:

```json
{
  "hero": {
    "eyebrow": "About",
    "title": "Name",
    "subtitle": "Role",
    "description": "Short bio paragraph."
  },
  "resume": {
    "label": "Resume",
    "subtitle": "Role line",
    "href": "/resume/your-file.pdf"
  },
  "sections": [{ "title": "Section", "body": "Text..." }],
  "contact": [{ "label": "Email", "value": "x@y.com", "href": "mailto:..." }]
}
```

Place PDFs under `public/resume/` and reference them with a path like `/resume/...`.

### Cards (`pageType`: `"cards"`)

1. Set `pageType` and optional `intro` in `signal.json`.
2. Add `content/<id>/cards/*.md` with frontmatter: `id`, `title`, `date`, `summary`, `tags`, etc.

### List (`pageType`: `"list"`)

Use `items.json` (array of objects with `title`, `creator`, `type`, optional `date`, `url`).

### Influences (`pageType`: `"influences"`)

Use `influences.json` (see `content/influences/` for the expected record shape).

## Editing workflow

For most signals, edit files under `content/`, then run `pnpm generate` or `pnpm dev`.

For Media and Journal, Clin is the source of truth. Only notes tagged `site` are exported:

- Media tags: `site`, `media`, and one of `music`, `video`, `text`, `game`, `live`. Start the body with `Date:`, `Creator:`, and optional `URL:` lines.
- Journal tags: `site`, `journal`, plus public article tags. Start the body with `Date:`, `Summary:`, and `ID:` lines, then a blank line and Markdown.

Run `pnpm sync:clin` to refresh generated files. `/media sync` also refreshes and publishes them. The one-time, idempotent import is `pnpm migrate:clin`.

## Markdown

- Quote frontmatter string values where YAML could misparse.
- Prefer `YYYY-MM-DD` dates for cards.
