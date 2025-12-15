# Anomaly Scanner Content Manager

A Raycast extension for managing content in the Anomaly Scanner portfolio site.

## Features

- **Add Listening Item**: Quickly add music, videos, texts, games, or live events to your listening log
- **Add Card**: Create new project or journal cards with markdown content
- **Browse Content**: View, search, and manage all your content in one place
- **Quick Add**: Unified entry point for adding any type of content

## Installation

1. Make sure you have [Raycast](https://raycast.com) installed
2. Navigate to the extension directory:
   ```bash
   cd tools/raycast-anomaly-content
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Import the extension into Raycast:
   ```bash
   npm run dev
   ```

## Configuration

The extension requires two preferences to be set:

- **Content Path**: Path to your `content/` folder (default: `~/Documents/code/marv1nnnnn.github.io/content`)
- **Project Path**: Path to your project root (default: `~/Documents/code/marv1nnnnn.github.io`)

You can configure these in Raycast's extension preferences.

## Commands

### Add Listening Item
Add a new item to your listening log with:
- Title
- Creator
- Type (music, video, text, game, live)
- URL (optional)
- Date

### Add Card
Create a new project or journal card with:
- Signal type (projects or journal)
- Title and subtitle
- ID (auto-generated from title)
- Summary and tags
- Markdown content
- Option to open in Cursor after creation

### Browse Content
View all your content with:
- Filter by category (listening, projects, journal)
- Search across all items
- Delete items
- Open cards in Cursor

### Quick Add
A unified entry point that lets you choose what type of content to add.

## Development

```bash
# Start development mode
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Notes

- The extension automatically runs `pnpm generate` after adding content to keep `lib/signals.json` in sync
- Card files are opened in Cursor by default
- All dates default to today


