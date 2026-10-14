"use client";

import { useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "./storage";

export type BattleSpeed = "normal" | "fast" | "instant";

export interface Settings {
  speed: BattleSpeed;
  /** Show "super effective" hints on move buttons (Gen 7+ style). */
  hints: boolean;
  /** Champion theme during battles. */
  music: boolean;
  /** 0–1. Low by default: people are usually in a voice call. */
  musicVolume: number;
}

const KEY = "dailyred.settings";
const DEFAULTS: Settings = { speed: "normal", hints: true, music: true, musicVolume: 0.3 };

let current: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load(): Settings {
  if (!loaded && typeof window !== "undefined") {
    current = { ...DEFAULTS, ...(readJSON<Partial<Settings>>("local", KEY) ?? {}) };
    loaded = true;
  }
  return current;
}

export function updateSettings(patch: Partial<Settings>): void {
  current = { ...load(), ...patch };
  writeJSON("local", KEY, current);
  listeners.forEach((l) => l());
}

/** Per-viewer preferences, remembered on this device. */
export function useSettings(): Settings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load,
    () => DEFAULTS,
  );
}

/** Multiplier applied to every battle animation delay. */
export function speedFactor(speed: BattleSpeed): number {
  return speed === "fast" ? 0.5 : speed === "instant" ? 0 : 1;
}
