import { describe, expect, it } from "vitest";
import type { LeaderboardEntry, ServerSummary } from "@/application/ports";
import { getChampion, summarizeChampion } from "@/domain";
import { dailySummaryMessage, LAUNCH_BUTTON_ID, leaderboardMessage } from "./messages";
import { resultsCardUrl, verifyCardSignature } from "./resultsCard";

const lance = summarizeChampion(getChampion("lance"));

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
    const msg = leaderboardMessage("2026-10-12", lance, [
      entry(1, "123456789012345678", "Alice", true),
      entry(2, "dev-bob", "Bob", false),
      entry(3, "223456789012345678", "Carol", false, true),
      entry(4, "323456789012345678", "Dan", false),
    ]);
    const lines = msg.embeds[0]!.description.split("\n");
    expect(msg.embeds[0]!.title).toBe("Daily Battle #1 — Lance");
    expect(msg.embeds[0]!.footer.text).toBe("Ranking de hoje · Campeão de Johto · Platô Indigo");
    expect(lines[0]).toBe("🥇 <@123456789012345678> — venceu · 2/6 de pé · 21 turnos");
    expect(lines[1]).toBe("🥈 **Bob** — perdeu · 3/6 derrubados");
    expect(lines[2]).toBe("🥉 <@223456789012345678> — desistiu 🏳️");
    expect(lines[3]).toBe("`4.` <@323456789012345678> — perdeu · 3/6 derrubados");
    expect(msg.allowed_mentions.parse).toEqual([]);
  });

  it("has a friendly empty state", () => {
    expect(leaderboardMessage("2026-10-12", lance, []).embeds[0]!.description).toContain("Ninguém deste servidor enfrentou Lance");
  });
});

describe("dailySummaryMessage", () => {
  const summary: ServerSummary = {
    guildId: "111111111111111111",
    date: "2026-10-12",
    challengeNumber: 1,
    champion: lance,
    streak: 7,
    championsDefeated: 12,
    entries: [entry(1, "123456789012345678", "Alice", true), entry(2, "dev-bob", "Bob", false)],
  };

  it("leads with the server streak and champions defeated, then today's top, Wordle style", () => {
    const msg = dailySummaryMessage(summary, "https://app.example/card.png");
    const lines = msg.content.split("\n");
    expect(lines[0]).toBe("**O servidor está numa sequência de 7 dias!** 🔥");
    expect(lines[1]).toBe("Campeões derrotados no total: **12** 🏆");
    expect(lines[3]).toBe("Resultados de hoje contra **Lance**:");
    expect(lines[4]).toBe("👑 <@123456789012345678> — venceu · 2/6 de pé · 21 turnos");
    expect(lines[5]).toBe("🥈 **Bob** — perdeu · 3/6 derrubados");
    expect(msg.embeds[0]!.image.url).toBe("https://app.example/card.png");
    expect(msg.components[0]!.components[0]).toMatchObject({ label: "Jogar agora!", custom_id: LAUNCH_BUTTON_ID });
    expect(msg.allowed_mentions.parse).toEqual([]);
  });

  it("works without a card and on the first day of a streak", () => {
    const msg = dailySummaryMessage({ ...summary, streak: 1, entries: [] }, null);
    expect(msg.content).toContain("começou uma nova sequência");
    expect(msg.content).toContain("Ninguém deste servidor enfrentou Lance");
    expect(msg.embeds).toEqual([]);
  });
});

describe("resultsCardUrl", () => {
  const summary = { guildId: "g1", date: "2026-10-12", entries: [] } as unknown as ServerSummary;

  it("signs the guild and date, so only real messages can show a server's card", () => {
    const url = new URL(resultsCardUrl("https://app.example", summary, "secret"));
    expect(url.pathname).toBe("/api/cards/daily");
    const sig = url.searchParams.get("sig")!;
    expect(verifyCardSignature("g1", "2026-10-12", sig, "secret")).toBe(true);
    expect(verifyCardSignature("g2", "2026-10-12", sig, "secret")).toBe(false);
    expect(verifyCardSignature("g1", "2026-10-12", sig, "other")).toBe(false);
  });

  it("changes when the results change, so Discord never shows a stale card", () => {
    const before = resultsCardUrl("https://app.example", summary, "secret");
    const after = resultsCardUrl("https://app.example", { ...summary, entries: [entry(1, "1", "A", true)] }, "secret");
    expect(after).not.toBe(before);
  });
});
