import { GENRES, MOODS } from "../types";
import type { Genre, ListeningStats, Mood, Song } from "../types";
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// "3:24" -> 204, or null if the text is not valid. The return type forces callers to check.
export function parseDuration(text: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

// Generic sort: works for any item type T. The caller says which value to compare.
export function sortBy<T>(items: T[], getKey: (item: T) => string | number, direction: 1 | -1 = 1): T[] {
  return [...items].sort((a, b) => {
    const x = getKey(a);
    const y = getKey(b);
    if (x === y) return 0;
    return (x > y ? 1 : -1) * direction;
  });
}

// Picks the next or previous song id from the visible queue.
export function pickNext(queue: string[], currentId: string | null, shuffle: boolean, direction: 1 | -1): string | null {
  if (queue.length === 0) return null;
  if (shuffle && queue.length > 1) {
    const others = queue.filter((id) => id !== currentId);
    return others[Math.floor(Math.random() * others.length)];
  }
  const index = currentId ? queue.indexOf(currentId) : -1;
  if (index === -1) return queue[0];
  return queue[(index + direction + queue.length) % queue.length];
}

// Reads the length of an audio file (in seconds). Resolves to 0 if it cannot be read.
export function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
    audio.onerror = () => resolve(0);
    audio.src = url;
  });
}


export function buildMix(songs: Song[], mood: Mood | "Any", minutes: number): Song[] {
  const pool = songs.filter((s) => mood === "Any" || s.mood === mood);
  const target = minutes * 60;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const picked: Song[] = [];
  let total = 0;
  for (const s of shuffled) {
    if (total >= target) break;
    picked.push(s);
    total += s.duration;
  }

  const byEnergy = sortBy(picked, (s) => s.energy);
  const rising: Song[] = [];
  const falling: Song[] = [];
  byEnergy.forEach((s, i) => (i % 2 === 0 ? rising : falling).push(s));
  return [...rising, ...falling.reverse()];
}

export function computeStats(songs: Song[]): ListeningStats {
  const byGenre = GENRES.reduce((acc, g) => {
    acc[g] = 0;
    return acc;
  }, {} as Record<Genre, number>);
  const byMood = MOODS.reduce((acc, m) => {
    acc[m] = 0;
    return acc;
  }, {} as Record<Mood, number>);

  let totalSeconds = 0;
  let totalPlays = 0;
  for (const s of songs) {
    byGenre[s.genre] += s.listenSeconds;
    byMood[s.mood] += s.listenSeconds;
    totalSeconds += s.listenSeconds;
    totalPlays += s.plays;
  }
  const topSongs = sortBy(songs.filter((s) => s.plays > 0), (s) => s.plays, -1).slice(0, 3);
  return { totalSeconds, totalPlays, topSongs, byGenre, byMood };
}