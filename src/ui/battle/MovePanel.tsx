"use client";

import type { MoveChoice } from "@/domain";
import { useApp } from "../AppContext";
import { SwapIcon } from "../components/icons";
import { CategoryIcon, TypeIcon } from "../components/TypeIcon";
import { cx } from "../components/ui";
import { useSettings } from "../lib/settings";
import { CATEGORY_PT, effectiveness, effectivenessLabel, TYPE_NAMES_PT, typeColor, typeTextColor } from "../lib/types";
import styles from "./battle.module.css";

/** Short labels so the category fits on the button next to type, power and PP. */
const CATEGORY_SHORT: Record<string, string> = { Physical: "Fís", Special: "Esp", Status: "Status" };

interface Props {
  moves: MoveChoice[];
  /** Types of Red's Pokémon on the field, for effectiveness hints. */
  targetTypes: string[] | null;
  disabled: boolean;
  canSwitch: boolean;
  onMove: (index: number) => void;
  onSwitch: () => void;
}

export function MovePanel({ moves, targetTypes, disabled, canSwitch, onMove, onSwitch }: Props) {
  const { reference } = useApp();
  const { hints } = useSettings();

  return (
    <div className={styles.moves}>
      <div className={styles.moveGrid}>
        {moves.map((move) => {
          const info = reference.moves[move.name];
          const category = info?.category ?? "Physical";
          const mult = hints && targetTypes && category !== "Status" ? effectiveness(move.type, targetTypes) : null;
          const label = mult !== null && mult !== 1 ? effectivenessLabel(mult) : null;
          const lowPp = move.maxPp > 0 && move.pp / move.maxPp <= 0.25;
          return (
            <button
              key={move.index}
              className={styles.move}
              style={{ ["--type" as string]: typeColor(move.type), ["--type-text" as string]: typeTextColor(move.type) }}
              disabled={disabled || move.disabled}
              onClick={() => onMove(move.index)}
              title={
                info
                  ? `${CATEGORY_PT[info.category]} · Poder ${info.power || "—"} · Precisão ${info.accuracy === true ? "—" : `${info.accuracy}%`}${info.priority > 0 ? " · Prioridade" : ""}\n${info.description}`
                  : move.name
              }
            >
              <span className={styles.moveTop}>
                <span className={styles.moveName}>{move.name}</span>
                {label && <span className={cx(styles.eff, styles[`eff-${label.tone}`])}>{label.text}</span>}
              </span>
              <span className={styles.moveBottom}>
                <span className={styles.moveType}>
                  <TypeIcon type={move.type} />
                  {TYPE_NAMES_PT[move.type] ?? move.type}
                </span>
                <span className={styles.moveCategory}>
                  <CategoryIcon category={category} />
                  {CATEGORY_SHORT[category]}
                </span>
                <span className={styles.movePower} title="Poder">
                  {info && info.power > 0 ? `Poder ${info.power}` : "—"}
                </span>
                <span className={cx(styles.pp, lowPp && styles.ppLow)}>
                  PP {move.pp}/{move.maxPp}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button className={styles.switchButton} disabled={disabled || !canSwitch} onClick={onSwitch}>
        <SwapIcon />
        <span>Trocar</span>
      </button>
    </div>
  );
}
