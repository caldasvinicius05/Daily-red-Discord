"use client";

import { useEffect, useRef } from "react";
import styles from "./Background.module.css";

/** Falling snow on a canvas. Pauses when the tab is hidden and respects reduced motion. */
export function Snowfall({ density = 90, className }: { density?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const flakes = Array.from({ length: density }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 2.2,
      speed: 0.25 + Math.random() * 0.9,
      drift: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        f.y += f.speed;
        f.drift += 0.01;
        f.x += Math.sin(f.drift) * 0.35;
        if (f.y > height + 4) {
          f.y = -4;
          f.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243, 247, 255, ${0.25 + f.r / 4})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={[styles.snow, className].filter(Boolean).join(" ")} aria-hidden="true" />;
}

/**
 * Night sky over snowy ridges: the app's backdrop on every screen.
 * `snow` is turned off during battles, where the arena draws its own and covers this one.
 */
export function Background({ snow = true }: { snow?: boolean }) {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.sky} />
      <div className={styles.stars} />
      <div className={styles.aurora} />
      <svg className={styles.ridges} viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="ridge-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a3d70" />
            <stop offset="1" stopColor="#101a38" />
          </linearGradient>
          <linearGradient id="ridge-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a2850" />
            <stop offset="1" stopColor="#070c1c" />
          </linearGradient>
        </defs>
        <path
          fill="url(#ridge-far)"
          d="M0 300 L120 230 L210 262 L330 150 L420 210 L520 120 L610 190 L720 70 L820 170 L930 110 L1040 200 L1150 140 L1260 220 L1360 170 L1440 210 V420 H0Z"
        />
        <path
          fill="rgba(235,242,255,.85)"
          d="M720 70 L760 118 L742 112 L728 128 L712 108 L694 118 Z M520 120 L548 150 L530 146 L516 158 L505 144 Z M1150 140 L1176 168 L1160 165 L1148 176 L1137 164 Z"
        />
        <path
          fill="url(#ridge-near)"
          d="M0 360 L160 300 L300 340 L440 270 L560 330 L700 260 L860 340 L1000 280 L1140 330 L1300 270 L1440 320 V420 H0Z"
        />
      </svg>
      {snow && <Snowfall />}
      <div className={styles.vignette} />
    </div>
  );
}
