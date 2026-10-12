/** Calendar day of the game in `YYYY-MM-DD` form, always in the game's fixed time zone. */
export type GameDate = string;

export type StatName = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type StatSpread = Record<StatName, number>;

/** One Pokémon as we author it. Shape mirrors a Showdown set so the engine can consume it directly. */
export interface PokemonSet {
  species: string;
  item: string;
  ability: string;
  nature: string;
  evs: Partial<StatSpread>;
  moves: [string, string, string, string];
}

export type Team = PokemonSet[];

export interface DailyChallenge {
  date: GameDate;
  /** Sequential puzzle number, starting at 1 on the launch date. */
  number: number;
  team: Team;
}

export type BattleMode = "daily" | "practice";

export interface BattleResult {
  date: GameDate;
  won: boolean;
  turns: number;
  /** Per player slot: true if that Pokémon was still standing at the end. */
  playerAlive: boolean[];
  /** Per Red slot: true if that Pokémon was knocked out. */
  redFainted: boolean[];
  /** The player left before the battle ended; counts as a loss. */
  abandoned: boolean;
}

export interface PlayerStats {
  played: number;
  wins: number;
  winRate: number;
  winStreak: number;
  bestWinStreak: number;
  dayStreak: number;
}
