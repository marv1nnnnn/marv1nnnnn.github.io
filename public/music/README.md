# Music Folder

This folder contains the music files for the blog reader application.

## Structure

- `playlist.json` - Contains metadata for all music tracks
- `*.mp3` - Music files referenced in the playlist

## Adding New Music

1. Add your music file (e.g., `new-song.mp3`) to this folder
2. Update `playlist.json` with the new track information:

```json
{
  "id": "5",
  "title": "New Song Title",
  "artist": "Artist Name", 
  "filename": "new-song.mp3",
  "duration": 240
}
```

## Supported Formats

- MP3
- WAV
- OGG
- M4A

The application uses Howler.js which supports most common audio formats.

## Note

Music files are not included in the repository due to size constraints. Place your own music files here following the naming convention specified in `playlist.json`. 