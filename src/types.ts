export const GENRES = ["Pop", "Rock", "Hip-Hop", "Bollywood", "Classical", "Lo-fi"] as const;
export type Genre = (typeof GENRES)[number];
export const MOODS = ["Chill", "Focus", "Workout", "Party"] as const;
export type Mood = (typeof MOODS)[number];
export type Energy = 1 | 2 | 3 | 4 | 5;

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: Genre;
  duration: number; // seconds
  favorite: boolean;
  addedAt: number; // timestamp, used for sorting
  mood: Mood;
  energy: Energy;
  plays: number;
  listenSeconds: number;
  coverUrl?: string; // small data URL
}

export type NewSong = Omit<Song, "id" | "favorite" | "addedAt" | "plays" | "listenSeconds">;

export type SortKey = "added" | "title" | "artist" | "duration";
export type GenreFilter = Genre | "All";

export interface PlayerState {
  currentId: string | null;
  isPlaying: boolean;
  elapsed: number; // seconds played of the current song
  shuffle: boolean;
}

export type PlayerAction =
  | { type: "play"; id: string }
  | { type: "toggle" }
  | { type: "tick" }
  | { type: "seek"; time: number }
  | { type: "stop" }
  | { type: "toggleShuffle" };

export interface ListeningStats {
  totalSeconds: number;
  totalPlays: number;
  topSongs: Song[];
  byGenre: Record<Genre, number>;
  byMood: Record<Mood, number>;
}