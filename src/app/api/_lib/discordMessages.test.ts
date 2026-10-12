import { describe, expect, it } from "vitest";
import type { LeaderboardEntry } from "@/application/useCases";
import { leaderboardMessage } from "./discordMessages";

const entry = (rank: number, id: string, name: string, won: boolean, abandoned = false): LeaderboardEntry => ({
  rank,
  player: { id, displayName: name, avatar: null },
  finishedAt: new Date("2026-10-12T18:00:00Z"),
  result: {
    date: "2026-10-12",
    won,
    abandoned,
    turns: 21,
    playerAlive: [true, true, false, false, false, false],
    redFainted: won ? Array(6).fill(true) : [true, true, true, false, false, false],
  },
});

describe("leaderboardMessage", () => {
  it("lists the ranking with medals, mentions real Discord users and never pings", () => {
    const msg = leaderboardMessage("2026-10-12", [
      entry(1, "123456789012345678", "Alice", true),
      entry(2, "dev-bob", "Bob", false),
      entry(3, "223456789012345678", "Carol", false, true),
      entry(4, "323456789012345678", "Dan", false),
    ]);
    const lines = msg.embeds[0]!.description.split("\n");
    expect(msg.embeds[0]!.title).toBe("Daily Red #1 — ranking de hoje");
    expect(lines[0]).toBe("🥇 <@123456789012345678> — venceu · 2/6 de pé · 21 turnos");
    expect(lines[1]).toBe("🥈 **Bob** — perdeu · 3/6 derrubados");
    expect(lines[2]).toBe("🥉 <@223456789012345678> — desistiu 🏳️");
    expect(lines[3]).toBe("`4.` <@323456789012345678> — perdeu · 3/6 derrubados");
    expect(msg.allowed_mentions.parse).toEqual([]);
  });

  it("has a friendly empty state", () => {
    expect(leaderboardMessage("2026-10-12", []).embeds[0]!.description).toContain("Ninguém deste servidor");
  });
});
