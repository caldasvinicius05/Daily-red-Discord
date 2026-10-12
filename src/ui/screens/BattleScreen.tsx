"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerAction } from "@/domain";
import { api, ApiError } from "../api/client";
import type { BattleDTO } from "../api/types";
import { useSpeciesTypes } from "../AppContext";
import { BattleScene } from "../battle/BattleScene";
import { MessageBox } from "../battle/MessageBox";
import { MovePanel } from "../battle/MovePanel";
import { PartyPanel } from "../battle/PartyPanel";
import { ResultOverlay } from "../battle/ResultOverlay";
import { usePlayback } from "../battle/usePlayback";
import { BackIcon, FastIcon, FlagIcon, ScrollIcon } from "../components/icons";
import { Button, cx, Modal } from "../components/ui";
import { updateSettings, useSettings } from "../lib/settings";
import styles from "../battle/battle.module.css";

interface Props {
  initial: BattleDTO;
  onExit: () => void;
  onPractice: () => void;
}

export function BattleScreen({ initial, onExit, onPractice }: Props) {
  const settings = useSettings();
  const typesOf = useSpeciesTypes();
  const playback = usePlayback(settings.speed);
  const [battle, setBattle] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [forfeitOpen, setForfeitOpen] = useState(false);
  const [showResult, setShowResult] = useState(Boolean(initial.result));
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  // First paint: animate the opening send-outs for a new battle, or restore a battle in progress.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fresh = !initial.result && !initial.events.some((e) => e.kind === "move");
    if (fresh) {
      playback.reset(null, []);
      void playback.play(initial.events, initial.view);
    } else {
      playback.reset(initial.view, initial.events);
    }
  }, [initial, playback]);

  const { view } = battle;
  const idle = !playback.playing && !submitting;
  const ended = view.phase === "ended" || Boolean(battle.result);
  const forcedSwitch = idle && !ended && view.phase === "switch";
  const activeMon = view.player.team[view.player.active];

  const act = async (action: PlayerAction) => {
    setSubmitting(true);
    setError(null);
    setPartyOpen(false);
    try {
      const next = await api.act(battle.id, action);
      setBattle(next);
      await playback.play(next.events, next.view);
      if (next.result) setShowResult(true);
    } catch (e) {
      if (e instanceof ApiError && (e.code === "conflict" || e.code === "battle_ended")) {
        // Another tab moved this battle on; reload the truth.
        const fresh = await api.getBattle(battle.id);
        setBattle(fresh);
        playback.reset(fresh.view, fresh.events);
        if (fresh.result) setShowResult(true);
      } else {
        setError(e instanceof ApiError ? e.message : "Não foi possível enviar sua jogada");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const forfeit = async () => {
    setForfeitOpen(false);
    setSubmitting(true);
    try {
      const next = await api.forfeit(battle.id);
      setBattle(next);
      setShowResult(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível desistir");
    } finally {
      setSubmitting(false);
    }
  };

  const message = playback.playing
    ? (playback.message ?? "")
    : submitting
      ? "..."
      : ended
        ? (playback.message ?? "A batalha terminou.")
        : view.phase === "switch"
          ? "Escolha o próximo Pokémon."
          : `O que ${activeMon?.species ?? "seu Pokémon"} vai fazer?`;

  const redActive = playback.display.red.active;
  const redOrder = view.red.team.flatMap((m) => (m ? [m.species] : []));
  // The whole line must be readable well before the event's hold time ends.
  const typingSpeed = settings.speed === "instant" ? 0 : settings.speed === "fast" ? 6 : 12;

  return (
    <main className={styles.page}>
      <header className={styles.hud}>
        <Button variant="ghost" size="sm" icon={<BackIcon />} onClick={onExit} aria-label="Início">
          <span className={styles.hideNarrow}>Início</span>
        </Button>
        <div className={styles.hudCenter}>
          <span className={cx(styles.modeChip, battle.mode === "daily" ? styles.modeDaily : styles.modePractice, "pixel")}>
            {battle.mode === "daily" ? `DIÁRIA #${battle.challengeNumber}` : "TREINO"}
          </span>
          <span className={cx(styles.turn, "pixel")}>Turno {Math.max(1, playback.display.turn)}</span>
        </div>
        <div className={styles.hudRight}>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Alternar velocidade"
            title="Velocidade"
            icon={<FastIcon />}
            onClick={() => updateSettings({ speed: settings.speed === "normal" ? "fast" : settings.speed === "fast" ? "instant" : "normal" })}
          >
            <span className={styles.hideNarrow}>{settings.speed === "normal" ? "1×" : settings.speed === "fast" ? "2×" : "∞"}</span>
          </Button>
          <Button variant="ghost" size="sm" aria-label="Histórico" icon={<ScrollIcon />} onClick={() => setLogOpen(true)}>
            <span className={styles.hideNarrow}>Histórico</span>
          </Button>
          {!ended && (
            <Button variant="danger" size="sm" aria-label="Desistir" icon={<FlagIcon />} onClick={() => setForfeitOpen(true)} disabled={!idle}>
              <span className={styles.hideNarrow}>Desistir</span>
            </Button>
          )}
        </div>
      </header>

      <BattleScene
        display={playback.display}
        effect={playback.effect}
        playerOrder={view.player.team.map((m) => m.species)}
        redOrder={redOrder}
      />

      <MessageBox
        text={message}
        speedMs={typingSpeed}
        waiting={playback.playing}
        {...(playback.playing ? { onClick: playback.skip } : {})}
      />

      {error && <p className={styles.error}>{error}</p>}

      {!ended && (
        <MovePanel
          moves={view.choices.moves}
          targetTypes={redActive ? typesOf(redActive) : null}
          disabled={!idle || view.phase !== "move"}
          canSwitch={view.choices.switches.length > 0}
          onMove={(move) => act({ type: "move", move })}
          onSwitch={() => setPartyOpen(true)}
        />
      )}

      {ended && !showResult && (
        <div className={styles.endActions}>
          <Button variant="primary" onClick={() => setShowResult(true)}>
            Ver resultado
          </Button>
        </div>
      )}

      {(partyOpen || forcedSwitch) && (
        <PartyPanel
          team={view.player.team}
          active={view.player.active}
          allowed={view.choices.switches}
          forced={forcedSwitch}
          onPick={(teamIndex) => act({ type: "switch", teamIndex })}
          onCancel={() => setPartyOpen(false)}
        />
      )}

      {logOpen && (
        <Modal onClose={() => setLogOpen(false)} labelledBy="log-title">
          <h2 id="log-title" className={styles.partyTitle}>
            Histórico da batalha
          </h2>
          <ol className={styles.log}>
            {playback.log.map((line, i) => (
              <li key={i} className="pixel">
                {line}
              </li>
            ))}
          </ol>
          <div className={styles.partyActions}>
            <Button variant="secondary" onClick={() => setLogOpen(false)}>
              Fechar
            </Button>
          </div>
        </Modal>
      )}

      {forfeitOpen && (
        <Modal onClose={() => setForfeitOpen(false)} labelledBy="forfeit-title">
          <h2 id="forfeit-title" className={styles.partyTitle}>
            Desistir da batalha?
          </h2>
          <p className={styles.partyHint}>
            {battle.mode === "daily"
              ? "Na diária isso conta como derrota e encerra o desafio de hoje."
              : "É só um treino: nada é registrado."}
          </p>
          <div className={styles.partyActions}>
            <Button variant="ghost" onClick={() => setForfeitOpen(false)}>
              Continuar lutando
            </Button>
            <Button variant="danger" icon={<FlagIcon />} onClick={forfeit}>
              Desistir
            </Button>
          </div>
        </Modal>
      )}

      {showResult && battle.result && <ResultOverlay battle={battle} onHome={onExit} onPractice={onPractice} />}
    </main>
  );
}
