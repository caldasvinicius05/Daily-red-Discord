"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BattleEvent } from "@/domain";
import { cx, StatusBadge } from "../components/ui";
import styles from "./BattleLog.module.css";
import { buildBattleLog, type LogIcon } from "./logEntries";

/** Simple symbols per line type; color comes from CSS. */
const ICONS: Record<LogIcon, string> = {
  switch: "⇄",
  move: "➤",
  damage: "✦",
  heal: "✚",
  item: "◆",
  status: "●",
  weather: "☁",
  recoil: "↺",
  faint: "✕",
  boost: "▲",
  drop: "▼",
  hit: "!",
  ability: "★",
  effect: "◎",
  end: "⚑",
  info: "·",
};

const LEGEND: { icon: LogIcon; label: string }[] = [
  { icon: "move", label: "Ataque" },
  { icon: "damage", label: "Dano" },
  { icon: "heal", label: "Cura" },
  { icon: "item", label: "Item" },
  { icon: "status", label: "Status" },
  { icon: "boost", label: "Atributo" },
];

/** Always-visible battle history: attacks, damage, items, status, stat changes. */
export function BattleLog({ events }: { events: readonly BattleEvent[] }) {
  const entries = useMemo(() => buildBattleLog(events), [events]);
  const listRef = useRef<HTMLOListElement>(null);
  const stickToBottom = useRef(true);

  // Follow new lines, unless the player scrolled up to read something.
  useEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [entries.length]);

  const onScroll = () => {
    const list = listRef.current;
    if (list) stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  };

  return (
    <aside className={styles.panel} aria-label="Histórico da batalha">
      <header className={styles.header}>
        <h2>Histórico</h2>
        <div className={styles.sides}>
          <span className={styles.youDot}>Você</span>
          <span className={styles.redDot}>Red</span>
        </div>
      </header>

      <ol ref={listRef} className={styles.list} onScroll={onScroll} aria-live="polite">
        {entries.length === 0 && <li className={styles.empty}>A batalha vai começar...</li>}
        {entries.map((entry, i) =>
          entry.kind === "turn" ? (
            <li key={i} className={styles.turn}>
              <span>Turno {entry.turn}</span>
            </li>
          ) : (
            <li key={i} className={cx(styles.line, entry.side === "player" && styles.player, entry.side === "red" && styles.red)}>
              <span className={cx(styles.icon, styles[`icon-${entry.icon}`])} aria-hidden="true">
                {ICONS[entry.icon]}
              </span>
              <span className={styles.text}>
                {entry.text}
                {entry.status && (
                  <>
                    {" "}
                    <StatusBadge status={entry.status} />
                  </>
                )}
              </span>
              {entry.detail && (
                <span className={cx(styles.detail, entry.detail.startsWith("+") ? styles.up : styles.down)}>{entry.detail}</span>
              )}
            </li>
          ),
        )}
      </ol>

      <footer className={styles.legend}>
        {LEGEND.map((l) => (
          <span key={l.icon}>
            <span className={cx(styles.icon, styles.legendIcon, styles[`icon-${l.icon}`])}>{ICONS[l.icon]}</span>
            {l.label}
          </span>
        ))}
      </footer>
    </aside>
  );
}
