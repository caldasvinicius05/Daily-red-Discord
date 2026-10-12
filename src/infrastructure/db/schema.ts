import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { BattleStatus } from "@/application/ports";
import type { BattleMode, BattleResult, PlayerAction, Team } from "@/domain";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const battles = sqliteTable(
  "battles",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id),
    guildId: text("guild_id"),
    mode: text("mode").$type<BattleMode>().notNull(),
    date: text("date").notNull(),
    /** Battles from before champions existed were all against Red. */
    championId: text("champion_id").notNull().default("red"),
    seed: text("seed").notNull(),
    team: text("team", { mode: "json" }).$type<Team>().notNull(),
    leadIndex: integer("lead_index").notNull(),
    actions: text("actions", { mode: "json" }).$type<PlayerAction[]>().notNull(),
    /** Denormalised length of `actions`, used for optimistic locking. */
    actionCount: integer("action_count").notNull(),
    status: text("status").$type<BattleStatus>().notNull(),
    result: text("result", { mode: "json" }).$type<BattleResult>(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    // One daily battle per player per day.
    uniqueIndex("battles_daily_unique").on(t.playerId, t.date).where(sql`${t.mode} = 'daily'`),
    index("battles_guild_date").on(t.guildId, t.date),
  ],
);

/** Which champion each day had; read to keep champions from repeating within a week. */
export const dailyChampions = sqliteTable("daily_champions", {
  date: text("date").primaryKey(),
  championId: text("champion_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
