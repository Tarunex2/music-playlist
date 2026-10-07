# Playlist Manager (React + TypeScript + Vite)

## Run it
```bash
npm install
npm run dev
npm run build   # type-checks with tsc, then builds
```
## Playing real audio
Pick an mp3 / wav / m4a from your computer: either in the "Add a song" form, or with
"Attach audio" on an existing song. Files are kept in your browser (IndexedDB), so they
are still there after a refresh. Songs with no audio file play a silent timer preview.

## TypeScript concepts used (and where)
| Concept | File |
|---|---|
| Literal types, `as const`, union types (`Genre`, `SortKey`) | `types.ts` |
| `interface` for data and props | `types.ts`, all components |
| Utility type `Omit` (`NewSong`) | `types.ts`, `SongForm.tsx` |
| Discriminated union (`PlayerAction`) + typed `useReducer` | `types.ts`, `App.tsx` |
| Generic function with a callback (`sortBy<T>`) | `utils/helpers.ts` |
| Generic hook `useLocalStorage<T>` | `hooks/useLocalStorage.ts` |
| `number \| null` return type and narrowing | `parseDuration`, `SongForm.tsx` |
| Optional return values (`string \| null`) | `pickNext` |
| Event types and `as` assertions | `SongForm.tsx`, `Toolbar.tsx` |
| `useRef<HTMLAudioElement>`, `unknown` in `catch`, `Promise<T>` | `App.tsx`, `utils/audioStore.ts` |
| `useMemo`, `useEffect` cleanup, functional `setState` | `App.tsx` |

## Practice questions
1. Why is `Genre` built from the `GENRES` array instead of typed by hand?
2. What does `Omit<Song, "id" | "favorite" | "addedAt">` give you, and why does the form use it?
3. Why does `parseDuration` return `number | null` instead of `number`?
4. In `sortBy<T>`, what does the generic `T` let you avoid compared with typing it for `Song`?
5. Why does the reducer not pick a random song for shuffle?
6. What would go wrong if the interval effect had no cleanup function?
7. Why does `setSongs((prev) => ...)` use a function instead of `setSongs(songs.map(...))`?

## Extend it
- Add multiple playlists, with a `Playlist` interface holding `songIds: string[]`.
- Add a "repeat" mode as a union type: `"off" | "all" | "one"`.
- Add drag and drop to reorder songs.

## More practice questions
8. Why is the audio element's URL kept in state while the file itself is stored in IndexedDB?
9. In `run<T>` inside `audioStore.ts`, what does the generic `T` describe?
10. Why is `err` typed `unknown` in the `.catch` of `audio.play()`, and what does `instanceof` do there?
