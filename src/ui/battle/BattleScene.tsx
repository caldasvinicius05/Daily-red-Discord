"use client";

import { useLayoutEffect, useRef } from "react";
import type { BattleSide, Boosts } from "@/domain";
import { useSpeciesTypes } from "../AppContext";
import { Snowfall } from "../components/Background";
import { PokemonEmblem } from "../components/PokemonEmblem";
import { cx, HpBar, StatusBadge } from "../components/ui";
import { STAT_LABELS } from "../lib/types";
import styles from "./battle.module.css";
import type { DisplayState, MonDisplay } from "./displayState";
import type { ActiveEffect } from "./usePlayback";

const WEATHER_CLASS: Record<string, string> = {
  RainDance: "weatherRain",
  Sandstorm: "weatherSand",
  SunnyDay: "weatherSun",
  Hail: "weatherHail",
};

const EFFECT_CLASS: Record<string, string> = {
  enter: "fxEnter",
  attack: "fxAttack",
  hit: "fxHit",
  faint: "fxFaint",
  heal: "fxHeal",
  status: "fxStatus",
  boost: "fxBoost",
  drop: "fxDrop",
};

function BoostChips({ boosts }: { boosts: Boosts }) {
  const entries = Object.entries(boosts).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return (
    <div className={styles.boosts}>
      {entries.map(([stat, value]) => (
        <span key={stat} className={cx(styles.boost, value! > 0 ? styles.boostUp : styles.boostDown)}>
          {STAT_LABELS[stat] ?? stat} {value! > 0 ? `+${value}` : value}
        </span>
      ))}
    </div>
  );
}

/** Six pips: one per Pokémon. Red's unrevealed ones stay hollow. */
function PartyPips({ mons, total = 6 }: { mons: MonDisplay[]; total?: number }) {
  return (
    <div className={styles.pips} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const mon = mons[i];
        return <span key={i} className={cx(styles.pip, mon && (mon.fainted ? styles.pipDown : styles.pipUp))} />;
      })}
    </div>
  );
}

function InfoBox({ side, mon, party }: { side: BattleSide; mon: MonDisplay | undefined; party: MonDisplay[] }) {
  return (
    <div className={cx(styles.info, side === "red" ? styles.infoRed : styles.infoPlayer, !mon && styles.infoHidden)}>
      {mon && (
        <>
          <div className={styles.infoTop}>
            <strong className={styles.infoName}>{mon.species}</strong>
            <StatusBadge status={mon.status} />
            <span className={cx(styles.level, "pixel")}>Nv100</span>
          </div>
          <HpBar hp={mon.hp} maxHp={mon.maxHp} showNumbers={side === "player"} />
          <div className={styles.infoBottom}>
            <PartyPips mons={party} />
            {side === "red" && <span className={cx(styles.hpPercent, "pixel")}>{mon.hp}%</span>}
          </div>
          <BoostChips boosts={mon.boosts} />
        </>
      )}
    </div>
  );
}

const ALL_EFFECT_CLASSES = Object.values(EFFECT_CLASS).map((name) => styles[name]!);

/**
 * One side's Pokémon on the field. Mounted once per species (the parent keys it by
 * species); effects are applied to an inner layer by toggling a class directly, so the
 * emblem is never rebuilt and its idle animations keep running smoothly.
 */
function Combatant({ side, mon, effect }: { side: BattleSide; mon: MonDisplay | undefined; effect: ActiveEffect | null }) {
  const typesOf = useSpeciesTypes();
  const layerRef = useRef<HTMLDivElement>(null);
  const fx = effect && effect.side === side ? EFFECT_CLASS[effect.effect] : null;
  const fxKey = effect && effect.side === side ? effect.key : null;

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer || !fx) return;
    layer.classList.remove(...ALL_EFFECT_CLASSES);
    // Force a reflow so the animation restarts even when the same effect repeats.
    void layer.offsetWidth;
    layer.classList.add(styles[fx]!);
  }, [fx, fxKey]);

  if (!mon) return null;
  return (
    <div
      className={cx(
        styles.combatant,
        side === "red" ? styles.combatantRed : styles.combatantPlayer,
        mon.fainted && fx !== "fxFaint" && styles.gone,
      )}
    >
      <div ref={layerRef} className={styles.fxLayer}>
        <PokemonEmblem species={mon.species} types={typesOf(mon.species)} size="100%" />
        <span className={styles.arrows} />
      </div>
    </div>
  );
}

export function BattleScene({
  display,
  effect,
  playerOrder,
  redOrder,
}: {
  display: DisplayState;
  effect: ActiveEffect | null;
  /** Species in team order, to draw the party pips. */
  playerOrder: string[];
  redOrder: string[];
}) {
  const playerMon = display.player.active ? display.player.mons[display.player.active] : undefined;
  const redMon = display.red.active ? display.red.mons[display.red.active] : undefined;
  const weather = display.weather ? WEATHER_CLASS[display.weather] : null;

  return (
    <div className={cx(styles.scene, weather && styles[weather])}>
      <div className={styles.sky} />
      <svg className={styles.peaks} viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 210 90 150 170 185 260 95 330 150 420 60 500 140 590 90 680 160 800 120V300H0Z" fill="#2b4178" />
        <path d="m420 60 34 46-16-5-14 13-12-12-16 7zM260 95l24 33-12-4-10 9-9-8-12 4z" fill="#eef4ff" opacity=".9" />
        <path d="M0 250 120 205 240 240 380 185 520 235 660 195 800 230V300H0Z" fill="#1a2a52" />
      </svg>
      <Snowfall density={55} className={styles.sceneSnow} />
      <div className={styles.weatherLayer} />

      <div className={cx(styles.platform, styles.platformRed)} />
      <div className={cx(styles.platform, styles.platformPlayer)} />

      <Combatant key={`red-${redMon?.species}`} side="red" mon={redMon} effect={effect} />
      <Combatant key={`player-${playerMon?.species}`} side="player" mon={playerMon} effect={effect} />

      <InfoBox side="red" mon={redMon} party={redOrder.map((s) => display.red.mons[s]!).filter(Boolean)} />
      <InfoBox side="player" mon={playerMon} party={playerOrder.map((s) => display.player.mons[s]!).filter(Boolean)} />
    </div>
  );
}
