import {
  addDays,
  buildShareText,
  challengeNumber,
  CHAMPIONS,
  computeStats,
  DATA_VERSION,
  getChampion,
  msUntilNextDay,
  pickChampion,
  rankResults,
  summarizeChampion,
  toGameDate,
  weekStart,
  type BattleEvent,
  type BattleMode,
  type BattleResult,
  type BattleView,
  type ChampionSummary,
  type DailyChallenge,
  type GameDate,
  type PlayerAction,
  type PlayerStats,
} from "@/domain";
import {
  AlreadyPlayedError,
  BattleEndedError,
  ForbiddenError,
  InvalidActionError,
  NotFoundError,
} from "./errors";
import type {
  BattleEngine,
  BattleRecord,
  BattleRepository,
  BattleSnapshot,
  Clock,
  DailyChampionRepository,
  DiscordGateway,
  IdGenerator,
  MoveInfo,
  Player,
  PlayerRepository,
  Pokedex,
  RandomSource,
  SpeciesInfo,
  TeamFactory,
} from "./ports";

export interface Deps {
  engine: BattleEngine;
  teams: TeamFactory;
  battles: BattleRepository;
  dailyChampions: DailyChampionRepository;
  players: PlayerRepository;
  discord: DiscordGateway;
  pokedex: Pokedex;
  clock: Clock;
  ids: IdGenerator;
  random: RandomSource;
}

// ---------- Output shapes ----------

export interface BattleState {
  id: string;
  mode: BattleMode;
  date: GameDate;
  challengeNumber: number;
  champion: ChampionSummary;
  view: BattleView;
  /** On start/resume: the whole battle so far. After an action: only what that action caused. */
  events: BattleEvent[];
  result: BattleResult | null;
  /** Only for finished daily battles. */
  shareText: string | null;
}

export interface TodayOverview {
  challenge: DailyChallenge;
  /** Today's daily opponent. Practice battles draw a random one instead. */
  champion: ChampionSummary;
  msUntilNext: number;
  daily:
    | { status: "available" }
    | { status: "active"; battleId: string }
    | { status: "finished"; battleId: string; result: BattleResult; shareText: string };
  stats: PlayerStats;
}

export interface LeaderboardEntry {
  rank: number;
  player: Pick<Player, "id" | "displayName" | "avatar">;
  result: BattleResult;
  finishedAt: Date;
}

/** Where a player stands on today's daily: not started, playing, or done (with the result). */
export interface DailyStatus {
  playerId: string;
  status: "none" | "active" | "finished";
  result: BattleResult | null;
}

/** Cap for status lookups: a voice channel's activity rarely has more people than this. */
export const MAX_STATUS_LOOKUP = 25;

/** Everything the UI needs to describe any Pokémon, move, item or ability that can appear. */
export interface ReferenceData {
  species: Record<string, SpeciesInfo>;
  moves: Record<string, MoveInfo>;
  items: Record<string, string>;
  abilities: Record<string, string>;
}

/** Hard cap on actions per battle; the engine also ends battles that run too long. */
const MAX_ACTIONS = 500;

// ---------- Helpers ----------

function dailySeed(date: GameDate, championId: string): string {
  // Same seed for everyone: identical choices lead to identical luck.
  return `${date}:daily:${championId}:v${DATA_VERSION}`;
}

/**
 * The champion of a day. Picked the first time the day is asked for, among champions
 * not yet seen this week (Monday–Sunday), and stored so it never changes afterwards.
 */
async function championOfDay(deps: Deps, date: GameDate): Promise<string> {
  const stored = await deps.dailyChampions.get(date);
  if (stored) return stored;
  const earlierThisWeek = await deps.dailyChampions.listBetween(weekStart(date), addDays(date, -1));
  const picked = pickChampion(
    CHAMPIONS.map((c) => c.id),
    earlierThisWeek.map((d) => getChampion(d.championId).id),
    deps.random,
  );
  // If another request picked first, its choice wins.
  return deps.dailyChampions.claim(date, picked);
}

function dailyChallenge(deps: Deps, date: GameDate): DailyChallenge {
  return { date, number: challengeNumber(date), team: deps.teams.dailyTeam(date) };
}

async function loadOwnedBattle(deps: Deps, playerId: string, battleId: string): Promise<BattleRecord> {
  const record = await deps.battles.findById(battleId);
  if (!record) throw new NotFoundError("Batalha não encontrada");
  if (record.playerId !== playerId) throw new ForbiddenError();
  return record;
}

async function playerStats(deps: Deps, playerId: string): Promise<PlayerStats> {
  const results = await deps.battles.listDailyResults(playerId);
  return computeStats(results, toGameDate(deps.clock.now()));
}

/** `stats` can be passed in when the caller already computed them, to skip a second query. */
async function shareTextFor(deps: Deps, record: BattleRecord, stats?: PlayerStats): Promise<string | null> {
  if (record.mode !== "daily" || !record.result) return null;
  stats ??= await playerStats(deps, record.playerId);
  return buildShareText(record.result, challengeNumber(record.date), stats.winStreak, getChampion(record.championId).name);
}

async function toState(deps: Deps, record: BattleRecord, snapshot: BattleSnapshot, events: BattleEvent[]): Promise<BattleState> {
  return {
    id: record.id,
    mode: record.mode,
    date: record.date,
    challengeNumber: challengeNumber(record.date),
    champion: summarizeChampion(getChampion(record.championId)),
    view: snapshot.view,
    events,
    result: record.result,
    shareText: await shareTextFor(deps, record),
  };
}

// ---------- Use cases ----------

/** Creates the player or refreshes their name/avatar. */
export async function registerPlayer(deps: Deps, player: Player): Promise<void> {
  await deps.players.upsert(player);
}

/**
 * Login from inside the Discord Activity. The guild id comes from the client SDK, so we
 * check the user really is in that server before trusting it for the leaderboard.
 */
export async function authenticateWithDiscord(
  deps: Deps,
  input: { code: string; guildId: string | null },
): Promise<{ player: Player; accessToken: string }> {
  const accessToken = await deps.discord.exchangeCode(input.code);
  const user = await deps.discord.getUser(accessToken);
  if (input.guildId) {
    const guildIds = await deps.discord.getGuildIds(accessToken);
    if (!guildIds.includes(input.guildId)) throw new ForbiddenError("Você não faz parte desse servidor");
  }
  const player: Player = {
    id: user.id,
    username: user.username,
    displayName: user.globalName ?? user.username,
    avatar: user.avatar,
  };
  await deps.players.upsert(player);
  return { player, accessToken };
}

export async function getToday(deps: Deps, playerId: string): Promise<TodayOverview> {
  const now = deps.clock.now();
  const date = toGameDate(now);
  const [record, stats, championId] = await Promise.all([
    deps.battles.findDaily(playerId, date),
    playerStats(deps, playerId),
    championOfDay(deps, date),
  ]);

  let daily: TodayOverview["daily"] = { status: "available" };
  if (record?.status === "active") daily = { status: "active", battleId: record.id };
  else if (record?.result) {
    daily = { status: "finished", battleId: record.id, result: record.result, shareText: (await shareTextFor(deps, record, stats))! };
  }

  return {
    challenge: dailyChallenge(deps, date),
    champion: summarizeChampion(getChampion(championId)),
    msUntilNext: msUntilNextDay(now),
    daily,
    stats,
  };
}

export async function startBattle(
  deps: Deps,
  input: { playerId: string; guildId: string | null; mode: BattleMode; leadIndex: number },
): Promise<BattleState> {
  const now = deps.clock.now();
  const date = toGameDate(now);

  if (input.mode === "daily") {
    const existing = await deps.battles.findDaily(input.playerId, date);
    if (existing && existing.status !== "active") throw new AlreadyPlayedError();
    // Reopening the activity resumes the battle in progress; the lead was already chosen.
    if (existing) return getBattle(deps, { playerId: input.playerId, battleId: existing.id });
  }

  const id = deps.ids.next();
  // Daily: the day's champion. Practice: any champion, at random, to get used to them all.
  const championId =
    input.mode === "daily" ? await championOfDay(deps, date) : CHAMPIONS[Math.floor(deps.random() * CHAMPIONS.length)]!.id;

  const record: BattleRecord = {
    id,
    playerId: input.playerId,
    guildId: input.guildId,
    mode: input.mode,
    date,
    championId,
    seed: input.mode === "daily" ? dailySeed(date, championId) : `${date}:practice:${id}`,
    // Practice keeps the day's six so the player can learn the team.
    team: deps.teams.dailyTeam(date),
    leadIndex: input.leadIndex,
    actions: [],
    status: "active",
    result: null,
    startedAt: now,
    finishedAt: null,
  };

  // Validates the lead before anything is stored.
  const snapshot = deps.engine.simulate(record, []);
  await deps.battles.create(record);
  return toState(deps, record, snapshot, snapshot.steps.flat());
}

/** Full state of a battle, for reopening it. */
export async function getBattle(deps: Deps, input: { playerId: string; battleId: string }): Promise<BattleState> {
  const record = await loadOwnedBattle(deps, input.playerId, input.battleId);
  const snapshot = deps.engine.simulate(record, record.actions);
  return toState(deps, record, snapshot, snapshot.steps.flat());
}

export async function submitAction(
  deps: Deps,
  input: { playerId: string; battleId: string; action: PlayerAction },
): Promise<BattleState> {
  const record = await loadOwnedBattle(deps, input.playerId, input.battleId);
  if (record.status !== "active") throw new BattleEndedError();
  if (record.actions.length >= MAX_ACTIONS) throw new InvalidActionError("Limite de ações atingido");

  const previousCount = record.actions.length;
  const actions = [...record.actions, input.action];
  const snapshot = deps.engine.simulate(record, actions);

  const updated: BattleRecord = { ...record, actions };
  if (snapshot.outcome) {
    updated.status = snapshot.outcome.won ? "won" : "lost";
    updated.result = { ...snapshot.outcome, date: record.date, abandoned: false };
    updated.finishedAt = deps.clock.now();
  }
  await deps.battles.update(updated, previousCount);
  return toState(deps, updated, snapshot, snapshot.steps.at(-1) ?? []);
}

/** Leaving a battle unfinished. Counts as a loss for the daily. */
export async function forfeitBattle(deps: Deps, input: { playerId: string; battleId: string }): Promise<BattleState> {
  const record = await loadOwnedBattle(deps, input.playerId, input.battleId);
  if (record.status !== "active") throw new BattleEndedError();

  const snapshot = deps.engine.simulate(record, record.actions);
  const redFainted = snapshot.view.red.team.map((mon) => mon?.fainted ?? false);
  const updated: BattleRecord = {
    ...record,
    status: "abandoned",
    result: {
      date: record.date,
      won: false,
      abandoned: true,
      turns: snapshot.view.turn,
      playerAlive: snapshot.view.player.team.map((mon) => !mon.fainted),
      redFainted,
    },
    finishedAt: deps.clock.now(),
  };
  await deps.battles.update(updated, record.actions.length);
  return toState(deps, updated, snapshot, []);
}

/**
 * Static Pokédex data: every species that can appear (player pool + champions) and
 * every Gen 3 move, item and ability, since daily builds are generated.
 */
export function getReferenceData(deps: Deps): ReferenceData {
  const data: ReferenceData = { species: {}, moves: {}, items: {}, abilities: {} };
  const species = new Set([...deps.teams.poolSpecies(), ...CHAMPIONS.flatMap((c) => c.team.map((s) => s.species))]);
  for (const name of species) data.species[name] = deps.pokedex.species(name);
  for (const move of deps.pokedex.allMoves()) data.moves[move] = deps.pokedex.move(move);
  for (const item of deps.pokedex.allItems()) data.items[item] = deps.pokedex.itemDescription(item);
  for (const ability of deps.pokedex.allAbilities()) data.abilities[ability] = deps.pokedex.abilityDescription(ability);
  return data;
}

export async function getPlayer(deps: Deps, playerId: string): Promise<Player> {
  const [player] = await deps.players.findByIds([playerId]);
  if (!player) throw new NotFoundError("Jogador não encontrado");
  return player;
}

export async function getPlayerStats(deps: Deps, playerId: string): Promise<PlayerStats> {
  return playerStats(deps, playerId);
}

/** Today's daily status for a group of players, e.g. everyone currently in the Activity. */
export async function getDailyStatuses(deps: Deps, playerIds: readonly string[]): Promise<{ date: GameDate; statuses: DailyStatus[] }> {
  if (playerIds.length > MAX_STATUS_LOOKUP) throw new InvalidActionError(`No máximo ${MAX_STATUS_LOOKUP} jogadores por consulta`);
  const date = toGameDate(deps.clock.now());
  const unique = [...new Set(playerIds)];
  const records = await Promise.all(unique.map((id) => deps.battles.findDaily(id, date)));
  const statuses = unique.map((playerId, i): DailyStatus => {
    const record = records[i];
    if (!record) return { playerId, status: "none", result: null };
    if (record.status === "active") return { playerId, status: "active", result: null };
    return { playerId, status: "finished", result: record.result };
  });
  return { date, statuses };
}

/** Today's (or a given day's) ranking among players of one Discord server, with that day's champion. */
export async function getLeaderboard(
  deps: Deps,
  input: { guildId: string; date?: GameDate },
): Promise<{ date: GameDate; champion: ChampionSummary; entries: LeaderboardEntry[] }> {
  const date = input.date ?? toGameDate(deps.clock.now());
  const [records, championId] = await Promise.all([
    deps.battles.listFinishedDailyByGuild(input.guildId, date),
    championOfDay(deps, date),
  ]);
  const players = new Map((await deps.players.findByIds(records.map((r) => r.playerId))).map((p) => [p.id, p]));

  const ranked = rankResults(records.map((r) => ({ playerId: r.playerId, result: r.result!, finishedAt: r.finishedAt! })));
  const entries = ranked.map(({ rank, playerId, result, finishedAt }) => {
    const player = players.get(playerId);
    return {
      rank,
      player: { id: playerId, displayName: player?.displayName ?? "Desconhecido", avatar: player?.avatar ?? null },
      result,
      finishedAt,
    };
  });
  return { date, champion: summarizeChampion(getChampion(championId)), entries };
}

/** Binds every use case to its dependencies; the presentation layer only sees this. */
export function createUseCases(deps: Deps) {
  return {
    registerPlayer: (player: Player) => registerPlayer(deps, player),
    authenticateWithDiscord: (input: Parameters<typeof authenticateWithDiscord>[1]) => authenticateWithDiscord(deps, input),
    getToday: (playerId: string) => getToday(deps, playerId),
    startBattle: (input: Parameters<typeof startBattle>[1]) => startBattle(deps, input),
    getBattle: (input: Parameters<typeof getBattle>[1]) => getBattle(deps, input),
    submitAction: (input: Parameters<typeof submitAction>[1]) => submitAction(deps, input),
    forfeitBattle: (input: Parameters<typeof forfeitBattle>[1]) => forfeitBattle(deps, input),
    getReferenceData: () => getReferenceData(deps),
    getPlayer: (playerId: string) => getPlayer(deps, playerId),
    getPlayerStats: (playerId: string) => getPlayerStats(deps, playerId),
    getLeaderboard: (input: Parameters<typeof getLeaderboard>[1]) => getLeaderboard(deps, input),
    getDailyStatuses: (playerIds: readonly string[]) => getDailyStatuses(deps, playerIds),
  };
}

export type UseCases = ReturnType<typeof createUseCases>;
