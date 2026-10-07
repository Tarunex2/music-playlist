import { useEffect, useRef, useState } from "react";
import { GENRES, MOODS } from "../types";
import type { Genre, Mood, NewSong, Song } from "../types";

interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  primaryGenreName: string;
  artworkUrl100: string;
  previewUrl?: string;
  trackTimeMillis?: number;
}

interface Props {
  onAdd: (song: NewSong, file: File | null) => void;
  songs: Pick<Song, "title" | "artist">[]; // your playlist, used to spot duplicates
}

// Maps iTunes genre names onto your own genre list.
function toGenre(name: string): Genre {
  const n = name.toLowerCase();
  const exact = GENRES.find((g) => n.includes(g.toLowerCase()));
  if (exact) return exact;
  if (n.includes("hip") || n.includes("rap")) return "Hip-Hop";
  if (n.includes("bollywood") || n.includes("indian")) return "Bollywood";
  if (n.includes("lo-fi") || n.includes("lofi")) return "Lo-fi";
  return "Pop";
}

const keyOf = (title: string, artist: string) => `${title}|${artist}`.toLowerCase();

export default function OnlineSearch({ onAdd, songs }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<Mood>("Chill");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const owned = new Set(songs.map((s) => keyOf(s.title, s.artist)));

  // Search as you type: wait 300ms after the last key, and cancel any older request.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=8&country=IN`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Search failed");
        const data: { results: Track[] } = await res.json();
        setResults(data.results);
        setError(data.results.length === 0 ? "No songs found." : "");
        setOpen(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Could not reach the music search. Check your internet.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close the dropdown when you click anywhere outside it.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const add = async (t: Track) => {
    if (addingId !== null || owned.has(keyOf(t.trackName, t.artistName))) return;
    setAddingId(t.trackId);
    let file: File | null = null;
    if (t.previewUrl) {
      try {
        const blob = await (await fetch(t.previewUrl)).blob();
        file = new File([blob], `${t.trackName}.m4a`, { type: blob.type || "audio/mp4" });
      } catch {
        file = null; // no audio, the song still gets added as a silent preview
      }
    }
    onAdd(
      {
        title: t.trackName,
        artist: t.artistName,
        genre: toGenre(t.primaryGenreName),
        duration: Math.round((t.trackTimeMillis ?? 210000) / 1000),
        mood,
        energy: 3,
        coverUrl: t.artworkUrl100.replace("100x100", "300x300"),
      },
      file
    );
    setAddingId(null);
  };

  const showDropdown = open && query.trim().length >= 2 && (results.length > 0 || error !== "");

  return (
    <section className="card">
      <h2>Search online</h2>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <input
          style={{ width: "100%" }}
          placeholder={loading ? "Searching..." : "Type a song or artist"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          aria-label="Search songs online"
          autoComplete="off"
        />

        <label
          className="muted"
          style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}
        >
          Add new songs as
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value as Mood)}
            aria-label="Mood for new songs"
            style={{ flex: 1, padding: "4px 8px" }}
          >
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        {showDropdown && (
          <ul
            style={{
              position: "absolute",
              top: 44,
              left: 0,
              right: 0,
              zIndex: 20,
              listStyle: "none",
              margin: 0,
              padding: 6,
              display: "grid",
              gap: 4,
              maxHeight: 340,
              overflowY: "auto",
              background: "#181818",
              border: "1px solid #333",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            {error && (
              <li className="muted" style={{ padding: 8 }}>
                {error}
              </li>
            )}
            {results.map((t) => {
              const added = owned.has(keyOf(t.trackName, t.artistName));
              return (
                <li
                  key={t.trackId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: 10,
                    padding: 6,
                    borderRadius: 8,
                  }}
                >
                  <img
                    src={t.artworkUrl100}
                    alt=""
                    width={44}
                    height={44}
                    style={{ borderRadius: 6, objectFit: "cover" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {t.trackName}
                    </strong>
                    <span
                      className="muted"
                      style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {t.artistName}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={added ? "ghost" : ""}
                    disabled={added || addingId !== null}
                    onClick={() => void add(t)}
                    style={{ width: "auto", padding: "8px 14px" }}
                  >
                    {added ? "Added" : addingId === t.trackId ? "..." : "Add"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}