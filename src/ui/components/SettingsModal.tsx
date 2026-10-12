"use client";

import { updateSettings, useSettings, type BattleSpeed } from "../lib/settings";
import styles from "./SettingsModal.module.css";
import { Button, cx, Modal } from "./ui";

const SPEEDS: { id: BattleSpeed; label: string; hint: string }[] = [
  { id: "normal", label: "Normal", hint: "Ritmo dos jogos" },
  { id: "fast", label: "Rápida", hint: "Metade do tempo" },
  { id: "instant", label: "Instantânea", hint: "Sem animações" },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  return (
    <Modal onClose={onClose} labelledBy="settings-title">
      <h2 id="settings-title" className={styles.title}>
        Configurações
      </h2>

      <section className={styles.group}>
        <h3>Velocidade da batalha</h3>
        <div className={styles.segmented} role="radiogroup">
          {SPEEDS.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={settings.speed === s.id}
              className={cx(styles.segment, settings.speed === s.id && styles.active)}
              onClick={() => updateSettings({ speed: s.id })}
            >
              <strong>{s.label}</strong>
              <small>{s.hint}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={settings.hints} onChange={(e) => updateSettings({ hints: e.target.checked })} />
          <span className={styles.switch} />
          <span>
            <strong>Dicas de efetividade</strong>
            <small>Mostra &quot;Super efetivo&quot; nos golpes, como nos jogos mais recentes.</small>
          </span>
        </label>
      </section>

      <p className={styles.note}>Essas preferências ficam salvas só neste dispositivo.</p>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onClose}>
          Pronto
        </Button>
      </div>
    </Modal>
  );
}
