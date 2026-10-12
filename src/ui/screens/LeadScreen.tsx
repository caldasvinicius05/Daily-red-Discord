"use client";

import { useEffect, useState } from "react";
import type { BattleMode } from "@/domain";
import { api } from "../api/client";
import type { TodayDTO } from "../api/types";
import { useSpeciesTypes } from "../AppContext";
import { BackIcon, SwordIcon } from "../components/icons";
import { MonCard } from "../components/MonCard";
import { PokemonEmblem } from "../components/PokemonEmblem";
import { TopBar } from "../components/TopBar";
import { Button, cx, Spinner } from "../components/ui";
import { effectiveness } from "../lib/types";
import styles from "./LeadScreen.module.css";

interface Props {
  mode: BattleMode;
  /** The day as already loaded by the home screen; fetched only if missing. */
  initialToday: TodayDTO | null;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: (leadIndex: number) => void;
}

export function LeadScreen({ mode, initialToday, busy, error, onBack, onConfirm }: Props) {
  const typesOf = useSpeciesTypes();
  const [today, setToday] = useState<TodayDTO | null>(initialToday);
  const [lead, setLead] = useState(0);

  useEffect(() => {
    if (!initialToday) void api.today().then(setToday);
  }, [initialToday]);

  if (!today) {
    return (
      <main className={styles.page}>
        <TopBar />
        <div className={styles.loading}>
          <Spinner label="Carregando seu time..." />
        </div>
      </main>
    );
  }

  const team = today.challenge.team;
  const champion = today.champion;
  const championLead = champion.team[0]!;
  const championLeadTypes = typesOf(championLead);
  const chosen = team[lead]!;
  // Quick read of the matchup: best multiplier of the chosen lead's attacking types vs the champion's lead.
  const best = Math.max(...typesOf(chosen.species).map((t) => effectiveness(t, championLeadTypes)));
  const worst = Math.max(...championLeadTypes.map((t) => effectiveness(t, typesOf(chosen.species))));

  return (
    <main className={styles.page}>
      <TopBar
        left={
          <Button variant="ghost" size="sm" icon={<BackIcon />} onClick={onBack}>
            Voltar
          </Button>
        }
      />

      <header className={styles.header}>
        <span className={cx(styles.mode, mode === "daily" ? styles.modeDaily : styles.modePractice, "pixel")}>
          {mode === "daily" ? `DIÁRIA #${today.challenge.number}` : "TREINO"}
        </span>
        <h1>Quem vai na frente?</h1>
        <p>
          {mode === "daily"
            ? "Você tem uma chance hoje. A escolha do primeiro Pokémon vale muito."
            : "Treino não conta para as estatísticas. O campeão é sorteado ao começar."}
        </p>
      </header>

      <div className={styles.grid}>
        {team.map((set, i) => (
          <MonCard key={set.species} set={set} variant="pick" index={i} selected={lead === i} onSelect={() => setLead(i)} />
        ))}
      </div>

      <footer className={styles.footer}>
        {mode === "practice" ? (
          <div className={styles.practiceNote}>
            <strong>Campeão sorteado</strong>
            <span>Pode ser qualquer um dos sete. Seu time é o mesmo da diária de hoje.</span>
          </div>
        ) : (
        <div className={styles.matchup}>
          <div className={styles.side}>
            <PokemonEmblem species={chosen.species} types={typesOf(chosen.species)} size={52} still />
            <div>
              <small>Você</small>
              <strong>{chosen.species}</strong>
            </div>
          </div>
          <span className={cx(styles.vs, "logo-font")}>VS</span>
          <div className={cx(styles.side, styles.sideRed)}>
            <div>
              <small>{champion.name}</small>
              <strong>{championLead}</strong>
            </div>
            <PokemonEmblem species={championLead} types={championLeadTypes} size={52} still />
          </div>
          <p className={styles.read}>
            {best >= 2
              ? `Seu tipo é forte contra o primeiro de ${champion.name}. `
              : best < 1
                ? `Seu tipo é fraco contra o primeiro de ${champion.name}. `
                : ""}
            {worst >= 2 ? "Cuidado: o tipo dele é forte contra você." : worst === 0 ? "O tipo dele não te afeta!" : ""}
            {best < 2 && best >= 1 && worst < 2 && worst !== 0 ? "Confronto equilibrado." : ""}
          </p>
        </div>
        )}

        <div className={styles.confirm}>
          {error && <p className={styles.error}>{error}</p>}
          <Button variant="primary" size="lg" icon={<SwordIcon />} disabled={busy} onClick={() => onConfirm(lead)}>
            {busy ? "Subindo..." : "Começar batalha"}
          </Button>
        </div>
      </footer>
    </main>
  );
}
