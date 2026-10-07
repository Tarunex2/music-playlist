import { useState } from "react";
import { GENRES, MOODS } from "../types";
import type { GenreFilter, Mood, SortKey } from "../types";

interface Props {
  query: string;
  genre: GenreFilter;
  sort: SortKey;
  favoritesOnly: boolean;
  onQuery: (q: string) => void;
  onGenre: (g: GenreFilter) => void;
  onSort: (s: SortKey) => void;
  onFavoritesOnly: (v: boolean) => void;
}

export default function Toolbar(p: Props) {
  return (
    <div className="toolbar">
      <input placeholder="Search title or artist" value={p.query} onChange={(e) => p.onQuery(e.target.value)} />
      <select value={p.genre} onChange={(e) => p.onGenre(e.target.value as GenreFilter)}>
        <option value="All">All genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <select value={p.sort} onChange={(e) => p.onSort(e.target.value as SortKey)}>
        <option value="added">Recently added</option>
        <option value="title">Title</option>
        <option value="artist">Artist</option>
        <option value="duration">Duration</option>
      </select>
      <label className="check">
        <input type="checkbox" checked={p.favoritesOnly} onChange={(e) => p.onFavoritesOnly(e.target.checked)} />
        Favourites only
      </label>
    </div>
  );
}

interface MixProps {
  active: boolean;
  note: string;
  onBuild: (mood: Mood | "Any", minutes: number) => void;
  onClear: () => void;
}

export function MixBuilder({ active, note, onBuild, onClear }: MixProps) {
  const [mood, setMood] = useState<Mood | "Any">("Workout");
  const [minutes, setMinutes] = useState(20);

  return (
    <section className="card">
      <h2>Mood mix</h2>
      <div className="mixrow">
        <select value={mood} onChange={(e) => setMood(e.target.value as Mood | "Any")} aria-label="Mood">
          <option value="Any">Any mood</option>
          {MOODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label="Minutes" />
        <span className="muted">minutes</span>
        <button onClick={() => onBuild(mood, minutes)}>Make my mix</button>
        {active && <button className="ghost" onClick={onClear}>Back to all songs</button>}
      </div>
      {note && <p className="muted">{note}</p>}
    </section>
  );
}