import type {
  BattleEvent,
  BattleMode,
  BattleOutcome,
  BattleResult,
  BattleView,
  GameDate,
  PlayerAction,
  StatSpread,
  Team,
} from "@/domain";

// ---------- Battle engine ----------

export interface BattleSetup {
  seed: string;
  /** Which champion the player faces (see `CHAMPIONS`). */
  championId: string;
  team: Team;
  /** Team index of the Pokémon sent out first. */
  leadIndex: number;
}

export interface BattleSnapshot {
  view: BattleView;
  /** `steps[0]` is the opening switch-ins; `steps[i]` is everything that happened after action `i`. */
  steps: BattleEvent[][];
  outcome: BattleOutcome | null;
}

export interface BattleEngine {
  /**
   * Rebuilds the battle from its seed and replays every action. Deterministic:
   * the same setup and actions always produce the same snapshot.
   * Throws `InvalidActionError` if any action is not legal at that point.
   */
  simulate(setup: BattleSetup, actions: readonly PlayerAction[]): BattleSnapshot;
}

// ---------- Persistence ----------

export type BattleStatus = "active" | "won" | "lost" | "abandoned";

export interface BattleRecord extends BattleSetup {
  id: string;
  playerId: string;
  /** Discord server the battle was played from; scopes the leaderboard. */
  guildId: string | null;
  mode: BattleMode;
  date: GameDate;
  actions: PlayerAction[];
  status: BattleStatus;
  result: BattleResult | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface BattleRepository {
  create(record: BattleRecord): Promise<void>;
  /**
   * Saves the record only if it still has `expectedActionCount` actions stored.
   * Throws `ConflictError` otherwise (another request advanced it first).
   */
  update(record: BattleRecord, expectedActionCount: number): Promise<void>;
  findById(id: string): Promise<BattleRecord | null>;
  findDaily(playerId: string, date: GameDate): Promise<BattleRecord | null>;
  /** Finished daily battles of one player, any date. */
  listDailyResults(playerId: string): Promise<BattleResult[]>;
  /** Finished daily battles played from one Discord server on one date. */
  listFinishedDailyByGuild(guildId: string, date: GameDate): Promise<BattleRecord[]>;
}

export interface Player {
  /** Discord user id. */
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface PlayerRepository {
  upsert(player: Player): Promise<void>;
  findByIds(ids: readonly string[]): Promise<Player[]>;
}

// ---------- Teams ----------

export interface TeamFactory {
  /** Every species the player's daily team can be drawn from. */
  poolSpecies(): readonly string[];
  /** The day's team: same date → same six Pokémon and builds, for everyone. */
  dailyTeam(date: GameDate): Team;
}

/** Remembers which champion each day had, so a champion doesn't repeat within a week. */
export interface DailyChampionRepository {
  get(date: GameDate): Promise<string | null>;
  /** Champions of every recorded date in [from, to], inclusive. */
  listBetween(from: GameDate, to: GameDate): Promise<{ date: GameDate; championId: string }[]>;
  /**
   * Records `championId` for `date` unless one is already recorded, and returns the
   * stored one — so two requests racing on a new day agree on the same champion.
   */
  claim(date: GameDate, championId: string): Promise<string>;
}

// ---------- Reference data (Pokédex) ----------

export interface SpeciesInfo {
  /** National Pokédex number; used for sprite URLs. */
  num: number;
  types: string[];
  baseStats: StatSpread;
}

export interface MoveInfo {
  type: string;
  /** Gen 3 rules: the category comes from the move's type. */
  category: "Physical" | "Special" | "Status";
  power: number;
  /** `true` = never misses. */
  accuracy: number | true;
  priority: number;
  description: string;
}

export interface Pokedex {
  species(name: string): SpeciesInfo;
  move(name: string): MoveInfo;
  itemDescription(name: string): string;
  abilityDescription(name: string): string;
  /** Every move, item and ability that exists in Gen 3 (names). */
  allMoves(): readonly string[];
  allItems(): readonly string[];
  allAbilities(): readonly string[];
}

// ---------- Discord ----------

export interface DiscordUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

export interface DiscordGateway {
  /** OAuth2 authorization code (from the Embedded App SDK's `authorize`) → user access token. */
  exchangeCode(code: string): Promise<string>;
  getUser(accessToken: string): Promise<DiscordUser>;
  /** Ids of the servers the user is in (needs the `guilds` scope). */
  getGuildIds(accessToken: string): Promise<string[]>;
}

// ---------- System ----------

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

/** Non-deterministic randomness (picking champions); seeded in tests. */
export type RandomSource = () => number;
