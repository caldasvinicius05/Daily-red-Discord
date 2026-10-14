"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "../lib/settings";

const FADE_MS = 1200;

/**
 * Plays `src` in a loop while `playing`, following the music settings (on/off, volume),
 * with fades in and out. Browsers only allow sound after the person interacts with the
 * page, so a blocked start is retried on the next click or key press.
 */
export function useBattleMusic(src: string | null, playing: boolean): void {
  const { music, musicVolume } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const shouldPlay = Boolean(src) && music && playing;

  // One audio element per track; released when the battle screen closes.
  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;
    return () => {
      if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = shouldPlay ? musicVolume : 0;

    const fadeTo = () => {
      if (fadeRef.current !== null) cancelAnimationFrame(fadeRef.current);
      const from = audio.volume;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        audio.volume = from + (target - from) * t;
        if (t < 1) fadeRef.current = requestAnimationFrame(step);
        else {
          fadeRef.current = null;
          if (target === 0) audio.pause();
        }
      };
      fadeRef.current = requestAnimationFrame(step);
    };

    if (!shouldPlay) {
      fadeTo();
      return;
    }

    let retry: (() => void) | null = null;
    const start = () =>
      audio.play().then(fadeTo, () => {
        // Autoplay blocked: try again on the next interaction.
        retry = () => {
          window.removeEventListener("pointerdown", retry!);
          window.removeEventListener("keydown", retry!);
          void start();
        };
        window.addEventListener("pointerdown", retry, { once: true });
        window.addEventListener("keydown", retry, { once: true });
      });
    void start();

    return () => {
      if (retry) {
        window.removeEventListener("pointerdown", retry);
        window.removeEventListener("keydown", retry);
      }
    };
  }, [shouldPlay, musicVolume, src]);
}
