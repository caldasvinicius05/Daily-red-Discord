import { calculate, Field, Generations, Move, Pokemon as CalcPokemon } from "@smogon/calc";
import type { Battle, Pokemon } from "pokemon-showdown";
import { GEN } from "./generation";
import { isForcedSwitch, moveOptions } from "./requests";

const gen = Generations.get(GEN);

const WEATHER: Record<string, "Sand" | "Rain" | "Sun" | "Hail"> = {
  sandstorm: "Sand",
  raindance: "Rain",
  sunnyday: "Sun",
  hail: "Hail",
};

const SLEEP_MOVES = new Set(["spore", "sleeppowder", "hypnosis", "darkvoid", "lovelykiss", "sing", "grasswhistle"]);
const HEAL_MOVES = new Set(["morningsun", "recover", "softboiled", "synthesis", "moonlight", "roost", "slackoff", "milkdrink", "healorder"]);
const SELF_KO_MOVES = new Set(["selfdestruct", "explosion"]);

function toCalc(p: Pokemon): CalcPokemon {
  const { atk, def, spa, spd, spe } = p.boosts;
  return new CalcPokemon(gen, p.species.name, {
    level: p.level,
    item: (p.getItem().name || undefined) as never,
    ability: (p.getAbility().name || undefined) as never,
    nature: p.set.nature as never,
    evs: p.set.evs,
    ivs: p.set.ivs,
    boosts: { atk, def, spa, spd, spe },
    curHP: p.hp,
    status: (p.status || "") as never,
  });
}

function field(battle: Battle): Field {
  const weather = WEATHER[battle.field.weather];
  return new Field(weather ? { weather } : {});
}

/** Expected damage of a move as a fraction of the target's current HP (capped at 1), plus whether it surely KOs. */
function damage(battle: Battle, attacker: Pokemon, defender: Pokemon, moveName: string) {
  let min = 0;
  let max = 0;
  try {
    [min, max] = calculate(gen, toCalc(attacker), toCalc(defender), new Move(gen, moveName), field(battle)).range();
  } catch {
    // The calc doesn't know some rare combinations; better a weak guess than a crashed battle.
    return { fraction: 0, surelyKOs: false };
  }
  const avg = (min + max) / 2;
  // A fainted defender (both sides went down in the same turn) has 0 HP: nothing to score.
  if (defender.hp <= 0) return { fraction: 0, surelyKOs: false };
  return { fraction: Math.min(avg, defender.hp) / defender.hp, surelyKOs: min >= defender.hp };
}

function hpRatio(p: Pokemon): number {
  return p.hp / p.maxhp;
}

function isFaster(a: Pokemon, b: Pokemon): boolean {
  return a.getStat("spe") > b.getStat("spe");
}

/** Score in roughly 0–200: higher is better. Damage moves score by expected % of the target's HP. */
function scoreMove(battle: Battle, self: Pokemon, foe: Pokemon, moveId: string): number {
  const move = battle.dex.moves.get(moveId);
  const accuracy = move.accuracy === true ? 1 : move.accuracy / 100;

  if (move.category !== "Status") {
    const { fraction, surelyKOs } = damage(battle, self, foe, move.name);
    let score = fraction * 100 * accuracy;
    if (surelyKOs) score += 100 * accuracy;
    // Priority finishes the job before a faster foe can hit back.
    if (surelyKOs && move.priority > 0 && !isFaster(self, foe)) score += 50;
    if (SELF_KO_MOVES.has(move.id)) score *= hpRatio(self) < 0.35 ? 1 : 0.1;
    return score;
  }

  const foeHealthy = !foe.status && !foe.volatiles["substitute"];
  if (move.id === "thunderwave") {
    const immune = foe.hasType("Ground") || ["Volt Absorb", "Limber"].includes(foe.getAbility().name);
    return foeHealthy && !immune ? (isFaster(foe, self) ? 55 : 30) * accuracy : 0;
  }
  if (SLEEP_MOVES.has(move.id)) {
    const immune = ["Insomnia", "Vital Spirit"].includes(foe.getAbility().name);
    return foeHealthy && !immune ? 60 * accuracy : 0;
  }
  if (move.id === "toxic") {
    return foeHealthy && !foe.hasType("Poison") && !foe.hasType("Steel") ? 35 : 0;
  }
  if (move.id === "calmmind" || move.id === "bulkup" || move.id === "swordsdance" || move.id === "dragondance") {
    const stat = move.id === "bulkup" || move.id === "swordsdance" || move.id === "dragondance" ? "atk" : "spa";
    return hpRatio(self) > 0.6 && self.boosts[stat] < 2 ? 40 : 0;
  }
  if (HEAL_MOVES.has(move.id)) {
    return hpRatio(self) < 0.45 ? 70 : 0;
  }
  return 5;
}

/**
 * Chooses Red's command for this decision point (Showdown choice string).
 * Red never switches voluntarily; when one of his Pokémon faints he sends out
 * whichever remaining Pokémon hits the player's active Pokémon hardest.
 * `random` breaks near-ties so he isn't perfectly predictable, but stays deterministic.
 */
export function chooseRedAction(battle: Battle, random: () => number): string {
  const red = battle.p2;
  const foe = battle.p1.active[0];
  if (isForcedSwitch(red)) {
    let best: { position: number; score: number } | null = null;
    for (const [position, mon] of red.pokemon.entries()) {
      if (mon.isActive || mon.fainted) continue;
      // If the player's Pokémon also fainted there is nothing to aim at: keep team order.
      const score =
        foe && !foe.fainted ? Math.max(...mon.moveSlots.map((slot) => scoreMove(battle, mon, foe, slot.id))) : 0;
      if (!best || score > best.score) best = { position, score };
    }
    if (!best) throw new Error("Red has no Pokémon left to send out");
    return `switch ${best.position + 1}`;
  }

  const self = red.active[0]!;
  let best = { index: 0, score: -Infinity };
  moveOptions(red).forEach((option, index) => {
    if (option.disabled || option.pp === 0) return;
    const base = foe ? scoreMove(battle, self, foe, option.id) : 0;
    const score = base + random() * 8;
    if (score > best.score) best = { index, score };
  });
  return `move ${best.index + 1}`;
}
