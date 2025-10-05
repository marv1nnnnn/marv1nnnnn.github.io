# Content Directory

This folder contains all the content for the Anomaly Scanner signals. Content is organized by signal and automatically compiled to the website during build.

## Structure

Each signal lives in its own folder:

```
content/
├── about/          # 88.1 MHz - Profile signal
├── projects/       # 94.5 MHz - Projects cards
├── listening/      # 101.2 MHz - Listening list
└── journal/        # 107.8 MHz - Journal cards
```

## Adding a New Signal

1. Create a new folder in `content/` with your signal ID
2. Add a `signal.json` file with metadata:

```json
{
  "id": "your-signal-id",
  "freq": 95.0,
  "title": "YOUR SIGNAL TITLE",
  "pages": 3,
  "audioUrl": "/audio/your-ambient.mp3",
  "broadcastDate": "2025-10-04",
  "location": "YOUR LOCATION",
  "tags": ["TAG1", "TAG2"],
  "summary": "Your signal description",
  "accentColor": "#FF0000",
  "background": "linear-gradient(...)",
  "pageType": "cards"
}
```

3. Add your content based on page type:

### Profile Page (`pageType: "profile"`)

Create `profile.json`:

```json
{
  "hero": {
    "eyebrow": "BROADCAST TYPE",
    "title": "Your Title",
    "subtitle": "Your subtitle",
    "description": "Your description"
  },
  "sections": [
    { "title": "Section 1", "body": "Content..." }
  ],
  "contact": [
    { "label": "Email", "value": "email@example.com", "href": "mailto:..." }
  ]
}
```

### Cards Page (`pageType: "cards"`)

1. Add `intro` to `signal.json`:
```json
{
  ...
  "intro": {
    "title": "Your Section Title"
  }
}
```

2. Create `cards/` folder and add `.md` files:

```md
---
id: "card-id"
title: "Card Title"
subtitle: "Card Subtitle"
date: "2025-10-04"
summary: "Card description"
tags: [tag1, tag2]
---

## Your Markdown Content

Write your content here...
```

### List Page (`pageType: "list"`)

Create `items.json`:

```json
[
  {
    "title": "Item Title",
    "creator": "Creator Name",
    "type": "album|text|video",
    "date": "2025-10-04"
  }
]
```

## Editing Content

1. Edit any file in `content/`
2. Run `pnpm generate` to regenerate `lib/signals.json`
3. Run `pnpm dev` or `pnpm build`

The `pnpm dev` and `pnpm build` commands automatically run the generator.

## Important Notes

- Always quote YAML frontmatter values in markdown files
- Dates should be in YYYY-MM-DD format
- Card files are automatically sorted by date (newest first)
- The frequency (freq) determines signal position on the scanner dial
