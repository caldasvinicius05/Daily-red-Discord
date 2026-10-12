import type { BattleResult } from "./entities";

/** What the player picks each turn. `teamIndex` always refers to the battle's stored team order. */
export type PlayerAction =
  | { type: "move"; move: number }
  | { type: "switch"; teamIndex: number };

export type BattleSide = "player" | "red";

/** Lets the battle log group narration lines: hit results, items, abilities, lasting effects, status. */
export type MessageTag = "hit" | "item" | "ability" | "effect" | "status";

export type HpSource = "item" | "status" | "weather" | "recoil" | "drain" | "effect";

/**
 * Identifies one Pokémon in a battle. `slot` is its index in that side's team, so two
 * of the same species (Lance's Dragonite) are never confused; `species` is for display.
 */
interface Who {
  side: BattleSide;
  slot: number;
  species: string;
}

/** One line of battle narration plus the structured data the UI animates from. */
export type BattleEvent =
  | { kind: "turn"; turn: number; text: string }
  | ({ kind: "switch"; hp: number; maxHp: number; text: string } & Who)
  | ({ kind: "move"; move: string; text: string } & Who)
  | ({
      kind: "hp";
      hp: number;
      maxHp: number;
      change: "damage" | "heal";
      text?: string;
      /** What caused it when it isn't the last move: an item, poison, weather, recoil... */
      source?: HpSource;
    } & Who)
  | ({ kind: "faint"; text: string } & Who)
  | ({ kind: "status"; status: string | null; text: string } & Who)
  | ({ kind: "boost"; stat: string; amount: number; text: string } & Who)
  | { kind: "weather"; weather: string | null; text: string }
  | { kind: "message"; text: string; tag?: MessageTag }
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
