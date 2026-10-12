"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { StatusesDTO } from "../api/types";
import { useApp } from "../AppContext";
import { watchParticipants, type ActivityParticipant } from "../discord/discordAuth";
import styles from "./ParticipantsPanel.module.css";
import { Avatar, cx, Panel } from "./ui";

type Status = StatusesDTO["statuses"][number];

/** Refresh interval for statuses while the home screen is open (someone may finish meanwhile). */
const REFRESH_MS = 30_000;

function label(status: Status | undefined): { text: string; tone: string } {
  if (!status || status.status === "none") return { text: "Ainda não jogou", tone: "idle" };
  if (status.status === "active") return { text: "Batalhando agora", tone: "active" };
  const r = status.result!;
  if (r.abandoned) return { text: "Desistiu", tone: "loss" };
  if (r.won) return { text: `Venceu · ${r.playerAlive.filter(Boolean).length}/6 de pé`, tone: "win" };
  return { text: `Perdeu · ${r.redFainted.filter(Boolean).length}/6 derrubados`, tone: "loss" };
}

/** Who is in this Activity right now and how their daily went. Only shown inside Discord. */
export function ParticipantsPanel() {
  const { player, insideDiscord } = useApp();
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [statuses, setStatuses] = useState<Map<string, Status>>(new Map());
  const idsRef = useRef<string>("");

  useEffect(() => {
    if (!insideDiscord) return;
    let stop = () => {};
    let alive = true;
    void watchParticipants((list) => alive && setParticipants(list)).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });
    return () => {
      alive = false;
      stop();
    };
  }, [insideDiscord]);

  useEffect(() => {
    if (participants.length === 0) return;
    const ids = participants.map((p) => p.id).slice(0, 25);
    idsRef.current = ids.join(",");
    const load = () =>
      api
        .statuses(ids)
        .then(({ statuses: list }) => {
          // Ignore answers for an older participant list.
          if (idsRef.current === ids.join(",")) setStatuses(new Map(list.map((s) => [s.playerId, s])));
        })
        .catch(() => {});
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [participants]);

  if (!insideDiscord || participants.length === 0) return null;

  return (
    <Panel
      className={styles.panel}
      title={
        <span className={styles.title}>
          <span className={styles.liveDot} /> Na atividade agora
        </span>
      }
    >
      <ul className={styles.list}>
        {participants.map((p) => {
          const { text, tone } = label(statuses.get(p.id));
          return (
            <li key={p.id} className={styles.row}>
              <Avatar id={p.id} name={p.name} avatar={p.avatar} size={30} />
              <span className={styles.name}>
                {p.name}
                {p.id === player.id && <span className={styles.you}>você</span>}
              </span>
              <span className={cx(styles.status, styles[tone])}>{text}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
