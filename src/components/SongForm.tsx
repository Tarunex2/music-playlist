import { useState } from "react";
import { GENRES, MOODS } from "../types";
import type { Energy, Genre, Mood, NewSong } from "../types";

interface Props {
  onAdd: (song: NewSong, file: File | null) => void;
}

// Energy and the placeholder length are no longer shown in the form, but songs still store them.
// When an audio file is attached, App.tsx replaces the length with the file's real length.
const DEFAULT_ENERGY: Energy = 3;
const DEFAULT_DURATION = 210; // 3:30, in seconds

export default function SongForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState<Genre>("Pop");
  const [mood, setMood] = useState<Mood>("Chill");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0); // changing the key clears the file input
  const [error, setError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    if (!picked) return;
    // Fill the title from the file name so you type less.
    setTitle((prev) => prev || picked.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return setError("Enter a title and an artist.");
    onAdd(
      {
        title: title.trim(),
        artist: artist.trim(),
        genre,
        duration: DEFAULT_DURATION,
        mood,
        energy: DEFAULT_ENERGY,
      },
      file
    );
    setTitle("");
    setArtist("");
    setFile(null);
    setFileKey((k) => k + 1);
    setError("");
    setOpen(false);
  };

  if (!open) {
    return (
      <section className="card">
        <button type="button" className="ghost" style={{ width: "100%" }} onClick={() => setOpen(true)}>
          + Add a song manually
        </button>
      </section>
    );
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>Add a song</h2>
      <label className="file">
        Audio file (optional, mp3 / wav / m4a)
        <input key={fileKey} type="file" accept="audio/*" onChange={handleFile} />
      </label>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
      <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)} aria-label="Genre">
        {GENRES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <select value={mood} onChange={(e) => setMood(e.target.value as Mood)} aria-label="Mood">
        {MOODS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      {error && <p className="error">{error}</p>}
      <button type="submit">Add to playlist</button>
      <button type="button" className="ghost" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}