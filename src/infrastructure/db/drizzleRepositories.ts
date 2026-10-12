import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { ConflictError } from "@/application/errors";
import type { BattleRecord, BattleRepository, Player, PlayerRepository } from "@/application/ports";
import type { BattleResult, GameDate } from "@/domain";
import type { Database } from "./client";
import { battles, players } from "./schema";

type BattleRow = typeof battles.$inferSelect;

function toRecord(row: BattleRow): BattleRecord {
  const { actionCount: _actionCount, ...rest } = row;
  return rest;
}

function toRow(record: BattleRecord): BattleRow {
  return { ...record, actionCount: record.actions.length };
}

function isUniqueViolation(error: unknown): boolean {
  const text = String((error as { cause?: unknown })?.cause ?? error);
  return text.includes("UNIQUE constraint failed");
}

export class DrizzleBattleRepository implements BattleRepository {
  constructor(private readonly db: Database) {}

  async create(record: BattleRecord): Promise<void> {
    try {
      await this.db.insert(battles).values(toRow(record));
    } catch (error) {
      // A second daily for the same player/day (e.g. two tabs starting at once).
      if (isUniqueViolation(error)) throw new ConflictError();
      throw error;
    }
  }

  async update(record: BattleRecord, expectedActionCount: number): Promise<void> {
    const { id, ...changes } = toRow(record);
    const updated = await this.db
      .update(battles)
      .set(changes)
      .where(and(eq(battles.id, id), eq(battles.actionCount, expectedActionCount), eq(battles.status, "active")))
      .returning({ id: battles.id });
    if (updated.length === 0) throw new ConflictError();
  }

  async findById(id: string): Promise<BattleRecord | null> {
    const row = await this.db.query.battles.findFirst({ where: eq(battles.id, id) });
    return row ? toRecord(row) : null;
  }

  async findDaily(playerId: string, date: GameDate): Promise<BattleRecord | null> {
    const row = await this.db.query.battles.findFirst({
      where: and(eq(battles.playerId, playerId), eq(battles.date, date), eq(battles.mode, "daily")),
    });
    return row ? toRecord(row) : null;
  }

  async listDailyResults(playerId: string): Promise<BattleResult[]> {
    const rows = await this.db
      .select({ result: battles.result })
      .from(battles)
      .where(and(eq(battles.playerId, playerId), eq(battles.mode, "daily"), isNotNull(battles.result)));
    return rows.map((r) => r.result!);
  }

  async listFinishedDailyByGuild(guildId: string, date: GameDate): Promise<BattleRecord[]> {
    const rows = await this.db.query.battles.findMany({
      where: and(eq(battles.guildId, guildId), eq(battles.date, date), eq(battles.mode, "daily"), isNotNull(battles.result)),
    });
    return rows.map(toRecord);
  }
}

export class DrizzlePlayerRepository implements PlayerRepository {
  constructor(private readonly db: Database) {}

  async upsert(player: Player): Promise<void> {
    const now = new Date();
    await this.db
      .insert(players)
      .values({ ...player, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: players.id,
        set: { username: player.username, displayName: player.displayName, avatar: player.avatar, updatedAt: now },
      });
  }

  async findByIds(ids: readonly string[]): Promise<Player[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({ id: players.id, username: players.username, displayName: players.displayName, avatar: players.avatar })
      .from(players)
      .where(inArray(players.id, [...ids]));
  }
}
