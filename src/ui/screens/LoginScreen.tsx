"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { Button, Logo } from "../components/ui";
import styles from "./entry.module.css";

/** Local testing only: the server refuses this login in production. */
export function LoginScreen({ onLogin }: { onLogin: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onLogin(name.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar");
      setBusy(false);
    }
  };

  return (
    <main className={styles.center}>
      <form className={styles.loginCard} onSubmit={submit}>
        <Logo size="lg" />
        <p className={styles.tagline}>Uma batalha por dia contra um campeão. Mesmo time para todo o servidor.</p>

        <div className={styles.devBadge}>
          <span className={styles.devDot} /> Modo local · fora do Discord
        </div>

        <label className={styles.field}>
          <span>Seu nome de treinador</span>
          <input
            autoFocus
            value={name}
            maxLength={32}
            placeholder="Ex.: Vinicius"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <Button variant="primary" size="lg" type="submit" disabled={busy || !name.trim()}>
          {busy ? "Entrando..." : "Começar a escalada"}
        </Button>

        <p className={styles.hint}>
          Todos que entram por aqui caem no mesmo servidor de teste, então dá para testar o ranking abrindo outra aba
          anônima com outro nome.
        </p>
      </form>
    </main>
  );
}
