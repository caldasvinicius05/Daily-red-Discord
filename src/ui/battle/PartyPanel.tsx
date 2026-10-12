"use client";

import { useEffect } from "react";
import type { PlayerMonView } from "@/domain";
import { useSpeciesTypes } from "../AppContext";
import { PokemonEmblem } from "../components/PokemonEmblem";
import { cx, hpTone, StatusBadge } from "../components/ui";
import styles from "./battle.module.css";

interface Props {
  team: PlayerMonView[];
  active: number;
  /** Team indexes that can come in right now. */
  allowed: number[];
  /** True after a faint: the player must pick someone. */
  forced: boolean;
  onPick: (teamIndex: number) => void;
  onCancel: () => void;
}

/**
 * Compact party picker drawn over the arena's top-left corner (rendered inside the
 * scene wrapper), so the battle stays visible while choosing who comes in.
 */
export function PartyPanel({ team, active, allowed, forced, onPick, onCancel }: Props) {
  const typesOf = useSpeciesTypes();

  useEffect(() => {
    if (forced) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forced, onCancel]);

  return (
    <>
      <div className={styles.partyScrim} onClick={forced ? undefined : onCancel} aria-hidden="true" />
      <div className={styles.party} role="dialog" aria-modal="true" aria-labelledby="party-title">
        <header className={styles.partyHeader}>
          <div>
            <h2 id="party-title" className={styles.partyHeading}>
              {forced ? "Quem entra agora?" : "Trocar Pokémon"}
            </h2>
            <p className={styles.partySub}>
              {forced ? `${team[active]?.species} não pode continuar.` : "Trocar gasta o seu turno."}
            </p>
          </div>
          {!forced && (
            <button className={styles.partyClose} onClick={onCancel} aria-label="Fechar">
              ✕
            </button>
          )}
        </header>

        <ul className={styles.partyGrid}>
          {team.map((mon, i) => {
            const canPick = allowed.includes(i);
            const ratio = mon.maxHp > 0 ? mon.hp / mon.maxHp : 0;
            return (
              <li key={mon.species}>
                <button
                  className={cx(styles.partyCell, i === active && styles.partyCellActive, mon.fainted && styles.partyCellFainted)}
                  disabled={!canPick}
                  onClick={() => onPick(i)}
                  title={`${mon.species} · ${mon.item} · ${mon.ability}`}
                >
                  <PokemonEmblem species={mon.species} types={typesOf(mon.species)} size={40} still fainted={mon.fainted} />
                  <span className={styles.partyCellInfo}>
                    <span className={styles.partyCellName}>
                      {mon.species}
                      <StatusBadge status={mon.status} />
                    </span>
                    <span className={styles.partyBar}>
                      <span className={cx(styles.partyBarFill, styles[`bar-${hpTone(ratio)}`])} style={{ width: `${ratio * 100}%` }} />
                    </span>
                    <span className={styles.partyCellHp}>
                      {mon.fainted ? "desmaiado" : i === active ? "em campo" : `${mon.hp}/${mon.maxHp}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
