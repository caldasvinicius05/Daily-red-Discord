"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { LeaderboardDTO, TodayDTO } from "../api/types";
import { useApp, useSpeciesTypes } from "../AppContext";
import { ClockIcon, PracticeIcon, SwordIcon } from "../components/icons";
import { Leaderboard } from "../components/Leaderboard";
import { ParticipantsPanel } from "../components/ParticipantsPanel";
import { ShareButton } from "../components/ShareButton";
import { MonCard } from "../components/MonCard";
import { PokemonEmblem } from "../components/PokemonEmblem";
import { TopBar } from "../components/TopBar";
import { Button, cx, Spinner } from "../components/ui";
import { formatCountdown, formatGameDate } from "../lib/format";
import styles from "./HomeScreen.module.css";

interface Props {
  busy: boolean;
  error: string | null;
  onPlayDaily: (today: TodayDTO) => void;
  onResumeDaily: (battleId: string) => void;
  onPractice: (today: TodayDTO) => void;
}

/** Ticks every second towards `target` (epoch ms). */
function useCountdown(target: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return target ? Math.max(0, target - now) : 0;
}

export function HomeScreen({ busy, error, onPlayDaily, onResumeDaily, onPractice }: Props) {
  const { player } = useApp();
  const typesOf = useSpeciesTypes();
  const [today, setToday] = useState<TodayDTO | null>(null);
  const [board, setBoard] = useState<LeaderboardDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextAt, setNextAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [t, b] = await Promise.all([api.today(), api.leaderboard()]);
      setToday(t);
      setBoard(b);
      setNextAt(Date.now() + t.msUntilNext);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Não foi possível carregar o dia");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remaining = useCountdown(nextAt);
  // A new day started while the screen was open: fetch the new team.
  useEffect(() => {
    if (nextAt && remaining === 0) void load();
  }, [remaining, nextAt, load]);

  if (!today) {
    return (
      <main className={styles.page}>
        <TopBar />
        <div className={styles.loading}>
          {loadError ? (
            <>
              <p>{loadError}</p>
              <Button onClick={load}>Tentar de novo</Button>
            </>
          ) : (
            <Spinner label="Preparando o desafio de hoje..." />
          )}
        </div>
      </main>
    );
  }

  const { challenge, champion, daily, stats } = today;
  const firstName = player.displayName.split(" ")[0];

  return (
    <main className={styles.page}>
      <TopBar />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={cx(styles.kicker, "pixel")}>DESAFIO #{challenge.number}</span>
          <h1 className={styles.headline}>
            {daily.status === "finished"
              ? daily.result.won
                ? `Você venceu hoje, ${firstName}!`
                : `${champion.name} venceu hoje, ${firstName}.`
              : daily.status === "active"
                ? "Sua batalha está esperando."
                : `${champion.name} espera por você.`}
          </h1>
          <p className={styles.date}>{formatGameDate(challenge.date)}</p>

          <div className={styles.ctaRow}>
            {daily.status === "available" && (
              <Button variant="primary" size="lg" icon={<SwordIcon />} onClick={() => onPlayDaily(today)} disabled={busy}>
                Batalha diária
              </Button>
            )}
            {daily.status === "active" && (
              <Button variant="primary" size="lg" icon={<SwordIcon />} onClick={() => onResumeDaily(daily.battleId)} disabled={busy}>
                {busy ? "Abrindo..." : "Continuar batalha"}
              </Button>
            )}
            {daily.status === "finished" && (
              <div className={cx(styles.resultPill, daily.result.won ? styles.resultWin : styles.resultLoss)}>
                <strong>{daily.result.won ? "Vitória" : daily.result.abandoned ? "Desistência" : "Derrota"}</strong>
                <span>{daily.shareText.split("\n")[1] ?? ""}</span>
              </div>
            )}
            {daily.status === "finished" && <ShareButton text={daily.shareText} size="lg" />}
            <Button variant="secondary" size="lg" icon={<PracticeIcon />} onClick={() => onPractice(today)} disabled={busy}>
              Treinar
            </Button>
          </div>
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.countdown}>
            <ClockIcon width={16} height={16} />
            <span>Novo time em</span>
            <strong>{formatCountdown(remaining)}</strong>
          </div>
        </div>

        <aside className={styles.summit} aria-label={`Campeão de hoje: ${champion.name}`}>
          <div className={styles.summitHeader}>
            <div>
              <span className={styles.summitKicker}>Campeão de hoje</span>
              <span className={cx(styles.redName, "logo-font")}>{champion.name.toUpperCase()}</span>
            </div>
            <span className={styles.summitHint}>
              {champion.title}
              {champion.variant ? ` · ${champion.variant}` : ""}
              <br />
              {champion.location}
            </span>
          </div>
          <div className={styles.redTeam}>
            {champion.team.map((species, i) => (
              // Index key: a champion can bring the same species more than once.
              <div key={i} className={styles.redMon} style={{ animationDelay: `${i * 70}ms` }}>
                <PokemonEmblem species={species} types={typesOf(species)} size={58} still />
                <span>{species}</span>
              </div>
            ))}
          </div>
          <p className={styles.summitNote}>
            Começa com {champion.team[0]} e nunca troca por vontade própria. Não repete na semana. No treino, o campeão é
            sorteado a cada partida.
          </p>
        </aside>
      </section>

      <section className={styles.stats} aria-label="Suas estatísticas">
        {[
          { label: "Jogos", value: stats.played },
          { label: "Vitórias", value: `${stats.winRate}%` },
          { label: "Sequência", value: stats.winStreak, accent: stats.winStreak > 0 },
          { label: "Recorde", value: stats.bestWinStreak },
          { label: "Dias seguidos", value: stats.dayStreak },
        ].map((s) => (
          <div key={s.label} className={cx(styles.stat, s.accent && styles.statAccent)}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <div className={styles.columns}>
        <section className={styles.team}>
          <header className={styles.sectionHeader}>
            <h2>Seu time de hoje</h2>
            <p>Todo mundo recebe estes mesmos seis, nível 100, com sets competitivos gerados para o dia.</p>
          </header>
          <div className={styles.teamGrid}>
            {challenge.team.map((set, i) => (
              <MonCard key={set.species} set={set} index={i} />
            ))}
          </div>
        </section>

        <div className={styles.side}>
          <ParticipantsPanel />
          <Leaderboard board={board} loading={!board} />
        </div>
      </div>
    </main>
  );
}
