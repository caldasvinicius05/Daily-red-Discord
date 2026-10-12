import type { BattleEvent, BattleSide, BattleView, Boosts } from "@/domain";

/** What is currently drawn on screen. Advanced event by event while a turn plays out. */
export interface MonDisplay {
  species: string;
  hp: number;
  maxHp: number;
  status: string | null;
  fainted: boolean;
  boosts: Boosts;
}

export interface SideDisplay {
  active: string | null;
  mons: Record<string, MonDisplay>;
}

export interface DisplayState {
  turn: number;
  weather: string | null;
  player: SideDisplay;
  red: SideDisplay;
}

export const EMPTY_DISPLAY: DisplayState = {
  turn: 0,
  weather: null,
  player: { active: null, mons: {} },
  red: { active: null, mons: {} },
};

/** Authoritative state after a turn (also used when reopening a battle). */
export function displayFromView(view: BattleView): DisplayState {
  const player: SideDisplay = { active: view.player.team[view.player.active]?.species ?? null, mons: {} };
  for (const mon of view.player.team) {
    player.mons[mon.species] = {
      species: mon.species,
      hp: mon.hp,
      maxHp: mon.maxHp,
      status: mon.status,
      fainted: mon.fainted,
      boosts: mon.boosts,
    };
  }

  const red: SideDisplay = { active: null, mons: {} };
  view.red.team.forEach((mon, i) => {
    if (!mon) return;
    red.mons[mon.species] = {
      species: mon.species,
      hp: mon.hpPercent,
      maxHp: 100,
      status: mon.status,
      fainted: mon.fainted,
      boosts: mon.boosts,
    };
    if (view.red.active === i) red.active = mon.species;
  });

  return { turn: view.turn, weather: view.weather, player, red };
}

function updateMon(state: DisplayState, side: BattleSide, species: string, patch: (mon: MonDisplay) => Partial<MonDisplay>): DisplayState {
  const current = state[side].mons[species] ?? { species, hp: 0, maxHp: 100, status: null, fainted: false, boosts: {} };
  return {
    ...state,
    [side]: { ...state[side], mons: { ...state[side].mons, [species]: { ...current, ...patch(current) } } },
  };
}

/** Pure reducer: the screen after one event. */
export function applyEvent(state: DisplayState, event: BattleEvent): DisplayState {
  switch (event.kind) {
    case "turn":
      return { ...state, turn: event.turn };
    case "weather":
      return { ...state, weather: event.weather };
    case "switch": {
      // Switching out clears stat changes, like in the games.
      const next = updateMon(state, event.side, event.species, () => ({
        hp: event.hp,
        maxHp: event.maxHp,
        fainted: false,
        boosts: {},
      }));
      const leaving = state[event.side].active;
      const cleared = leaving && leaving !== event.species ? updateMon(next, event.side, leaving, () => ({ boosts: {} })) : next;
      return { ...cleared, [event.side]: { ...cleared[event.side], active: event.species } };
    }
    case "hp":
      return updateMon(state, event.side, event.species, () => ({ hp: event.hp, maxHp: event.maxHp }));
    case "faint":
      return updateMon(state, event.side, event.species, () => ({ hp: 0, fainted: true }));
    case "status":
      return updateMon(state, event.side, event.species, () => ({ status: event.status }));
    case "boost":
      return updateMon(state, event.side, event.species, (mon) => {
        const stat = event.stat as keyof Boosts;
        const value = Math.max(-6, Math.min(6, (mon.boosts[stat] ?? 0) + event.amount));
        const boosts = { ...mon.boosts, [stat]: value };
        if (value === 0) delete boosts[stat];
        return { boosts };
      });
    default:
      return state;
  }
}

/** Visual effect to play on a side's emblem for an event. */
export type Effect = "enter" | "attack" | "hit" | "faint" | "heal" | "status" | "boost" | "drop";

export function effectFor(event: BattleEvent): { side: BattleSide; effect: Effect } | null {
  switch (event.kind) {
    case "switch":
      return { side: event.side, effect: "enter" };
    case "move":
      return { side: event.side, effect: "attack" };
    case "hp":
      return { side: event.side, effect: event.change === "damage" ? "hit" : "heal" };
    case "faint":
      return { side: event.side, effect: "faint" };
    case "status":
      return event.status ? { side: event.side, effect: "status" } : null;
    case "boost":
      return { side: event.side, effect: event.amount >= 0 ? "boost" : "drop" };
    default:
      return null;
  }
}

/**
 * How long each event holds the screen, in ms at normal speed. Kept short: an HP change
 * with no narration only waits for the bar to start moving, so it overlaps the next line.
 */
export function eventDuration(event: BattleEvent): number {
  switch (event.kind) {
    case "turn":
      return 0;
    case "switch":
      return 700;
    case "move":
      return 600;
    case "hp":
      return event.text ? 650 : 280;
    case "faint":
      return 750;
    case "end":
      return 800;
    default:
      return 620;
  }
}
