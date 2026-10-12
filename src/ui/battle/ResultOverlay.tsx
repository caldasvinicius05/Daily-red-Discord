"use client";

import { useMemo } from "react";
import type { BattleDTO } from "../api/types";
import { PracticeIcon } from "../components/icons";
import { ShareButton } from "../components/ShareButton";
import { Button, cx } from "../components/ui";
import { plural } from "../lib/format";
import styles from "./battle.module.css";

/** Original celebratory confetti: plain colored rectangles. */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 1.8,
        rotate: Math.random() * 360,
        color: ["#ff3d4a", "#ffd166", "#8fd3ff", "#4ade80", "#f3f7ff", "#c78bff"][i % 6],
      })),
    [],
  );
  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function ResultOverlay({ battle, onHome, onPractice }: { battle: BattleDTO; onHome: () => void; onPractice: () => void }) {
  const result = battle.result!;
  const survivors = result.playerAlive.filter(Boolean).length;
  const kos = result.redFainted.filter(Boolean).length;

  const title = result.won ? "VITÓRIA!" : result.abandoned ? "DESISTÊNCIA" : "DERROTA";
  const subtitle = result.won
    ? "Você derrotou o Red no topo do Monte Prateado."
    : result.abandoned
      ? "A batalha ficou para trás. Amanhã tem outra."
      : "O Red continua invicto... por enquanto.";

  return (
    <div className={styles.resultBackdrop}>
      {result.won && <Confetti />}
      <div className={cx(styles.result, result.won ? styles.resultWin : styles.resultLoss)} role="dialog" aria-modal="true" aria-labelledby="result-title">
        <span className={cx(styles.resultMode, "pixel")}>
          {battle.mode === "daily" ? `DIÁRIA #${battle.challengeNumber}` : "TREINO"}
        </span>
        <h2 id="result-title" className={cx(styles.resultTitle, "logo-font")}>
          {title}
        </h2>
        <p className={styles.resultSubtitle}>{subtitle}</p>

        <div className={styles.resultGrids}>
          <div>
            <small>Seu time</small>
            <div className={styles.resultGrid}>
              {result.playerAlive.map((alive, i) => (
                <span key={i} className={cx(styles.resultCell, alive && styles.cellAlive)} />
              ))}
            </div>
            <strong>{survivors}/6 de pé</strong>
          </div>
          <div>
            <small>Time do Red</small>
            <div className={styles.resultGrid}>
              {result.redFainted.map((down, i) => (
                <span key={i} className={cx(styles.resultCell, down && styles.cellKo)} />
              ))}
            </div>
            <strong>{kos}/6 derrubados</strong>
          </div>
          <div>
            <small>Duração</small>
            <div className={cx(styles.resultBig, "pixel")}>{result.turns}</div>
            <strong>{plural(result.turns, "turno", "turnos")}</strong>
          </div>
        </div>

        {battle.shareText && (
          <div className={styles.share}>
            <pre className={styles.shareText}>{battle.shareText}</pre>
            <ShareButton text={battle.shareText} />
          </div>
        )}
        {battle.mode === "practice" && <p className={styles.resultNote}>Treino não conta para estatísticas nem ranking.</p>}

        <div className={styles.resultActions}>
          <Button variant="ghost" onClick={onHome}>
            Voltar ao início
          </Button>
          <Button variant="primary" icon={<PracticeIcon />} onClick={onPractice}>
            {battle.mode === "practice" ? "Treinar de novo" : "Treinar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
