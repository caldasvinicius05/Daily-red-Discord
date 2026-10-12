import { Battle, Dex, type Pokemon } from "pokemon-showdown";
import type { BattleEngine, BattleSetup, BattleSnapshot } from "@/application/ports";
import { InvalidActionError } from "@/application/errors";
import {
  RED_TEAM,
  type BattleEvent,
  type BattleOutcome,
  type BattleView,
  type Boosts,
  type PlayerAction,
  type PokemonSet,
} from "@/domain";
import { createRandom, hashSeed } from "@/domain/rules/random";
import { translateLog, toPercent } from "./logParser";
import { chooseRedAction } from "./redAI";
import { isForcedSwitch, moveOptions } from "./requests";
import { toShowdownSet } from "./teams";

const FORMAT = "gen3customgame";
const PLAYER_NAME = "Jogador";
const RED_NAME = "Red";
/** Safety net against stalemates (e.g. both sides only able to heal). */
const MAX_TURNS = 300;

/** Our seed string → Showdown's sodium PRNG seed (32 hex chars). */
function toShowdownSeed(seed: string) {
  const hex = [0, 1, 2, 3].map((i) => hashSeed(`${seed}#${i}`).toString(16).padStart(8, "0")).join("");
  return `sodium,${hex}` as const;
}

/** Puts the chosen lead first; Showdown always sends out slot 1. */
function battleOrder(team: readonly PokemonSet[], leadIndex: number): PokemonSet[] {
  return [team[leadIndex]!, ...team.filter((_, i) => i !== leadIndex)];
}

function needsChoice(side: Battle["p1"]): boolean {
  return side.requestState !== "" && !side.isChoiceDone();
}

function boostsOf(p: Pokemon): Boosts {
  return Object.fromEntries(Object.entries(p.boosts).filter(([, v]) => v !== 0));
}

export class ShowdownBattleEngine implements BattleEngine {
  simulate(setup: BattleSetup, actions: readonly PlayerAction[]): BattleSnapshot {
    const { team, leadIndex } = setup;
    if (!Number.isInteger(leadIndex) || leadIndex < 0 || leadIndex >= team.length) {
      throw new InvalidActionError("Pokémon inicial inválido");
    }

    const battle = new Battle({ formatid: FORMAT as never, seed: toShowdownSeed(setup.seed) });
    battle.setPlayer("p1", { name: PLAYER_NAME, team: battleOrder(team, leadIndex).map(toShowdownSet) });
    battle.setPlayer("p2", { name: RED_NAME, team: RED_TEAM.map(toShowdownSet) });

    // Red's decisions get their own RNG stream so they don't disturb Showdown's.
    const aiRandom = createRandom(`${setup.seed}:red-ai`);
    let logCursor = 0;
    const takeEvents = (): BattleEvent[] => {
      const lines = battle.log.slice(logCursor);
      logCursor = battle.log.length;
      return translateLog(lines);
    };
    const letRedAct = () => {
      while (!battle.ended && needsChoice(battle.p2)) {
        if (!battle.choose("p2", chooseRedAction(battle, aiRandom))) {
          throw new Error(`Red AI made an invalid choice: ${battle.p2.choice.error}`);
        }
      }
    };

    letRedAct();
    const steps: BattleEvent[][] = [takeEvents()];

    actions.forEach((action, i) => {
      if (battle.ended) throw new InvalidActionError("A batalha já terminou");
      if (!needsChoice(battle.p1)) throw new InvalidActionError("Não é a sua vez");
      const command = this.toCommand(battle, team, action);
      if (!battle.choose("p1", command)) {
        throw new InvalidActionError(`Ação ${i + 1} inválida: ${battle.p1.choice.error}`);
      }
      letRedAct();
      if (!battle.ended && battle.turn > MAX_TURNS) battle.tie();
      steps.push(takeEvents());
    });

    const revealed = new Set(
      steps.flat().flatMap((e) => (e.kind === "switch" && e.side === "red" ? [e.species] : [])),
    );
    return {
      view: this.buildView(battle, team, revealed),
      steps,
      outcome: battle.ended ? this.buildOutcome(battle, team) : null,
    };
  }

  private toCommand(battle: Battle, team: readonly PokemonSet[], action: PlayerAction): string {
    if (action.type === "move") {
      const options = moveOptions(battle.p1);
      if (!Number.isInteger(action.move) || !options[action.move]) throw new InvalidActionError("Golpe inválido");
      return `move ${action.move + 1}`;
    }
    const species = team[action.teamIndex]?.species;
    const position = battle.p1.pokemon.findIndex((p) => p.set.name === species);
    if (position < 0) throw new InvalidActionError("Pokémon inválido para troca");
    return `switch ${position + 1}`;
  }

  private findPlayerMon(battle: Battle, species: string): Pokemon {
    return battle.p1.pokemon.find((p) => p.set.name === species)!;
  }

  private buildView(battle: Battle, team: readonly PokemonSet[], revealed: Set<string>): BattleView {
    const phase = battle.ended ? "ended" : isForcedSwitch(battle.p1) ? "switch" : "move";
    const activeSpecies = battle.p1.active[0]?.set.name;

    const playerTeam = team.map((set) => {
      const p = this.findPlayerMon(battle, set.species);
      return {
        species: set.species,
        item: p.getItem().name,
        ability: p.getAbility().name,
        hp: p.hp,
        maxHp: p.maxhp,
        status: p.status || null,
        fainted: p.fainted,
        boosts: boostsOf(p),
        moves: p.moveSlots.map((slot) => ({
          name: slot.move,
          type: Dex.forGen(3).moves.get(slot.id).type,
          pp: slot.pp,
          maxPp: slot.maxpp,
        })),
      };
    });

    const options = phase === "move" ? moveOptions(battle.p1) : [];
    const moves = options.map((option, index) => {
      const slot = battle.p1.active[0]?.moveSlots.find((s) => s.id === option.id);
      return {
        index,
        name: option.move,
        type: Dex.forGen(3).moves.get(option.id).type,
        pp: slot?.pp ?? 0,
        maxPp: slot?.maxpp ?? 0,
        disabled: Boolean(option.disabled),
      };
    });

    const switches =
      phase === "ended"
        ? []
        : team.flatMap((set, i) => {
            const p = this.findPlayerMon(battle, set.species);
            return !p.fainted && set.species !== activeSpecies ? [i] : [];
          });

    const redActive = battle.p2.active[0];
    return {
      turn: battle.turn,
      phase,
      weather: battle.field.weather ? battle.field.getWeather().name : null,
      player: {
        active: team.findIndex((set) => set.species === activeSpecies),
        team: playerTeam,
      },
      red: {
        active: redActive ? RED_TEAM.findIndex((set) => set.species === redActive.set.name) : null,
        team: RED_TEAM.map((set) => {
          if (!revealed.has(set.species)) return null;
          const p = battle.p2.pokemon.find((mon) => mon.set.name === set.species)!;
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

  private buildOutcome(battle: Battle, team: readonly PokemonSet[]): BattleOutcome {
    return {
      won: battle.winner === PLAYER_NAME,
      turns: battle.turn,
      playerAlive: team.map((set) => !this.findPlayerMon(battle, set.species).fainted),
      redFainted: RED_TEAM.map((set) => battle.p2.pokemon.find((p) => p.set.name === set.species)!.fainted),
    };
  }
}
