import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import OnlineSearch from "./components/OnlineSearch";
import Player from "./components/Player";
import SongForm from "./components/SongForm";
import SongList, { StatsPanel } from "./components/SongList";
import Toolbar, { MixBuilder } from "./components/Toolbar";
import { SAMPLE_SONGS } from "./data/sampleSongs";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { MOODS } from "./types";
import type { Energy, GenreFilter, Mood, NewSong, PlayerAction, PlayerState, Song, SortKey } from "./types";
import { deleteAudio, loadAllAudio, saveAudio } from "./utils/audioStore";
import { buildMix, formatDuration, getAudioDuration, pickNext, sortBy } from "./utils/helpers";

const initialPlayer: PlayerState = { currentId: null, isPlaying: false, elapsed: 0, shuffle: false };

// The player's state is remembered, so a refresh brings back the same song (paused) at the same spot.
const PLAYER_KEY = "playlist-player";

function loadPlayer(): PlayerState {
  try {
    const raw = localStorage.getItem(PLAYER_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<PlayerState>;
      return {
        currentId: saved.currentId ?? null,
        isPlaying: false, // browsers don't allow audio to start by itself after a refresh
        elapsed: saved.elapsed ?? 0,
        shuffle: saved.shuffle ?? false,
      };
    }
  } catch {
    // unreadable data, start fresh
  }
  return initialPlayer;
}

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "play":
      return { ...state, currentId: action.id, isPlaying: true, elapsed: 0 };
    case "toggle":
      return state.currentId ? { ...state, isPlaying: !state.isPlaying } : state;
    case "tick":
      return { ...state, elapsed: state.elapsed + 1 };
    case "seek":
      return state.elapsed === action.time ? state : { ...state, elapsed: action.time };
    case "stop":
      return { ...state, currentId: null, isPlaying: false, elapsed: 0 };
    case "toggleShuffle":
      return { ...state, shuffle: !state.shuffle };
  }
}

// Songs saved before this update lack the new fields, so fill them in.
function withDefaults(s: Song): Song {
  return {
    ...s,
    mood: s.mood ?? "Chill",
    energy: s.energy ?? 3,
    plays: s.plays ?? 0,
    listenSeconds: s.listenSeconds ?? 0,
  };
}

export default function App() {
  const [songs, setSongs] = useLocalStorage<Song[]>("playlist-songs", SAMPLE_SONGS);
  const [player, dispatch] = useReducer(playerReducer, undefined, loadPlayer);
  // song id -> temporary URL of the audio file (the files themselves live in IndexedDB)
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  // After a refresh, the saved position is applied once the audio file has loaded.
  const resumeAt = useRef<number | null>(player.elapsed > 0 ? player.elapsed : null);

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<GenreFilter>("All");
  const [sort, setSort] = useState<SortKey>("added");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [mixIds, setMixIds] = useState<string[] | null>(null);
  const [mixNote, setMixNote] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const current = songs.find((s) => s.id === player.currentId) ?? null;
  const currentUrl = player.currentId ? audioUrls[player.currentId] : undefined;
  const pendingSong = songs.find((s) => s.id === pendingDeleteId) ?? null;

  const visible = useMemo(() => {
    if (mixIds) {
      return mixIds
        .map((id) => songs.find((s) => s.id === id))
        .filter((s): s is Song => s !== undefined);
    }
    const q = query.trim().toLowerCase();
    const filtered = songs.filter(
      (s) =>
        (genre === "All" || s.genre === genre) &&
        (!favoritesOnly || s.favorite) &&
        (s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
    );
    switch (sort) {
      case "title":
        return sortBy(filtered, (s) => s.title.toLowerCase());
      case "artist":
        return sortBy(filtered, (s) => s.artist.toLowerCase());
      case "duration":
        return sortBy(filtered, (s) => s.duration);
      case "added":
        return sortBy(filtered, (s) => s.addedAt, -1);
    }
  }, [songs, query, genre, sort, favoritesOnly, mixIds]);

  const playSong = (id: string) => {
    const audio = audioRef.current;
    const sameSong = id === player.currentId;
    resumeAt.current = null; // a new play overrides any saved position
    if (sameSong && audio) audio.currentTime = 0; // restart the same song
    dispatch({ type: "play", id });
    if (sameSong && audio && audioUrls[id]) audio.play().catch(() => {});
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, plays: s.plays + 1 } : s)));
  };

  const go = (direction: 1 | -1) => {
    const id = pickNext(visible.map((s) => s.id), player.currentId, player.shuffle, direction);
    if (id) playSong(id);
  };

  // Jump to a time inside the current song.
  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    resumeAt.current = null;
    if (audio && currentUrl) audio.currentTime = seconds; // real audio
    dispatch({ type: "seek", time: seconds }); // also updates the bar and the silent preview
  };

  // Update songs saved by the older version of the app.
  useEffect(() => {
    setSongs((prev) => prev.map(withDefaults));
  }, []);

  // Remember the current song, position and shuffle setting.
  useEffect(() => {
    try {
      localStorage.setItem(
        PLAYER_KEY,
        JSON.stringify({ currentId: player.currentId, elapsed: player.elapsed, shuffle: player.shuffle })
      );
    } catch {
      // storage full or blocked, nothing to do
    }
  }, [player.currentId, player.elapsed, player.shuffle]);

  // Load saved audio files from IndexedDB once, when the app starts.
  useEffect(() => {
    loadAllAudio()
      .then((blobs) => {
        const urls: Record<string, string> = {};
        for (const [id, blob] of Object.entries(blobs)) urls[id] = URL.createObjectURL(blob);
        setAudioUrls((prev) => ({ ...urls, ...prev }));
      })
      .catch(() => {});
  }, []);

  // Real audio: start or pause the <audio> element to match the player state.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentUrl) {
      audio.pause();
      return;
    }
    if (player.isPlaying) {
      audio.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        dispatch({ type: "toggle" }); // the browser refused to play, so show "paused"
      });
    } else {
      audio.pause();
    }
  }, [player.isPlaying, currentUrl, player.currentId]);

  // Songs with no audio file use a silent timer preview instead.
  useEffect(() => {
    if (!player.isPlaying || currentUrl) return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(timer);
  }, [player.isPlaying, currentUrl]);

  useEffect(() => {
    if (current && !currentUrl && player.elapsed >= current.duration) go(1);
  }, [player.elapsed]);

  // Count listening time: +1 second for the current song while it plays.
  useEffect(() => {
    if (!player.isPlaying || !player.currentId) return;
    const id = player.currentId;
    const timer = window.setInterval(() => {
      setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, listenSeconds: s.listenSeconds + 1 } : s)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [player.isPlaying, player.currentId]);

  // Show the song's cover, title and artist in the OS media controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!current) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: current.coverUrl
        ? [{ src: current.coverUrl, sizes: "256x256", type: "image/jpeg" }]
        : [],
    });
  }, [current?.id, current?.coverUrl]);

  // Keyboard shortcuts: Space = play/pause, Left/Right arrows = previous/next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) return; // don't hijack typing or sliders
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (el.tagName === "BUTTON") el.blur(); // stops Space from also clicking the focused button
        if (player.currentId) dispatch({ type: "toggle" });
        else if (visible[0]) playSong(visible[0].id); // nothing playing yet: start the first song
      } else if (e.key === "ArrowRight") {
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const attachAudio = async (id: string, file: File) => {
    await saveAudio(id, file);
    const url = URL.createObjectURL(file);
    const seconds = await getAudioDuration(url);
    if (audioUrls[id]) URL.revokeObjectURL(audioUrls[id]);
    setAudioUrls((prev) => ({ ...prev, [id]: url }));
    if (seconds > 0) setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, duration: seconds } : s)));
  };

  const addSong = (data: NewSong, file: File | null) => {
    const id = crypto.randomUUID();
    setSongs((prev) => [
      { ...data, id, favorite: false, addedAt: Date.now(), plays: 0, listenSeconds: 0 },
      ...prev,
    ]);
    if (file) void attachAudio(id, file);
  };

  const toggleFavorite = (id: string) =>
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)));

  const makeMix = (mood: Mood | "Any", minutes: number) => {
    const mix = buildMix(songs, mood, minutes);
    if (mix.length === 0) {
      setMixNote(`No ${mood} songs yet. Click a song's mood tag to change it.`);
      return;
    }
    const total = mix.reduce((sum, s) => sum + s.duration, 0);
    setMixIds(mix.map((s) => s.id));
    setMixNote(`${mood} mix: ${mix.length} songs · ${formatDuration(total)}`);
    playSong(mix[0].id);
  };

  const clearMix = () => {
    setMixIds(null);
    setMixNote("");
  };

  const cycleMood = (id: string) =>
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, mood: MOODS[(MOODS.indexOf(s.mood) + 1) % MOODS.length] } : s))
    );

  const cycleEnergy = (id: string) =>
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, energy: ((s.energy % 5) + 1) as Energy } : s)));

  const deleteSong = (id: string) => {
    if (id === player.currentId) dispatch({ type: "stop" });
    if (audioUrls[id]) URL.revokeObjectURL(audioUrls[id]);
    setAudioUrls((prev) => {
      const { [id]: _removed, ...rest } = prev; // copy without this id
      return rest;
    });
    void deleteAudio(id);
    setSongs((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <main className="app">
      <header className="brand">
        <div className="brand-main">
          <svg className="logo" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="#1ed760" />
            <rect x="10" y="22" width="5" height="14" rx="2.5" fill="#000" />
            <rect x="18" y="12" width="5" height="24" rx="2.5" fill="#000" />
            <rect x="26" y="18" width="5" height="18" rx="2.5" fill="#000" />
            <rect x="34" y="26" width="5" height="10" rx="2.5" fill="#000" />
          </svg>
          <div>
            <h1 className="wordmark" aria-label="DxVibe">
              {"DxVibe".split("").map((ch, i) => (
                <span key={i} aria-hidden="true" style={{ "--i": i } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </h1>
            <p className="tagline">Your music, your vibe.</p>
          </div>
        </div>
      </header>

      <audio
        ref={audioRef}
        src={currentUrl}
        onLoadedMetadata={(e: React.SyntheticEvent<HTMLAudioElement>) => {
          // After a refresh, jump back to where the song was.
          if (resumeAt.current !== null) {
            e.currentTarget.currentTime = resumeAt.current;
            resumeAt.current = null;
          }
        }}
        onTimeUpdate={(e: React.SyntheticEvent<HTMLAudioElement>) =>
          dispatch({ type: "seek", time: Math.floor(e.currentTarget.currentTime) })
        }
        onEnded={() => go(1)}
      />

      <div className="layout">
        <div className="side">
          <OnlineSearch onAdd={addSong} songs={songs} />
          <SongForm onAdd={addSong} />
          <StatsPanel songs={songs} />
        </div>
        <div className="main">
          <MixBuilder onBuild={makeMix} onClear={clearMix} active={mixIds !== null} note={mixNote} />
          <Toolbar
            query={query}
            genre={genre}
            sort={sort}
            favoritesOnly={favoritesOnly}
            onQuery={setQuery}
            onGenre={setGenre}
            onSort={setSort}
            onFavoritesOnly={setFavoritesOnly}
          />
          <SongList
            songs={visible}
            currentId={player.currentId}
            isPlaying={player.isPlaying}
            audioUrls={audioUrls}
            onPlay={playSong}
            onFavorite={toggleFavorite}
            onDelete={(id) => setPendingDeleteId(id)}
            onAttach={attachAudio}
            onMood={cycleMood}
            onEnergy={cycleEnergy}
          />
        </div>
      </div>

      <Player
        song={current}
        isPlaying={player.isPlaying}
        elapsed={player.elapsed}
        shuffle={player.shuffle}
        hasAudio={Boolean(currentUrl)}
        audioRef={audioRef}
        onToggle={() => dispatch({ type: "toggle" })}
        onNext={() => go(1)}
        onPrev={() => go(-1)}
        onShuffle={() => dispatch({ type: "toggleShuffle" })}
        onSeek={seekTo}
      />

      <ConfirmDialog
        open={pendingSong !== null}
        title="Remove this song?"
        message={
          pendingSong ? `"${pendingSong.title}" by ${pendingSong.artist} will be removed from your playlist.` : ""
        }
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingSong) deleteSong(pendingSong.id);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </main>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus "Cancel" when the popup opens, so Enter never deletes by accident.
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onCancel}
      onKeyDown={(e) => {
        e.stopPropagation(); // keeps Space and arrow keys from controlling the player behind the popup
        if (e.key === "Escape") onCancel();
      }}
    >
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message" className="muted">
          {message}
        </p>
        <div className="modal-actions">
          <button ref={cancelRef} type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}