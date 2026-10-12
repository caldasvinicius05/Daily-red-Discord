"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { hashSeed } from "@/domain/rules/random";
import { STAT_LABELS, STATUS_INFO, TYPE_NAMES_PT, typeColor, typeTextColor } from "../lib/types";
import { TypeIcon } from "./TypeIcon";
import styles from "./ui.module.css";

const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

// ---------- Logo ----------

/** Original mark: a snow-capped peak under a red sun. */
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className={cx(styles.logo, styles[`logo-${size}`])}>
      <svg viewBox="0 0 48 40" className={styles.logoMark} aria-hidden="true">
        <circle cx="31" cy="13" r="8" fill="var(--red)" />
        <circle cx="31" cy="13" r="12" fill="var(--red)" opacity=".18" />
        <path d="M2 38 18 10l7 12 4-6 17 22z" fill="#2c3f75" />
        <path d="m18 10 5.6 9.6-3.2-1.6-2.4 3-2.2-2.4-3 1.4z" fill="var(--snow)" />
        <path d="m29 16 3.6 4.9-2.1-.7-1.5 1.6-1.2-1.4z" fill="var(--snow)" opacity=".85" />
      </svg>
      <div className={styles.logoText}>
        <span className={cx("logo-font", styles.logoDaily)}>DAILY</span>
        <span className={cx("logo-font", styles.logoRed)}>RED</span>
      </div>
    </div>
  );
}

// ---------- Buttons ----------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg"; icon?: ReactNode }) {
  return (
    <button className={cx(styles.button, styles[variant], styles[`size-${size}`], className)} {...props}>
      {icon && <span className={styles.buttonIcon}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// ---------- Badges ----------

export function TypeBadge({ type, compact = false }: { type: string; compact?: boolean }) {
  return (
    <span
      className={cx(styles.typeBadge, compact && styles.typeBadgeCompact)}
      style={{ background: typeColor(type), color: typeTextColor(type) }}
      title={TYPE_NAMES_PT[type] ?? type}
    >
      <TypeIcon type={type} className={styles.typeBadgeIcon} />
      {!compact && <span>{TYPE_NAMES_PT[type] ?? type}</span>}
    </span>
  );
}

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const info = STATUS_INFO[status];
  if (!info) return null;
  return (
    <span className={cx(styles.statusBadge, "pixel")} style={{ background: info.color }} title={info.name}>
      {info.label}
    </span>
  );
}

// ---------- HP bar ----------

function useAnimatedNumber(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const v = Math.round(from + (target - from) * eased);
      setValue(v);
      fromRef.current = v;
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

export function hpTone(ratio: number): "high" | "mid" | "low" {
  if (ratio > 0.5) return "high";
  if (ratio > 0.2) return "mid";
  return "low";
}

/** Game-style HP bar: green → yellow under 50% → red under 20%, with a lagging "damage" trail. */
export function HpBar({ hp, maxHp, showNumbers = false }: { hp: number; maxHp: number; showNumbers?: boolean }) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const shown = useAnimatedNumber(hp);
  return (
    <div className={styles.hp}>
      <div className={styles.hpRow}>
        <span className={cx(styles.hpLabel, "pixel")}>HP</span>
        <div className={styles.hpTrack}>
          <div className={styles.hpTrail} style={{ width: `${ratio * 100}%` }} />
          <div className={cx(styles.hpFill, styles[`hp-${hpTone(ratio)}`])} style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>
      {showNumbers && (
        <div className={cx(styles.hpNumbers, "pixel")}>
          {shown}
          <span>/{maxHp}</span>
        </div>
      )}
    </div>
  );
}

// ---------- Stat hexagon ----------

const HEX_ORDER = ["hp", "atk", "def", "spe", "spd", "spa"] as const;

/** Base stats as a hexagon (like the summary screens of later games). Scaled to 160. */
export function StatHexagon({ stats, color, size = 120 }: { stats: Record<string, number>; color: string; size?: number }) {
  const r = 38;
  const point = (i: number, scale: number) => {
    const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    return [50 + r * scale * Math.cos(a), 50 + r * scale * Math.sin(a)] as const;
  };
  const outline = HEX_ORDER.map((_, i) => point(i, 1).join(",")).join(" ");
  const shape = HEX_ORDER.map((k, i) => point(i, Math.min(1, (stats[k] ?? 0) / 160)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={styles.hex} role="img" aria-label="Atributos base">
      {[0.33, 0.66, 1].map((s) => (
        <polygon key={s} points={HEX_ORDER.map((_, i) => point(i, s).join(",")).join(" ")} className={styles.hexGrid} />
      ))}
      <polygon points={outline} className={styles.hexOutline} />
      <polygon points={shape} fill={color} fillOpacity="0.45" stroke={color} strokeWidth="1.6" />
      {HEX_ORDER.map((k, i) => {
        const [x, y] = point(i, 1.27);
        return (
          <text key={k} x={x} y={y} className={styles.hexLabel} textAnchor="middle" dominantBaseline="middle">
            {STAT_LABELS[k]} {stats[k]}
          </text>
        );
      })}
    </svg>
  );
}

// ---------- Avatar ----------

export function Avatar({ id, name, avatar, size = 36 }: { id: string; name: string; avatar: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const hue = hashSeed(id) % 360;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const url = avatar && /^\d+$/.test(id) ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=64` : null;

  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 50) % 360} 70% 40%))` }}
    >
      {url && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" onError={() => setBroken(true)} />
      ) : (
        <span style={{ fontSize: size * 0.38 }}>{initials}</span>
      )}
    </span>
  );
}

// ---------- Misc ----------

export function Spinner({ label }: { label?: string }) {
  return (
    <div className={styles.spinnerWrap} role="status">
      <div className={styles.spinner}>
        <span />
        <span />
        <span />
      </div>
      {label && <p className={styles.spinnerLabel}>{label}</p>}
    </div>
  );
}

export function Panel({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx(styles.panel, className)}>
      {(title || action) && (
        <header className={styles.panelHeader}>
          {title && <h2 className={styles.panelTitle}>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Modal({ children, onClose, labelledBy }: { children: ReactNode; onClose?: () => void; labelledBy?: string }) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export { cx };
