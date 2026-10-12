import type { BattleResult } from "./entities";

/** What the player picks each turn. `teamIndex` always refers to the battle's stored team order. */
export type PlayerAction =
  | { type: "move"; move: number }
  | { type: "switch"; teamIndex: number };

export type BattleSide = "player" | "red";

/** One line of battle narration plus the structured data the UI animates from. */
export type BattleEvent =
  | { kind: "turn"; turn: number; text: string }
  | { kind: "switch"; side: BattleSide; species: string; hp: number; maxHp: number; text: string }
  | { kind: "move"; side: BattleSide; species: string; move: string; text: string }
  | { kind: "hp"; side: BattleSide; species: string; hp: number; maxHp: number; change: "damage" | "heal"; text?: string }
  | { kind: "faint"; side: BattleSide; species: string; text: string }
  | { kind: "status"; side: BattleSide; species: string; status: string | null; text: string }
  | { kind: "boost"; side: BattleSide; species: string; stat: string; amount: number; text: string }
  | { kind: "weather"; weather: string | null; text: string }
  | { kind: "message"; text: string }
  | { kind: "end"; winner: BattleSide | null; text: string };

export type Boosts = Partial<Record<"atk" | "def" | "spa" | "spd" | "spe" | "accuracy" | "evasion", number>>;

export interface MoveChoice {
  /** Value to send back as `{ type: "move", move: index }`. */
  index: number;
  name: string;
  type: string;
  pp: number;
  maxPp: number;
  disabled: boolean;
}

export interface PlayerMonView {
  species: string;
  item: string;
  ability: string;
  hp: number;
  maxHp: number;
  status: string | null;
  fainted: boolean;
  boosts: Boosts;
  moves: Omit<MoveChoice, "index" | "disabled">[];
}

/** Red's Pokémon as the player is allowed to see them: HP as a percentage, unrevealed ones hidden. */
export interface RedMonView {
  species: string;
  hpPercent: number;
  status: string | null;
  fainted: boolean;
  boosts: Boosts;
}

export type BattlePhase = "move" | "switch" | "ended";

export interface BattleView {
  turn: number;
  phase: BattlePhase;
  weather: string | null;
  player: {
    /** Team index of the Pokémon on the field. */
    active: number;
    team: PlayerMonView[];
  };
  red: {
    active: number | null;
    /** In Red's team order; `null` until that Pokémon has been sent out. */
    team: (RedMonView | null)[];
  };
  choices: {
    moves: MoveChoice[];
    /** Team indexes the player may switch to right now. */
    switches: number[];
  };
}

/** Engine-level outcome, before it is stamped with a date and stored. */
export type BattleOutcome = Omit<BattleResult, "date" | "abandoned">;
