/** Calendar day of the game in `YYYY-MM-DD` form, always in the game's fixed time zone. */
export type GameDate = string;

export type StatName = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type StatSpread = Record<StatName, number>;

/** One Pokémon's build. Shape mirrors a Showdown set so the engine can consume it directly. */
export interface PokemonSet {
  species: string;
  item: string;
  ability: string;
  nature: string;
  evs: Partial<StatSpread>;
  /** Defaults to 31 everywhere; set when Hidden Power's type depends on them. */
  ivs?: Partial<StatSpread>;
  /** 1–4 moves (a few Pokémon, like Ditto or Unown, only have one). */
  moves: string[];
}

export type Team = PokemonSet[];

/** An opponent at the end of the road. In code the opponent's side is still called "red". */
export interface Champion {
  id: string;
  name: string;
  /** Distinguishes several teams of the same trainer, e.g. "Time 1". */
  variant?: string;
  title: string;
  location: string;
  /** For Portuguese agreement: "da Cynthia", "invicta". */
  feminine?: boolean;
  /** Sent out first: always `team[0]`. */
  team: Team;
}

/** What the UI needs to show a champion without the full sets. */
export interface ChampionSummary {
  id: string;
  name: string;
  variant: string | null;
  title: string;
  location: string;
  feminine: boolean;
  team: string[];
}

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
  /** Per champion slot: true if that Pokémon was knocked out. (Name kept from when Red was the only opponent.) */
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
