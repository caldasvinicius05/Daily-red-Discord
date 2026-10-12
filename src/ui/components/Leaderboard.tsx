"use client";

import { useApp } from "../AppContext";
import type { LeaderboardDTO } from "../api/types";
import { formatTime, plural } from "../lib/format";
import { TrophyIcon } from "./icons";
import styles from "./Leaderboard.module.css";
import { Avatar, cx, Panel } from "./ui";

export function Leaderboard({ board, loading }: { board: LeaderboardDTO | null; loading: boolean }) {
  const { player, insideDiscord } = useApp();

  return (
    <Panel
      className={styles.panel}
      title={
        <span className={styles.title}>
          <TrophyIcon width={16} height={16} /> Ranking do servidor
        </span>
      }
    >
      {loading && !board && <p className={styles.empty}>Carregando...</p>}

      {board && board.entries.length === 0 && (
        <div className={styles.empty}>
          <p>Ninguém enfrentou o Red hoje ainda.</p>
          <p className={styles.emptyHint}>{insideDiscord ? "Seja o primeiro do servidor!" : "Jogue para aparecer aqui."}</p>
        </div>
      )}

      {board && board.entries.length > 0 && (
        <ol className={styles.list}>
          {board.entries.map((entry) => {
            const { result } = entry;
            const me = entry.player.id === player.id;
            const survivors = result.playerAlive.filter(Boolean).length;
            const kos = result.redFainted.filter(Boolean).length;
            return (
              <li key={entry.player.id} className={cx(styles.row, me && styles.me)}>
                <span className={cx(styles.rank, "pixel", entry.rank <= 3 && styles[`rank${entry.rank}`])}>{entry.rank}</span>
                <Avatar id={entry.player.id} name={entry.player.displayName} avatar={entry.player.avatar} size={34} />
                <div className={styles.who}>
                  <strong>
                    {entry.player.displayName}
                    {me && <span className={styles.youTag}>você</span>}
                  </strong>
                  <small>
                    {result.abandoned
                      ? "Desistiu"
                      : result.won
                        ? `Venceu · ${plural(result.turns, "turno", "turnos")}`
                        : `Perdeu · ${kos}/6 derrubados`}
                    {" · "}
                    {formatTime(entry.finishedAt)}
                  </small>
                </div>
                <div className={styles.grid} aria-label={result.won ? `${survivors} de 6 de pé` : `${kos} de 6 derrubados`}>
                  {(result.won ? result.playerAlive : result.redFainted).map((on, i) => (
                    <span key={i} className={cx(styles.cell, on && (result.won ? styles.cellWin : styles.cellKo))} />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
