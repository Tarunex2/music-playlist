import { useEffect, useRef, useState } from "react";
import type { Song } from "../types";
import { formatDuration } from "../utils/helpers";
import Cover from "./Cover";

// ---------- Icons (small SVG pictures, used by Player and SongList) ----------
interface IconProps {
  size?: number;
}

const fillProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true as const,
});

const strokeProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
});

export const PlayIcon = ({ size = 18 }: IconProps) => (
  <svg {...fillProps(size)}><path d="M8 5v14l11-7z" /></svg>
);
export const PauseIcon = ({ size = 18 }: IconProps) => (
  <svg {...fillProps(size)}><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
);
export const NextIcon = ({ size = 18 }: IconProps) => (
  <svg {...fillProps(size)}><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z" /></svg>
);
export const PrevIcon = ({ size = 18 }: IconProps) => (
  <svg {...fillProps(size)}><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z" /></svg>
);
export const EqIcon = ({ size = 18 }: IconProps) => (
  <svg {...fillProps(size)}>
    <rect x="4" y="10" width="4" height="10" rx="1.5" />
    <rect x="10" y="4" width="4" height="16" rx="1.5" />
    <rect x="16" y="8" width="4" height="12" rx="1.5" />
  </svg>
);
export const ShuffleIcon = ({ size = 18 }: IconProps) => (
  <svg {...strokeProps(size)}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);
export const HeartIcon = ({ size = 18, filled = false }: IconProps & { filled?: boolean }) => (
  <svg {...strokeProps(size)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 5 22.8 8.6 21.5 11.8 19.5 16.4 12 21 12 21z" />
  </svg>
);
export const CloseIcon = ({ size = 18 }: IconProps) => (
  <svg {...strokeProps(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const VolumeIcon = ({ size = 18 }: IconProps) => (
  <svg {...strokeProps(size)}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a10 10 0 0 1 0 14" />
  </svg>
);
export const AttachIcon = ({ size = 18 }: IconProps) => (
  <svg {...strokeProps(size)}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);
// ---------- Player ----------
interface Props {
  song: Song | null;
  isPlaying: boolean;
  elapsed: number;
  shuffle: boolean;
  hasAudio: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
  onSeek: (seconds: number) => void;
}

export default function Player({
  song,
  isPlaying,
  elapsed,
  shuffle,
  hasAudio,
  audioRef,
  onToggle,
  onNext,
  onPrev,
  onShuffle,
  onSeek,
}: Props) {
  // While you drag, the bar follows your finger; the song jumps when you let go.
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, audioRef]);

  const commitSeek = () => {
    if (dragTime === null) return;
    onSeek(dragTime);
    setDragTime(null);
  };

  return (
    <section className="player-bar">
      <div
        className="np"
        style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 }}
      >
        {song ? (
          <>
            <Cover song={song} size={48} />
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <strong>{song.title}</strong>
              <span className="muted">
                {song.artist}
                {!hasAudio && " · silent preview"}
              </span>
            </div>
          </>
        ) : (
          <span className="muted">Nothing playing</span>
        )}
      </div>

      <div className="controls">
        <button
          className={`icon-btn ${shuffle ? "" : "ghost"}`}
          onClick={onShuffle}
          aria-pressed={shuffle}
          aria-label="Shuffle"
          title={shuffle ? "Shuffle: on" : "Shuffle: off"}
        >
          <ShuffleIcon />
        </button>
        <button className="icon-btn ghost" onClick={onPrev} disabled={!song} aria-label="Previous" title="Previous">
          <PrevIcon />
        </button>
        <button
          className="icon-btn main"
          onClick={onToggle}
          disabled={!song}
          aria-label={isPlaying ? "Pause" : "Play"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
        </button>
        <button className="icon-btn ghost" onClick={onNext} disabled={!song} aria-label="Next" title="Next">
          <NextIcon />
        </button>
      </div>

      <div className="seekrow">
        <span className="muted">{formatDuration(dragTime ?? elapsed)}</span>
        <input
          type="range"
          className="seek"
          min={0}
          max={song?.duration ?? 1}
          step={1}
          disabled={!song}
          value={dragTime ?? Math.min(elapsed, song?.duration ?? 0)}
          onChange={(e) => setDragTime(Number(e.target.value))}
          onPointerUp={commitSeek}
          onKeyUp={commitSeek}
          onBlur={commitSeek}
          aria-label="Seek"
        />
        <span className="muted">{formatDuration(song?.duration ?? 0)}</span>
      </div>

      <label className="vol" title="Volume">
        <VolumeIcon />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volume"
        />
      </label>

      <Visualizer audioRef={audioRef} playing={isPlaying && hasAudio} />
    </section>
  );
}

// Draws moving bars from the audio's frequencies (Web Audio API).
function Visualizer({ audioRef, playing }: { audioRef: React.RefObject<HTMLAudioElement>; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!audio || !canvas || !g) return;

    if (!playing) {
      g.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // An audio element can only be connected once, so the graph is kept in refs.
    if (!analyserRef.current) {
      const context = new AudioContext();
      const source = context.createMediaElementSource(audio);
      const newAnalyser = context.createAnalyser();
      newAnalyser.fftSize = 64;
      source.connect(newAnalyser);
      newAnalyser.connect(context.destination);
      contextRef.current = context;
      analyserRef.current = newAnalyser;
    }
    void contextRef.current?.resume();

    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const draw = () => {
      analyser.getByteFrequencyData(data);
      g.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / data.length;
      data.forEach((value, i) => {
        const height = (value / 255) * canvas.height;
        g.fillStyle = "#1ed760";
        g.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
      });
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(frame);
  }, [playing]);

  return <canvas ref={canvasRef} className="viz" width={128} height={32} />;
}