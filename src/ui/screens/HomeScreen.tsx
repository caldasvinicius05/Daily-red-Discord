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

  const { challenge, daily, stats } = today;
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
                : `O Red venceu hoje, ${firstName}.`
              : daily.status === "active"
                ? "Sua batalha está esperando."
                : "O Red espera no topo."}
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

        <aside className={styles.summit} aria-label="Time do Red">
          <div className={styles.summitHeader}>
            <span className={cx(styles.redName, "logo-font")}>RED</span>
            <span className={styles.summitHint}>Nível 100 · sempre o mesmo time</span>
          </div>
          <div className={styles.redTeam}>
            {today.redTeam.map((species, i) => (
              <div key={species} className={styles.redMon} style={{ animationDelay: `${i * 70}ms` }}>
                <PokemonEmblem species={species} types={typesOf(species)} size={58} still />
                <span>{species}</span>
              </div>
            ))}
          </div>
          <p className={styles.summitNote}>Ele sempre começa com {today.redTeam[0]} e nunca troca por vontade própria.</p>
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
            <p>Todo mundo recebe estes mesmos seis. Nível 100, IVs perfeitos.</p>
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
