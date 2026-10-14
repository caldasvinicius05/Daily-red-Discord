import { beforeEach, describe, expect, it } from "vitest";
import { CHAMPIONS, type BattleView, type PlayerAction } from "@/domain";
import { createRandom } from "@/domain/rules/random";
import {
  MemoryBattleRepository,
  MemoryDailyAnnouncementRepository,
  MemoryDailyChampionRepository,
  MemoryPlayerRepository,
} from "@/infrastructure/memory/memoryRepositories";
import { ShowdownBattleEngine } from "@/infrastructure/showdown/ShowdownBattleEngine";
import { ShowdownPokedex } from "@/infrastructure/showdown/ShowdownPokedex";
import { ShowdownTeamFactory } from "@/infrastructure/showdown/ShowdownTeamFactory";
import {
  AlreadyPlayedError,
  BattleEndedError,
  ConflictError,
  ForbiddenError,
  InvalidActionError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";
import { createUseCases, type BattleState, type UseCases } from "./useCases";
import type { BattleRepository, DailyAnnouncer, DiscordGateway, ServerSummary } from "./ports";

const ALICE = { id: "alice", username: "alice", displayName: "Alice", avatar: null };
const BOB = { id: "bob", username: "bob", displayName: "Bob", avatar: null };
const GUILD = "guild-1";

/** Accepts code "good-code" for user carol, who is only in GUILD. */
const fakeDiscord: DiscordGateway = {
  exchangeCode: async (code) => {
    if (code !== "good-code") throw new UnauthorizedError();
    return "access-token";
  },
  getUser: async () => ({ id: "carol", username: "carol_", globalName: "Carol", avatar: "hash" }),
  getGuildIds: async () => [GUILD],
};

/** 15:00 in São Paulo on the given day. */
const at = (date: string) => new Date(`${date}T18:00:00Z`);

// Built once: generating the pool is the slow part and it's stateless.
const teams = new ShowdownTeamFactory();

let now: Date;
let battles: BattleRepository;
let app: UseCases;
/** What the fake bot was asked to post, in order. */
let published: { summary: ServerSummary; channelId: string; finishedBy: string }[];

/** Fake bot: every post is a new message "msg-N". */
const fakeAnnouncer: DailyAnnouncer = {
  publish: async (summary, channelId, finishedBy) => {
    published.push({ summary, channelId, finishedBy });
    return { channelId, messageId: `msg-${published.length}` };
  },
};

beforeEach(async () => {
  now = at("2026-10-12");
  let n = 0;
  battles = new MemoryBattleRepository();
  published = [];
  app = createUseCases({
    engine: new ShowdownBattleEngine(),
    teams,
    battles,
    dailyChampions: new MemoryDailyChampionRepository(),
    players: new MemoryPlayerRepository(),
    discord: fakeDiscord,
    announcements: new MemoryDailyAnnouncementRepository(),
    announcer: fakeAnnouncer,
    pokedex: new ShowdownPokedex(),
    clock: { now: () => now },
    ids: { next: () => `battle-${++n}` },
    random: createRandom("use-case-tests"),
  });
  await app.registerPlayer(ALICE);
  await app.registerPlayer(BOB);
});

function nextAction(view: BattleView): PlayerAction {
  if (view.phase === "switch") return { type: "switch", teamIndex: view.choices.switches[0]! };
  return { type: "move", move: view.choices.moves.find((m) => !m.disabled)!.index };
}

async function playToEnd(playerId: string, state: BattleState): Promise<BattleState> {
  while (state.view.phase !== "ended") {
    state = await app.submitAction({ playerId, battleId: state.id, action: nextAction(state.view) });
  }
  return state;
}

describe("discord login", () => {
  it("registers the player using their display name", async () => {
    const { player, accessToken } = await app.authenticateWithDiscord({ code: "good-code", guildId: GUILD });
    expect(accessToken).toBe("access-token");
    expect(player).toEqual({ id: "carol", username: "carol_", displayName: "Carol", avatar: "hash" });
    // The new player can play right away.
    await app.startBattle({ playerId: "carol", guildId: GUILD, mode: "daily", leadIndex: 0 });
  });

  it("works outside a server (DMs) and rejects bad codes or foreign servers", async () => {
    await expect(app.authenticateWithDiscord({ code: "good-code", guildId: null })).resolves.toBeDefined();
    await expect(app.authenticateWithDiscord({ code: "bad", guildId: GUILD })).rejects.toThrow(UnauthorizedError);
    await expect(app.authenticateWithDiscord({ code: "good-code", guildId: "someone-elses" })).rejects.toThrow(ForbiddenError);
  });
});

describe("today", () => {
  it("shows the shared daily team and an empty record for a new player", async () => {
    const today = await app.getToday(ALICE.id);
    expect(today.challenge.number).toBe(1);
    expect(today.challenge.team).toHaveLength(6);
    expect(CHAMPIONS.map((c) => c.id)).toContain(today.champion.id);
    expect(today.champion.team).toHaveLength(6);
    expect(today.daily).toEqual({ status: "available" });
    expect(today.stats.played).toBe(0);
    expect((await app.getToday(BOB.id)).challenge).toEqual(today.challenge);
  });
});

describe("daily battle", () => {
  it("starts, resumes instead of duplicating, and finishes with a share text", async () => {
    const started = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 2 });
    expect(started.view.player.active).toBe(2);
    expect(started.events.length).toBeGreaterThan(0);
    expect((await app.getToday(ALICE.id)).daily).toEqual({ status: "active", battleId: started.id });

    // Reopening the activity (even asking for another lead) returns the same battle.
    const resumed = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    expect(resumed.id).toBe(started.id);
    expect(resumed.view.player.active).toBe(2);

    const finished = await playToEnd(ALICE.id, started);
    expect(finished.result).not.toBeNull();
    expect(finished.shareText).toMatch(/^Daily Battle #1 — /);

    const today = await app.getToday(ALICE.id);
    expect(today.daily.status).toBe("finished");
    expect(today.stats.played).toBe(1);

    await expect(app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 })).rejects.toThrow(
      AlreadyPlayedError,
    );
    await expect(app.submitAction({ playerId: ALICE.id, battleId: started.id, action: { type: "move", move: 0 } })).rejects.toThrow(
      BattleEndedError,
    );
  });

  it("returns only the new events after each action, and the full log on resume", async () => {
    const started = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    const afterMove = await app.submitAction({ playerId: ALICE.id, battleId: started.id, action: { type: "move", move: 0 } });
    expect(afterMove.events[0]!.kind).not.toBe("switch"); // not the opening again
    const resumed = await app.getBattle({ playerId: ALICE.id, battleId: started.id });
    expect(resumed.events).toEqual([...started.events, ...afterMove.events]);
  });

  it("everyone gets the same luck: same choices, same battle", async () => {
    const a = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 1 });
    const b = await app.startBattle({ playerId: BOB.id, guildId: GUILD, mode: "daily", leadIndex: 1 });
    const endA = await playToEnd(ALICE.id, a);
    const endB = await playToEnd(BOB.id, b);
    expect(endB.result).toEqual(endA.result);
  });

  it("forfeiting counts as an abandoned loss", async () => {
    const started = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    const forfeited = await app.forfeitBattle({ playerId: ALICE.id, battleId: started.id });
    expect(forfeited.result).toMatchObject({ won: false, abandoned: true });
    expect(forfeited.shareText).toContain("desisti");
    expect((await app.getPlayerStats(ALICE.id)).played).toBe(1);
  });

  it("a new day brings a new team", async () => {
    const day1 = await app.getToday(ALICE.id);
    now = at("2026-10-13");
    const day2 = await app.getToday(ALICE.id);
    expect(day2.challenge.number).toBe(2);
    expect(day2.challenge.team).not.toEqual(day1.challenge.team);
  });
});

describe("daily champion", () => {
  it("is fixed for the day and the same for everyone", async () => {
    const champion = (await app.getToday(ALICE.id)).champion;
    expect((await app.getToday(BOB.id)).champion).toEqual(champion);
    const battle = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    expect(battle.champion).toEqual(champion);
  });

  it("shows every champion before repeating one, and the rotation restarts on Monday", async () => {
    const week: string[] = [];
    for (let day = 12; day <= 18; day++) {
      now = at(`2026-10-${day}`); // Monday 12 → Sunday 18
      week.push((await app.getToday(ALICE.id)).champion.id);
    }
    expect(new Set(week.slice(0, CHAMPIONS.length)).size).toBe(CHAMPIONS.length);
    for (let i = 1; i < week.length; i++) expect(week[i]).not.toBe(week[i - 1]);
    now = at("2026-10-19"); // next Monday: anyone may come back
    expect(CHAMPIONS.map((c) => c.id)).toContain((await app.getToday(ALICE.id)).champion.id);
  });
});

describe("practice", () => {
  it("draws a random champion per run but keeps the day's team", async () => {
    const daily = (await app.getToday(ALICE.id)).challenge.team.map((s) => s.species);
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const run = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0 });
      seen.add(run.champion.id);
      expect(run.view.player.team.map((m) => m.species)).toEqual(daily);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("can be played any number of times and never touches stats", async () => {
    const first = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0 });
    const second = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0 });
    expect(second.id).not.toBe(first.id);
    const finished = await playToEnd(ALICE.id, second);
    expect(finished.result).not.toBeNull();
    expect(finished.shareText).toBeNull();
    expect((await app.getPlayerStats(ALICE.id)).played).toBe(0);
    expect((await app.getToday(ALICE.id)).daily.status).toBe("available");
  });
});

describe("guards", () => {
  it("rejects unknown battles, other players' battles and illegal actions", async () => {
    const started = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    await expect(app.getBattle({ playerId: ALICE.id, battleId: "nope" })).rejects.toThrow(NotFoundError);
    await expect(app.getBattle({ playerId: BOB.id, battleId: started.id })).rejects.toThrow(ForbiddenError);
    await expect(app.submitAction({ playerId: ALICE.id, battleId: started.id, action: { type: "move", move: 9 } })).rejects.toThrow(
      InvalidActionError,
    );
    await expect(app.startBattle({ playerId: BOB.id, guildId: GUILD, mode: "daily", leadIndex: 7 })).rejects.toThrow(
      InvalidActionError,
    );
  });

  it("rejects a stale write when two requests race on the same battle", async () => {
    const started = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    const action = { type: "move", move: 0 } as const;
    const results = await Promise.allSettled([
      app.submitAction({ playerId: ALICE.id, battleId: started.id, action }),
      app.submitAction({ playerId: ALICE.id, battleId: started.id, action }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictError);
    expect((await battles.findById(started.id))!.actions).toHaveLength(1);
  });
});

describe("daily statuses", () => {
  it("reports none / active / finished for each player, ignoring duplicates", async () => {
    const a = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    await playToEnd(ALICE.id, a);
    await app.startBattle({ playerId: BOB.id, guildId: GUILD, mode: "daily", leadIndex: 0 });

    const { date, statuses } = await app.getDailyStatuses([ALICE.id, BOB.id, "stranger", ALICE.id]);
    expect(date).toBe("2026-10-12");
    expect(statuses.map((s) => [s.playerId, s.status])).toEqual([
      [ALICE.id, "finished"],
      [BOB.id, "active"],
      ["stranger", "none"],
    ]);
    expect(statuses[0]!.result).not.toBeNull();
    expect(statuses[1]!.result).toBeNull();
  });

  it("practice battles don't count as playing the daily", async () => {
    await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0 });
    expect((await app.getDailyStatuses([ALICE.id])).statuses[0]!.status).toBe("none");
  });

  it("refuses oversized lookups", async () => {
    const many = Array.from({ length: 26 }, (_, i) => `p${i}`);
    await expect(app.getDailyStatuses(many)).rejects.toThrow(InvalidActionError);
  });
});

describe("reference data", () => {
  it("describes every species and move that can appear, with Gen 4 categories", () => {
    const ref = app.getReferenceData();
    // The whole player pool plus the champions' Pokémon (Pikachu only comes with Red).
    expect(Object.keys(ref.species).length).toBeGreaterThan(225);
    expect(ref.species["Garchomp"]).toMatchObject({ num: 445, types: ["Dragon", "Ground"] });
    expect(ref.species["Pikachu"]).toMatchObject({ num: 25, types: ["Electric"] });
    expect(ref.species["Raichu"]).toBeDefined();
    expect(ref.moves["Hidden Power Fire"]).toBeDefined();
    expect(ref.species["Metagross"]!.baseStats.atk).toBe(135);
    // From Gen 4 each move has its own category, whatever its type.
    expect(ref.moves["Crunch"]!.category).toBe("Physical");
    expect(ref.moves["Shadow Ball"]!.category).toBe("Special");
    expect(ref.moves["Close Combat"]).toBeDefined();
    expect(ref.items["Life Orb"]).toBeTruthy();
    expect(ref.moves["Quick Attack"]!.priority).toBe(1);
    expect(ref.items["Leftovers"]).toBeTruthy();
  });
});

describe("leaderboard", () => {
  it("ranks the server's finished daily battles", async () => {
    const a = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    await playToEnd(ALICE.id, a);
    const b = await app.startBattle({ playerId: BOB.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    await app.forfeitBattle({ playerId: BOB.id, battleId: b.id });

    const board = await app.getLeaderboard({ guildId: GUILD });
    expect(board.date).toBe("2026-10-12");
    expect(board.entries.map((e) => [e.rank, e.player.displayName])).toEqual([
      [1, "Alice"],
      [2, "Bob"], // abandoned games rank last
    ]);
    expect((await app.getLeaderboard({ guildId: "other-guild" })).entries).toEqual([]);
  });
});

describe("practice champion choice", () => {
  it("faces the champion the player picked", async () => {
    for (const id of ["cynthia", "lance"]) {
      const battle = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0, championId: id });
      expect(battle.champion.id).toBe(id);
    }
  });

  it("rejects unknown champions and lists everyone on the home screen", async () => {
    await expect(
      app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0, championId: "gary" }),
    ).rejects.toThrow(InvalidActionError);
    expect((await app.getToday(ALICE.id)).champions.map((c) => c.id)).toEqual(CHAMPIONS.map((c) => c.id));
  });
});

describe("daily results message", () => {
  it("is posted again, as a new message, every time someone finishes the daily", async () => {
    const a = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0, channelId: "chan-1" });
    await playToEnd(ALICE.id, a);
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({ channelId: "chan-1", finishedBy: ALICE.id });
    expect(published[0]!.summary).toMatchObject({ guildId: GUILD, date: "2026-10-12", streak: 1 });
    expect(published[0]!.summary.entries.map((e) => e.player.id)).toEqual([ALICE.id]);

    // Bob plays from another channel: a new message there, with everyone's results.
    const b = await app.startBattle({ playerId: BOB.id, guildId: GUILD, mode: "daily", leadIndex: 1, channelId: "chan-2" });
    await app.forfeitBattle({ playerId: BOB.id, battleId: b.id });
    expect(published).toHaveLength(2);
    expect(published[1]).toMatchObject({ channelId: "chan-2", finishedBy: BOB.id });
    expect(published[1]!.summary.entries).toHaveLength(2);
  });

  it("goes to the channel used last today when the player has none", async () => {
    const a = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0, channelId: "chan-1" });
    await app.forfeitBattle({ playerId: ALICE.id, battleId: a.id });
    const b = await app.startBattle({ playerId: BOB.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    await app.forfeitBattle({ playerId: BOB.id, battleId: b.id });
    expect(published.map((p) => [p.channelId, p.finishedBy])).toEqual([
      ["chan-1", ALICE.id],
      ["chan-1", BOB.id],
    ]);
  });

  it("is not posted for practice, outside a server or without a channel", async () => {
    const practice = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0, channelId: "chan-1" });
    await app.forfeitBattle({ playerId: ALICE.id, battleId: practice.id });
    const daily = await app.startBattle({ playerId: BOB.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    await app.forfeitBattle({ playerId: BOB.id, battleId: daily.id });
    expect(published).toEqual([]);
  });

  it("never breaks the battle when Discord fails", async () => {
    const failing = createUseCases({
      engine: new ShowdownBattleEngine(),
      teams,
      battles: new MemoryBattleRepository(),
      dailyChampions: new MemoryDailyChampionRepository(),
      players: new MemoryPlayerRepository(),
      discord: fakeDiscord,
      announcements: new MemoryDailyAnnouncementRepository(),
      announcer: { publish: () => Promise.reject(new Error("Discord fora do ar")) },
      pokedex: new ShowdownPokedex(),
      clock: { now: () => now },
      ids: { next: () => "only" },
      random: createRandom("failing"),
    });
    await failing.registerPlayer(ALICE);
    const battle = await failing.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0, channelId: "c" });
    const ended = await failing.forfeitBattle({ playerId: ALICE.id, battleId: battle.id });
    expect(ended.result?.abandoned).toBe(true);
  });
});

describe("server summary", () => {
  it("counts the streak of days played and every champion defeated", async () => {
    for (const day of ["2026-10-10", "2026-10-11", "2026-10-12"]) {
      now = at(day);
      const battle = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
      await app.forfeitBattle({ playerId: ALICE.id, battleId: battle.id });
    }
    const summary = await app.getServerSummary({ guildId: GUILD });
    expect(summary.streak).toBe(3);
    expect(summary.championsDefeated).toBe(0);
    expect(summary.entries).toHaveLength(1);
    expect((await app.getServerSummary({ guildId: "other" })).streak).toBe(0);
  });
});

describe("leaving and coming back", () => {
  it("keeps an unfinished practice to resume from the home screen", async () => {
    const started = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 2 });
    const moved = await app.submitAction({ playerId: ALICE.id, battleId: started.id, action: nextAction(started.view) });
    expect((await app.getToday(ALICE.id)).practice).toEqual({ battleId: started.id });
    const resumed = await app.getBattle({ playerId: ALICE.id, battleId: started.id });
    expect(resumed.view).toEqual(moved.view);
  });

  it("closes the unfinished practice when a new one starts, and forgets it once left", async () => {
    const first = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 0 });
    const second = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "practice", leadIndex: 1 });
    expect((await battles.findById(first.id))!.status).toBe("abandoned");
    expect((await app.getToday(ALICE.id)).practice).toEqual({ battleId: second.id });
    await app.forfeitBattle({ playerId: ALICE.id, battleId: second.id });
    expect((await app.getToday(ALICE.id)).practice).toBeNull();
    expect((await app.getToday(ALICE.id)).stats.played).toBe(0);
  });

  it("counts leaving the daily as a loss right away", async () => {
    const daily = await app.startBattle({ playerId: ALICE.id, guildId: GUILD, mode: "daily", leadIndex: 0 });
    await app.forfeitBattle({ playerId: ALICE.id, battleId: daily.id });
    const today = await app.getToday(ALICE.id);
    expect(today.daily.status).toBe("finished");
    expect(today.stats.played).toBe(1);
    expect(today.stats.wins).toBe(0);
  });
});
