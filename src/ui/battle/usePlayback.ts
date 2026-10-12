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
  /** Every event shown so far, in order; feeds the battle history panel. */
  history: BattleEvent[];
  /** Animates `events` on top of the current screen, then snaps to `finalView`. */
  play(events: readonly BattleEvent[], finalView: BattleView): Promise<void>;
  /** Jump to the end of what is playing. */
  skip(): void;
  /** Show a state immediately (reopening a battle). */
  reset(view: BattleView | null, history: readonly BattleEvent[]): void;
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
  const [history, setHistory] = useState<BattleEvent[]>([]);

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
    let shown = 0;
    for (const event of events) {
      if (skippingRef.current) break;
      setDisplay(applyEvent(displayRef.current, event));
      // History grows line by line, in step with the narration.
      setHistory((h) => [...h, event]);
      shown++;
      if (event.text && event.kind !== "turn") setMessage(event.text);
      const fx = effectFor(event);
      if (fx) setEffect({ ...fx, key: ++effectKey.current });
      await wait(eventDuration(event) * speedFactor(speedRef.current));
    }

    // Skipped: add whatever wasn't shown yet. Then end on the server's authoritative state.
    if (shown < events.length) setHistory((h) => [...h, ...events.slice(shown)]);
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
    setDisplay(view ? displayFromView(view) : EMPTY_DISPLAY);
    setHistory([...history]);
    setMessage([...history].reverse().find((e) => e.text && e.kind !== "turn")?.text ?? null);
    setEffect(null);
    setPlaying(false);
  }, []);

  return { display, message, effect, playing, history, play, skip, reset };
}
