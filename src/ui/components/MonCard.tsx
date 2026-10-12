"use client";

import type { PokemonSet } from "@/domain";
import { useApp } from "../AppContext";
import { formatDex } from "../lib/format";
import { CATEGORY_PT, typeColor, typeTextColor } from "../lib/types";
import styles from "./MonCard.module.css";
import { PokemonEmblem } from "./PokemonEmblem";
import { CategoryIcon, TypeIcon } from "./TypeIcon";
import { cx, StatHexagon, TypeBadge } from "./ui";

interface Props {
  set: PokemonSet;
  /** "full": home screen card with stats. "pick": selectable card on the lead screen. */
  variant?: "full" | "pick";
  selected?: boolean;
  onSelect?: () => void;
  index?: number;
}

export function MonCard({ set, variant = "full", selected = false, onSelect, index = 0 }: Props) {
  const { reference } = useApp();
  const info = reference.species[set.species];
  const types = info?.types ?? ["Normal"];
  const c1 = typeColor(types[0]);
  const c2 = typeColor(types[1] ?? types[0]);
  const Tag = onSelect ? "button" : "article";

  return (
    <Tag
      className={cx(styles.card, styles[variant], selected && styles.selected)}
      style={{ ["--c1" as string]: c1, ["--c2" as string]: c2, animationDelay: `${index * 60}ms` }}
      {...(onSelect ? { onClick: onSelect, type: "button" as const, "aria-pressed": selected } : {})}
    >
      <div className={styles.glow} />
      {selected && <span className={cx(styles.leadTag, "pixel")}>NA FRENTE</span>}

      <header className={styles.header}>
        <PokemonEmblem species={set.species} types={types} size={variant === "full" ? 92 : 78} still />
        <div className={styles.identity}>
          <span className={cx(styles.dex, "pixel")}>{info ? formatDex(info.num) : ""}</span>
          <h3 className={styles.name}>{set.species}</h3>
          <div className={styles.types}>
            {types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        </div>
      </header>

      <dl className={styles.details}>
        <div title={reference.items[set.item]}>
          <dt>Item</dt>
          <dd>
            <span className={styles.itemGem} />
            {set.item}
          </dd>
        </div>
        <div title={reference.abilities[set.ability]}>
          <dt>Habilidade</dt>
          <dd>{set.ability}</dd>
        </div>
      </dl>

      <ul className={styles.moves}>
        {set.moves.map((move) => {
          const m = reference.moves[move];
          const type = m?.type ?? "Normal";
          return (
            <li
              key={move}
              className={styles.move}
              style={{ background: typeColor(type), color: typeTextColor(type) }}
              title={m ? `${CATEGORY_PT[m.category]} · Poder ${m.power || "—"} · Precisão ${m.accuracy === true ? "—" : `${m.accuracy}%`}\n${m.description}` : move}
            >
              <TypeIcon type={type} className={styles.moveIcon} />
              <span className={styles.moveName}>{move}</span>
              {m && <CategoryIcon category={m.category} className={styles.moveCat} />}
            </li>
          );
        })}
      </ul>

      {variant === "full" && info && (
        <div className={styles.stats}>
          <StatHexagon stats={info.baseStats} color={c1} size={150} />
          <div className={styles.bst}>
            <span>{Object.values(info.baseStats).reduce((a, b) => a + b, 0)}</span>
            <small>total base</small>
          </div>
        </div>
      )}
    </Tag>
  );
}
