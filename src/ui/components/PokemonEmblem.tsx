"use client";

import { memo, useContext, useEffect, useId, useState } from "react";
import type { BattleSide } from "@/domain";
import { hashSeed } from "@/domain/rules/random";
import { AppContext } from "../AppContext";
import { getPokemonSprite } from "../lib/sprites";
import { typeColor } from "../lib/types";
import styles from "./PokemonEmblem.module.css";
import { TypeIcon } from "./TypeIcon";

interface Props {
  species: string;
  types: readonly string[];
  /** Rendered width/height in px (or any CSS length). */
  size?: number | string;
  /** Static emblem (no spinning ring / pulsing aura), e.g. for cards and lists. */
  still?: boolean;
  fainted?: boolean;
  className?: string;
  /** Side in battle scene: "player" displays back sprite, "red" or undefined displays front sprite. */
  side?: BattleSide | "player" | "red" | "front" | "back";
}

function polygon(sides: number, radius: number, rotation: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i / sides) * Math.PI * 2;
    return `${50 + radius * Math.cos(a)},${50 + radius * Math.sin(a)}`;
  }).join(" ");
}

/**
 * Visual component that renders a Pokémon: displays the official Gen 3 sprite
 * (front or back depending on arena side) with ambient aura and shadow.
 * Falls back to the geometric emblem if a sprite fails to load.
 */
export const PokemonEmblem = memo(function PokemonEmblem({
  species,
  types,
  size = 96,
  still = false,
  fainted = false,
  className,
  side,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const app = useContext(AppContext);
  const dexNum = app?.reference?.species[species]?.num;

  const [useNumFallback, setUseNumFallback] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setUseNumFallback(false);
    setLoadFailed(false);
  }, [species, side]);

  const h = hashSeed(species);
  const primary = types[0] ?? "Normal";
  const secondary = types[1];
  const c1 = typeColor(primary);
  const c2 = typeColor(secondary ?? primary);

  const nodes = 3 + (h % 4);
  const sides = 3 + ((h >>> 3) % 4);
  const rotation = ((h >>> 7) % 360) * (Math.PI / 180);

  const spriteSrc = useNumFallback && dexNum
    ? getPokemonSprite("", { side, num: dexNum })
    : getPokemonSprite(species, { side, num: dexNum });

  return (
    <div
      className={[styles.emblem, still ? styles.still : "", fainted ? styles.fainted : "", className ?? ""].join(" ")}
      style={{ width: size, height: size, ["--c1" as string]: c1, ["--c2" as string]: c2 }}
      role="img"
      aria-label={species}
    >
      <span className={styles.shadow} />
      <span className={styles.aura} />

      {!loadFailed ? (
        <img
          key={spriteSrc}
          src={spriteSrc}
          alt={species}
          className={styles.sprite}
          draggable={false}
          onError={() => {
            if (!useNumFallback && dexNum) {
              setUseNumFallback(true);
            } else {
              setLoadFailed(true);
            }
          }}
        />
      ) : (
        <>
          <svg viewBox="0 0 100 100" className={`${styles.layer} ${styles.ring}`} aria-hidden="true">
            <circle cx="50" cy="50" r="43" fill="none" stroke={c2} strokeOpacity="0.7" strokeWidth="1.4" strokeDasharray="3 5" />
            {Array.from({ length: nodes }, (_, i) => {
              const a = rotation + (i / nodes) * Math.PI * 2;
              return <circle key={i} cx={50 + 43 * Math.cos(a)} cy={50 + 43 * Math.sin(a)} r="2.6" fill="#fff" fillOpacity="0.9" />;
            })}
          </svg>

          <svg viewBox="0 0 100 100" className={styles.layer} aria-hidden="true">
            <defs>
              <radialGradient id={`orb-${uid}`} cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="22%" stopColor={c1} />
                <stop offset="100%" stopColor={c2} stopOpacity="0.95" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="35" fill={`url(#orb-${uid})`} stroke="rgba(255,255,255,.55)" strokeWidth="1.2" />
            <polygon points={polygon(sides, 26, rotation)} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" />
            <ellipse cx="38" cy="30" rx="13" ry="6.5" fill="#fff" opacity="0.22" transform="rotate(-25 38 30)" />
          </svg>

          <TypeIcon type={primary} className={styles.glyph} />
          {secondary && (
            <span className={styles.secondary} style={{ background: c2 }}>
              <TypeIcon type={secondary} />
            </span>
          )}
        </>
      )}
    </div>
  );
});
