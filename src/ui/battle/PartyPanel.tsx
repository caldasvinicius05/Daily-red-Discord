"use client";

import type { PlayerMonView } from "@/domain";
import { useSpeciesTypes } from "../AppContext";
import { PokemonEmblem } from "../components/PokemonEmblem";
import { Button, cx, HpBar, Modal, StatusBadge, TypeBadge } from "../components/ui";
import styles from "./battle.module.css";

interface Props {
  team: PlayerMonView[];
  active: number;
  /** Team indexes that can come in right now. */
  allowed: number[];
  /** True after a faint: the player must pick someone. */
  forced: boolean;
  onPick: (teamIndex: number) => void;
  onCancel: () => void;
}

export function PartyPanel({ team, active, allowed, forced, onPick, onCancel }: Props) {
  const typesOf = useSpeciesTypes();
  return (
    <Modal onClose={forced ? undefined : onCancel} labelledBy="party-title">
      <h2 id="party-title" className={styles.partyTitle}>
        {forced ? `${team[active]?.species} não pode continuar! Quem entra?` : "Trocar de Pokémon"}
      </h2>
      {!forced && <p className={styles.partyHint}>Trocar gasta o seu turno.</p>}

      <ul className={styles.partyList}>
        {team.map((mon, i) => {
          const canPick = allowed.includes(i);
          return (
            <li key={mon.species}>
              <button
                className={cx(styles.partyRow, i === active && styles.partyActive, mon.fainted && styles.partyFainted)}
                disabled={!canPick}
                onClick={() => onPick(i)}
              >
                <PokemonEmblem species={mon.species} types={typesOf(mon.species)} size={48} still fainted={mon.fainted} />
                <div className={styles.partyInfo}>
                  <div className={styles.partyName}>
                    <strong>{mon.species}</strong>
                    {i === active && <span className={styles.partyTag}>em campo</span>}
                    {mon.fainted && <span className={cx(styles.partyTag, styles.partyTagDown)}>desmaiado</span>}
                    <StatusBadge status={mon.status} />
                  </div>
                  <div className={styles.partyTypes}>
                    {typesOf(mon.species).map((t) => (
                      <TypeBadge key={t} type={t} compact />
                    ))}
                    <span className={styles.partyItem}>{mon.item}</span>
                  </div>
                </div>
                <div className={styles.partyHp}>
                  <HpBar hp={mon.hp} maxHp={mon.maxHp} showNumbers />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {!forced && (
        <div className={styles.partyActions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      )}
    </Modal>
  );
}
