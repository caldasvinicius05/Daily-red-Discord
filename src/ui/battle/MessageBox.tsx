"use client";

import { useEffect, useState } from "react";
import { cx } from "../components/ui";
import styles from "./battle.module.css";

/** Classic battle text box: types the message out; click to fast-forward the turn. */
export function MessageBox({ text, waiting, speedMs, onClick }: { text: string; waiting: boolean; speedMs: number; onClick?: () => void }) {
  const [shown, setShown] = useState(speedMs === 0 ? text.length : 0);

  useEffect(() => {
    if (speedMs === 0) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs]);

  return (
    <div
      className={cx(styles.messageBox, onClick && styles.messageClickable)}
      onClick={onClick}
      role="status"
      aria-live="polite"
      title={onClick ? "Clique para pular" : undefined}
    >
      <p className={cx(styles.messageText, "pixel")}>
        {text.slice(0, shown)}
        <span className={styles.messageGhost}>{text.slice(shown)}</span>
      </p>
      {waiting && <span className={styles.messageCaret}>▼</span>}
    </div>
  );
}
