"use client";

import { useCallback, useRef, useState } from "react";
import type { BattleEvent, BattleSide, BattleView } from "@/domain";
import { speedFactor, type BattleSpeed } from "../lib/settings";
import { applyEvent, displayFromView, effectFor, EMPTY_DISPLAY, eventDuration, type DisplayState, type Effect } from "./displayState";

export interface ActiveEffect {
  side: BattleSide;
  effect: Effect;
  /** Changes every time so the same effect can replay back to back. */
  key: number;
}

export interface Playback {
  display: DisplayState;
  message: string | null;
  effect: ActiveEffect | null;
  playing: boolean;
  log: string[];
  /** Animates `events` on top of the current screen, then snaps to `finalView`. */
  play(events: readonly BattleEvent[], finalView: BattleView): Promise<void>;
  /** Jump to the end of what is playing. */
  skip(): void;
  /** Show a state immediately (reopening a battle). */
  reset(view: BattleView | null, history: readonly BattleEvent[]): void;
}

function textsOf(events: readonly BattleEvent[]): string[] {
  return events.flatMap((e) => (e.text && e.kind !== "turn" ? [e.text] : []));
}

export function usePlayback(speed: BattleSpeed): Playback {
  const [display, setDisplayState] = useState<DisplayState>(EMPTY_DISPLAY);
  // Mirror of what's on screen, readable inside the async playback loop.
  const displayRef = useRef<DisplayState>(EMPTY_DISPLAY);
  const setDisplay = (next: DisplayState) => {
    displayRef.current = next;
    setDisplayState(next);
  };
  const [message, setMessage] = useState<string | null>(null);
  const [effect, setEffect] = useState<ActiveEffect | null>(null);
  const [playing, setPlaying] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const skipRef = useRef<(() => void) | null>(null);
  const skippingRef = useRef(false);
  const effectKey = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      if (skippingRef.current || ms <= 0) return resolve();
      const timer = setTimeout(resolve, ms);
      skipRef.current = () => {
        clearTimeout(timer);
        resolve();
      };
    });

  const play = useCallback(async (events: readonly BattleEvent[], finalView: BattleView) => {
    skippingRef.current = false;
    setPlaying(true);
    setLog((l) => [...l, ...textsOf(events)]);

    for (const event of events) {
      if (skippingRef.current) break;
      setDisplay(applyEvent(displayRef.current, event));
      if (event.text && event.kind !== "turn") setMessage(event.text);
      const fx = effectFor(event);
      if (fx) setEffect({ ...fx, key: ++effectKey.current });
      await wait(eventDuration(event) * speedFactor(speedRef.current));
    }

    // Whatever happened above, end on the server's authoritative state.
    setDisplay(displayFromView(finalView));
    setEffect(null);
    setPlaying(false);
    skippingRef.current = false;
  }, []);

  const skip = useCallback(() => {
    skippingRef.current = true;
    skipRef.current?.();
  }, []);

  const reset = useCallback((view: BattleView | null, history: readonly BattleEvent[]) => {
    const texts = textsOf(history);
    setDisplay(view ? displayFromView(view) : EMPTY_DISPLAY);
    setLog(texts);
    setMessage(texts.at(-1) ?? null);
    setEffect(null);
    setPlaying(false);
  }, []);

  return { display, message, effect, playing, log, play, skip, reset };
}
