# DxVibe 🎵

**Your music, your vibe.** DxVibe is a music player web app built with React and TypeScript. Search real songs online, build a playlist, play them with a live visualizer, and generate mood-based mixes. It runs entirely in the browser with no backend.

## Features

- **Online search with autocomplete:** results appear as you type, with cover art (iTunes Search API)
- **Playlist management:** search, filter by genre, sort, favourites, delete with a confirmation popup
- **Custom music player:** play/pause, next/previous, shuffle, seek bar, volume
- **Live audio visualizer** using the Web Audio API
- **Mood mix:** pick a mood and a duration, and the app builds a matching playlist
- **Listening stats:** total time, plays, top songs, time by genre and mood
- **Keyboard shortcuts:** `Space` play/pause, `←` / `→` previous/next
- **Remembers your session:** playlist, audio files and the current song survive a refresh
- **Polished UI:** dark theme, hover effects, animated logo and wordmark, responsive layout

## Tech stack

| Technology | Used for |
|---|---|
| React | Component-based UI |
| TypeScript | Type safety (`Song`, `Mood`, `Genre`, discriminated-union player actions) |
| Vite | Dev server and build |
| CSS | Variables, grid, flexbox, animations |
| iTunes Search API | Song data, cover art, 30-second previews |
| localStorage | Songs, favourites, play counts, player state |
| IndexedDB | Audio files |
| Web Audio API | Visualizer |
| Media Session API | Cover and title in OS media controls |

## Concepts demonstrated

- Hooks: `useState`, `useEffect`, `useMemo`, `useRef`, `useReducer`, and a custom `useLocalStorage` hook
- Debounced search and request cancellation with `AbortController`
- Lifting state up, derived state, effect cleanup
- TypeScript utility types (`Omit`, `Pick`, `Record`), `as const` unions, and type guards

## Getting started

```bash
git clone https://github.com/YOUR-USERNAME/dxvibe.git
cd dxvibe
npm install
npm run dev
```

Then open http://localhost:5173.

## Limitations

- Songs added from search are **30-second previews** (a limit of the free iTunes API). Your own mp3 files play in full.
- Data is stored in your browser, so clearing browser data clears the playlist.

## Future improvements

- A detailed "Your listening" page with charts
- User accounts and a database
- Repeat mode, queue, and named playlists
- Automated tests

## Author

**Tarun Chuphal**, Chandigarh University / BE.CSE
