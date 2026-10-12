import { Battle, Dex, type Pokemon } from "pokemon-showdown";
import type { BattleEngine, BattleSetup, BattleSnapshot } from "@/application/ports";
import { InvalidActionError } from "@/application/errors";
import {
  getChampion,
  type BattleEvent,
  type BattleOutcome,
  type BattleView,
  type Boosts,
  type PlayerAction,
  type PokemonSet,
} from "@/domain";
import { createRandom, hashSeed } from "@/domain/rules/random";
import { slotFromNickname, slotNickname, translateLog, toPercent, type LogContext } from "./logParser";
import { chooseRedAction } from "./redAI";
import { isForcedSwitch, moveOptions } from "./requests";
import { toShowdownSet } from "./teams";

const FORMAT = "gen3customgame";
const PLAYER_NAME = "Jogador";
/** Safety net against stalemates (e.g. both sides only able to heal). */
const MAX_TURNS = 300;

/** Our seed string → Showdown's sodium PRNG seed (32 hex chars). */
function toShowdownSeed(seed: string) {
  const hex = [0, 1, 2, 3].map((i) => hashSeed(`${seed}#${i}`).toString(16).padStart(8, "0")).join("");
  return `sodium,${hex}` as const;
}

/** Showdown sets in battle order (the chosen lead first), each nicknamed by its original slot. */
function battleOrder(team: readonly PokemonSet[], leadIndex: number) {
  const sets = team.map((set, slot) => toShowdownSet(set, slot));
  return [sets[leadIndex]!, ...sets.filter((_, i) => i !== leadIndex)];
}

function needsChoice(side: Battle["p1"]): boolean {
  return side.requestState !== "" && !side.isChoiceDone();
}

function boostsOf(p: Pokemon): Boosts {
  return Object.fromEntries(Object.entries(p.boosts).filter(([, v]) => v !== 0));
}

/** The Pokémon of a side that was in `slot` of its team, whatever its current position. */
function bySlot(side: Battle["p1"], slot: number): Pokemon {
  return side.pokemon.find((p) => p.set.name === slotNickname(slot))!;
}

function slotOf(p: Pokemon | undefined | null): number | null {
  return p ? slotFromNickname(p.set.name) : null;
}

export class ShowdownBattleEngine implements BattleEngine {
  simulate(setup: BattleSetup, actions: readonly PlayerAction[]): BattleSnapshot {
    const { team, leadIndex } = setup;
    if (!Number.isInteger(leadIndex) || leadIndex < 0 || leadIndex >= team.length) {
      throw new InvalidActionError("Pokémon inicial inválido");
    }
    const champion = getChampion(setup.championId);

    const battle = new Battle({ formatid: FORMAT as never, seed: toShowdownSeed(setup.seed) });
    battle.setPlayer("p1", { name: PLAYER_NAME, team: battleOrder(team, leadIndex) });
    battle.setPlayer("p2", { name: champion.name, team: battleOrder(champion.team, 0) });

    const logContext: LogContext = {
      roster: { player: team.map((s) => s.species), red: champion.team.map((s) => s.species) },
      championName: champion.name,
      playerName: PLAYER_NAME,
    };

    // The champion's decisions get their own RNG stream so they don't disturb Showdown's.
    const aiRandom = createRandom(`${setup.seed}:red-ai`);
    let logCursor = 0;
    const takeEvents = (): BattleEvent[] => {
      const lines = battle.log.slice(logCursor);
      logCursor = battle.log.length;
      return translateLog(lines, logContext);
    };
    const letChampionAct = () => {
      while (!battle.ended && needsChoice(battle.p2)) {
        if (!battle.choose("p2", chooseRedAction(battle, aiRandom))) {
          throw new Error(`Champion AI made an invalid choice: ${battle.p2.choice.error}`);
        }
      }
    };

    letChampionAct();
    const steps: BattleEvent[][] = [takeEvents()];

    actions.forEach((action, i) => {
      if (battle.ended) throw new InvalidActionError("A batalha já terminou");
      if (!needsChoice(battle.p1)) throw new InvalidActionError("Não é a sua vez");
      const command = this.toCommand(battle, team, action);
      if (!battle.choose("p1", command)) {
        throw new InvalidActionError(`Ação ${i + 1} inválida: ${battle.p1.choice.error}`);
      }
      letChampionAct();
      if (!battle.ended && battle.turn > MAX_TURNS) battle.tie();
      steps.push(takeEvents());
    });

    const revealed = new Set(steps.flat().flatMap((e) => (e.kind === "switch" && e.side === "red" ? [e.slot] : [])));
    return {
      view: this.buildView(battle, team, champion.team, revealed),
      steps,
      outcome: battle.ended ? this.buildOutcome(battle, team, champion.team) : null,
    };
  }

  private toCommand(battle: Battle, team: readonly PokemonSet[], action: PlayerAction): string {
    if (action.type === "move") {
      const options = moveOptions(battle.p1);
      if (!Number.isInteger(action.move) || !options[action.move]) throw new InvalidActionError("Golpe inválido");
      return `move ${action.move + 1}`;
    }
    if (!Number.isInteger(action.teamIndex) || !team[action.teamIndex]) throw new InvalidActionError("Pokémon inválido para troca");
    const position = battle.p1.pokemon.findIndex((p) => p.set.name === slotNickname(action.teamIndex));
    if (position < 0) throw new InvalidActionError("Pokémon inválido para troca");
    return `switch ${position + 1}`;
  }

  private buildView(
    battle: Battle,
    team: readonly PokemonSet[],
    championTeam: readonly PokemonSet[],
    revealed: Set<number>,
  ): BattleView {
    const phase = battle.ended ? "ended" : isForcedSwitch(battle.p1) ? "switch" : "move";
    const activeSlot = slotOf(battle.p1.active[0]);

    const playerTeam = team.map((set, slot) => {
      const p = bySlot(battle.p1, slot);
      return {
        species: set.species,
        item: p.getItem().name,
        ability: p.getAbility().name,
        hp: p.hp,
        maxHp: p.maxhp,
        status: p.status || null,
        fainted: p.fainted,
        boosts: boostsOf(p),
        moves: p.moveSlots.map((moveSlot) => ({
          name: moveSlot.move,
          type: Dex.forGen(3).moves.get(moveSlot.id).type,
          pp: moveSlot.pp,
          maxPp: moveSlot.maxpp,
        })),
      };
    });

    const options = phase === "move" ? moveOptions(battle.p1) : [];
    const moves = options.map((option, index) => {
      const moveSlot = battle.p1.active[0]?.moveSlots.find((s) => s.id === option.id);
      return {
        index,
        name: option.move,
        type: Dex.forGen(3).moves.get(option.id).type,
        pp: moveSlot?.pp ?? 0,
        maxPp: moveSlot?.maxpp ?? 0,
        disabled: Boolean(option.disabled),
      };
    });

    const switches =
      phase === "ended" ? [] : team.flatMap((_, slot) => (!bySlot(battle.p1, slot).fainted && slot !== activeSlot ? [slot] : []));

    return {
      turn: battle.turn,
      phase,
      weather: battle.field.weather ? battle.field.getWeather().name : null,
      player: { active: activeSlot ?? 0, team: playerTeam },
      red: {
        active: slotOf(battle.p2.active[0]),
        team: championTeam.map((set, slot) => {
          if (!revealed.has(slot)) return null;
          const p = bySlot(battle.p2, slot);
          return {
            species: set.species,
            hpPercent: toPercent(p.hp, p.maxhp),
            status: p.status || null,
            fainted: p.fainted,
            boosts: boostsOf(p),
          };
        }),
      },
      choices: { moves, switches },
    };
  }

  private buildOutcome(battle: Battle, team: readonly PokemonSet[], championTeam: readonly PokemonSet[]): BattleOutcome {
    return {
      won: battle.winner === PLAYER_NAME,
      turns: battle.turn,
      playerAlive: team.map((_, slot) => !bySlot(battle.p1, slot).fainted),
      redFainted: championTeam.map((_, slot) => bySlot(battle.p2, slot).fainted),
    };
  }
}
