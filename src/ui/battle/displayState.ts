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

/** Keyed by team slot, not species: a team may have the same species twice (Lance). */
export interface SideDisplay {
  active: number | null;
  mons: Record<number, MonDisplay>;
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
  const player: SideDisplay = { active: view.player.active, mons: {} };
  view.player.team.forEach((mon, slot) => {
    player.mons[slot] = {
      species: mon.species,
      hp: mon.hp,
      maxHp: mon.maxHp,
      status: mon.status,
      fainted: mon.fainted,
      boosts: mon.boosts,
    };
  });

  const red: SideDisplay = { active: view.red.active, mons: {} };
  view.red.team.forEach((mon, slot) => {
    if (!mon) return;
    red.mons[slot] = {
      species: mon.species,
      hp: mon.hpPercent,
      maxHp: 100,
      status: mon.status,
      fainted: mon.fainted,
      boosts: mon.boosts,
    };
  });

  return { turn: view.turn, weather: view.weather, player, red };
}

function updateMon(
  state: DisplayState,
  who: { side: BattleSide; slot: number; species: string },
  patch: (mon: MonDisplay) => Partial<MonDisplay>,
): DisplayState {
  const { side, slot, species } = who;
  const current = state[side].mons[slot] ?? { species, hp: 0, maxHp: 100, status: null, fainted: false, boosts: {} };
  return {
    ...state,
    [side]: { ...state[side], mons: { ...state[side].mons, [slot]: { ...current, ...patch(current) } } },
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
      const next = updateMon(state, event, () => ({
        hp: event.hp,
        maxHp: event.maxHp,
        fainted: false,
        boosts: {},
      }));
      const leaving = state[event.side].active;
      const leavingMon = leaving !== null ? state[event.side].mons[leaving] : undefined;
      const cleared =
        leaving !== null && leaving !== event.slot && leavingMon
          ? updateMon(next, { side: event.side, slot: leaving, species: leavingMon.species }, () => ({ boosts: {} }))
          : next;
      return { ...cleared, [event.side]: { ...cleared[event.side], active: event.slot } };
    }
    case "hp":
      return updateMon(state, event, () => ({ hp: event.hp, maxHp: event.maxHp }));
    case "faint":
      return updateMon(state, event, () => ({ hp: 0, fainted: true }));
    case "status":
      return updateMon(state, event, () => ({ status: event.status }));
    case "boost":
      return updateMon(state, event, (mon) => {
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
