import { GENRES, MOODS } from "../types";
import type { Song } from "../types";
import { computeStats, formatDuration } from "../utils/helpers";
import Cover from "./Cover";
import { AttachIcon, CloseIcon, EqIcon, HeartIcon, PlayIcon } from "./Player";

interface Props {
  songs: Song[];
  currentId: string | null;
  isPlaying: boolean;
  audioUrls: Record<string, string>;
  onPlay: (id: string) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onAttach: (id: string, file: File) => void;
  onMood: (id: string) => void;
  onEnergy?: (id: string) => void; // no longer shown in the list, kept so App.tsx doesn't need changes
}

export default function SongList({
  songs,
  currentId,
  isPlaying,
  audioUrls,
  onPlay,
  onFavorite,
  onDelete,
  onAttach,
  onMood,
}: Props) {
  if (songs.length === 0) {
    return <p className="muted card">No songs match. Change the filters or add a song.</p>;
  }

  return (
    <ul className="list card">
      {songs.map((s) => {
        const active = s.id === currentId;
        const hasAudio = Boolean(audioUrls[s.id]);
        const attachLabel = hasAudio ? "Replace audio" : "Attach audio";
        return (
          <li key={s.id} className={active ? "active" : ""}>
            <button className="play" onClick={() => onPlay(s.id)} aria-label={`Play ${s.title}`}>
              {active && isPlaying ? <EqIcon /> : <PlayIcon />}
            </button>
            <Cover song={s} />
            <div className="info">
              <strong>{s.title}</strong>
              <span className="muted">
                {s.artist} · {s.genre}
              </span>
            </div>
            <div className="tags">
              <button className="tag" onClick={() => onMood(s.id)} title="Click to change mood">
                {s.mood}
              </button>
            </div>
            <span className="muted dur">{formatDuration(s.duration)}</span>
            <label className={`attach ${hasAudio ? "has" : ""}`} title={attachLabel}>
              <AttachIcon />
              <input
                type="file"
                accept="audio/*"
                hidden
                aria-label={`${attachLabel} for ${s.title}`}
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  if (picked) onAttach(s.id, picked);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="ghost sq"
              onClick={() => onFavorite(s.id)}
              aria-pressed={s.favorite}
              aria-label={s.favorite ? `Remove ${s.title} from favourites` : `Add ${s.title} to favourites`}
            >
              <HeartIcon filled={s.favorite} />
            </button>
            <button className="ghost sq" onClick={() => onDelete(s.id)} aria-label={`Delete ${s.title}`}>
              <CloseIcon />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="bar">
      <span>{label}</span>
      <div className="track">
        <div className="fill" style={{ width: max ? `${(value / max) * 100}%` : "0%" }} />
      </div>
      <span>{formatDuration(value)}</span>
    </div>
  );
}

export function StatsPanel({ songs }: { songs: Song[] }) {
  const stats = computeStats(songs);
  const maxGenre = Math.max(0, ...Object.values(stats.byGenre));
  const maxMood = Math.max(0, ...Object.values(stats.byMood));

  return (
    <section className="card">
      <h2>Your listening</h2>
      <div className="statrow">
        <div>
          <p className="big">{formatDuration(stats.totalSeconds)}</p>
          <p className="muted">listened</p>
        </div>
        <div>
          <p className="big">{stats.totalPlays}</p>
          <p className="muted">plays</p>
        </div>
      </div>

      <h2>Top songs</h2>
      {stats.topSongs.length === 0 ? (
        <p className="muted">Play some songs and your favourites will show up here.</p>
      ) : (
        <ol>
          {stats.topSongs.map((s) => (
            <li key={s.id}>
              {s.title} <span className="muted">· {s.plays} plays</span>
            </li>
          ))}
        </ol>
      )}

      <h2>Time by genre</h2>
      {GENRES.map((g) => (
        <BarRow key={g} label={g} value={stats.byGenre[g]} max={maxGenre} />
      ))}

      <h2>Time by mood</h2>
      {MOODS.map((m) => (
        <BarRow key={m} label={m} value={stats.byMood[m]} max={maxMood} />
      ))}
    </section>
  );
}