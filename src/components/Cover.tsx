import { useEffect, useState } from "react";
import type { Song } from "../types";

// Turns a mood name into a number from 0-359, so each mood gets its own color.
function moodHue(mood: string) {
  let hue = 0;
  for (const ch of mood) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return hue;
}

interface CoverProps {
  song: Pick<Song, "title" | "coverUrl" | "mood">;
  size?: number; // leave out to use the size from App.css
}

export default function Cover({ song, size }: CoverProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [song.coverUrl]);

  const sizeStyle = size ? { width: size, height: size, flexShrink: 0 } : {};

  if (song.coverUrl && !failed) {
    return (
      <img
        className="cover"
        src={song.coverUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ ...sizeStyle, objectFit: "cover" }}
      />
    );
  }

  const hue = moodHue(song.mood);
  return (
    <div
      className="cover"
      style={{
        ...sizeStyle,
        background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 50) % 360} 70% 25%))`,
      }}
    >
      {song.title.charAt(0).toUpperCase()}
    </div>
  );
}