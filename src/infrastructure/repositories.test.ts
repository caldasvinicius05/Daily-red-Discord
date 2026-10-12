import { describe, expect, it } from "vitest";
import { ConflictError } from "@/application/errors";
import type { BattleRecord, BattleRepository, DailyChampionRepository, PlayerRepository } from "@/application/ports";
import { getChampion } from "@/domain";
import { createDatabase, migrateDatabase } from "./db/client";
import { DrizzleBattleRepository, DrizzleDailyChampionRepository, DrizzlePlayerRepository } from "./db/drizzleRepositories";
import { MemoryBattleRepository, MemoryDailyChampionRepository, MemoryPlayerRepository } from "./memory/memoryRepositories";

/** The same contract must hold for every adapter, so the app behaves the same in tests and in production. */
type Repos = { battles: BattleRepository; players: PlayerRepository; dailyChampions: DailyChampionRepository };

const adapters: [string, () => Promise<Repos>][] = [
  [
    "memory",
    async () => ({
      battles: new MemoryBattleRepository(),
      players: new MemoryPlayerRepository(),
      dailyChampions: new MemoryDailyChampionRepository(),
    }),
  ],
  [
    "sqlite (drizzle)",
    async () => {
      const db = createDatabase(":memory:");
      await migrateDatabase(db);
      return {
        battles: new DrizzleBattleRepository(db),
        players: new DrizzlePlayerRepository(db),
        dailyChampions: new DrizzleDailyChampionRepository(db),
      };
    },
  ],
];

const record = (overrides: Partial<BattleRecord> = {}): BattleRecord => ({
  id: "b1",
  playerId: "alice",
  guildId: "g1",
  mode: "daily",
  date: "2026-10-12",
  championId: "lance",
  seed: "seed",
  team: getChampion("red").team,
  leadIndex: 0,
  actions: [],
  status: "active",
  result: null,
  startedAt: new Date("2026-10-12T18:00:00Z"),
  finishedAt: null,
  ...overrides,
});

const result = { date: "2026-10-12", won: true, turns: 12, playerAlive: [true, true, true, false, false, false], redFainted: Array(6).fill(true), abandoned: false };

describe.each(adapters)("%s repositories", (_name, make) => {
  async function setup() {
    const repos = await make();
    await repos.players.upsert({ id: "alice", username: "alice", displayName: "Alice", avatar: null });
    await repos.players.upsert({ id: "bob", username: "bob", displayName: "Bob", avatar: "abc" });
    return repos;
  }

  it("round-trips a battle, including JSON columns and dates", async () => {
    const { battles } = await setup();
    const r = record();
    await battles.create(r);
    expect(await battles.findById("b1")).toEqual(r);
    expect(await battles.findDaily("alice", "2026-10-12")).toEqual(r);
    expect(await battles.findDaily("alice", "2026-10-13")).toBeNull();
    expect(await battles.findById("missing")).toBeNull();
  });

  it("allows only one daily per player per day, but any number of practices", async () => {
    const { battles } = await setup();
    await battles.create(record());
    await expect(battles.create(record({ id: "b2" }))).rejects.toThrow(ConflictError);
    await battles.create(record({ id: "p1", mode: "practice" }));
    await battles.create(record({ id: "p2", mode: "practice" }));
  });

  it("updates with optimistic locking on the action count", async () => {
    const { battles } = await setup();
    await battles.create(record());
    const moved = record({ actions: [{ type: "move", move: 0 }] });
    await battles.update(moved, 0);
    expect((await battles.findById("b1"))!.actions).toHaveLength(1);
    await expect(battles.update(record({ actions: [{ type: "move", move: 1 }] }), 0)).rejects.toThrow(ConflictError);
  });

  it("refuses to change a finished battle", async () => {
    const { battles } = await setup();
    await battles.create(record());
    await battles.update(record({ status: "won", result, finishedAt: new Date() }), 0);
    await expect(battles.update(record(), 0)).rejects.toThrow(ConflictError);
  });

  it("lists finished daily results per player and per guild", async () => {
    const { battles } = await setup();
    const finished = { status: "won" as const, result, finishedAt: new Date("2026-10-12T19:00:00Z") };
    await battles.create(record({ id: "a", ...finished }));
    await battles.create(record({ id: "b", playerId: "bob" })); // still active
    await battles.create(record({ id: "c", playerId: "bob", mode: "practice", ...finished }));
    await battles.create(record({ id: "d", playerId: "bob", date: "2026-10-11", guildId: "g2", ...finished, result: { ...result, date: "2026-10-11" } }));

    expect(await battles.listDailyResults("alice")).toEqual([result]);
    expect(await battles.listDailyResults("bob")).toEqual([{ ...result, date: "2026-10-11" }]);
    expect((await battles.listFinishedDailyByGuild("g1", "2026-10-12")).map((r) => r.id)).toEqual(["a"]);
    expect(await battles.listFinishedDailyByGuild("g2", "2026-10-12")).toEqual([]);
  });

  it("stores one champion per day; the first claim wins", async () => {
    const { dailyChampions } = await setup();
    expect(await dailyChampions.get("2026-10-12")).toBeNull();
    expect(await dailyChampions.claim("2026-10-12", "lance")).toBe("lance");
    expect(await dailyChampions.claim("2026-10-12", "steven")).toBe("lance");
    await dailyChampions.claim("2026-10-13", "red");
    await dailyChampions.claim("2026-10-20", "blue");
    expect(await dailyChampions.listBetween("2026-10-12", "2026-10-18")).toEqual([
      { date: "2026-10-12", championId: "lance" },
      { date: "2026-10-13", championId: "red" },
    ]);
    expect(await dailyChampions.listBetween("2026-10-12", "2026-10-11")).toEqual([]);
  });

  it("upserts players and finds them by id", async () => {
    const { players } = await setup();
    await players.upsert({ id: "alice", username: "alice", displayName: "Alice B.", avatar: "new" });
    const found = await players.findByIds(["alice", "bob", "ghost"]);
    expect(found.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
      { id: "alice", username: "alice", displayName: "Alice B.", avatar: "new" },
      { id: "bob", username: "bob", displayName: "Bob", avatar: "abc" },
    ]);
    expect(await players.findByIds([])).toEqual([]);
  });
});
