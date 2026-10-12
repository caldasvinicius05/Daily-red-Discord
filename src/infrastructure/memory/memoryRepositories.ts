import { ConflictError } from "@/application/errors";
import type { BattleRecord, BattleRepository, DailyChampionRepository, Player, PlayerRepository } from "@/application/ports";
import type { BattleResult, GameDate } from "@/domain";

/** In-memory adapters: used by tests, and handy to run the app without a database. */
export class MemoryBattleRepository implements BattleRepository {
  private readonly records = new Map<string, BattleRecord>();

  async create(record: BattleRecord): Promise<void> {
    if (this.records.has(record.id)) throw new Error(`Battle ${record.id} already exists`);
    if (record.mode === "daily" && (await this.findDaily(record.playerId, record.date))) throw new ConflictError();
    this.records.set(record.id, structuredClone(record));
  }

  async update(record: BattleRecord, expectedActionCount: number): Promise<void> {
    const stored = this.records.get(record.id);
    if (!stored || stored.actions.length !== expectedActionCount || stored.status !== "active") {
      throw new ConflictError();
    }
    this.records.set(record.id, structuredClone(record));
  }

  async findById(id: string): Promise<BattleRecord | null> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : null;
  }

  async findDaily(playerId: string, date: GameDate): Promise<BattleRecord | null> {
    for (const r of this.records.values()) {
      if (r.mode === "daily" && r.playerId === playerId && r.date === date) return structuredClone(r);
    }
    return null;
  }

  async listDailyResults(playerId: string): Promise<BattleResult[]> {
    return [...this.records.values()]
      .filter((r) => r.mode === "daily" && r.playerId === playerId && r.result)
      .map((r) => structuredClone(r.result!));
  }

  async listFinishedDailyByGuild(guildId: string, date: GameDate): Promise<BattleRecord[]> {
    return [...this.records.values()]
      .filter((r) => r.mode === "daily" && r.guildId === guildId && r.date === date && r.result)
      .map((r) => structuredClone(r));
  }
}

export class MemoryPlayerRepository implements PlayerRepository {
  private readonly players = new Map<string, Player>();

  async upsert(player: Player): Promise<void> {
    this.players.set(player.id, { ...player });
  }

  async findByIds(ids: readonly string[]): Promise<Player[]> {
    return ids.flatMap((id) => {
      const p = this.players.get(id);
      return p ? [{ ...p }] : [];
    });
  }
}

export class MemoryDailyChampionRepository implements DailyChampionRepository {
  private readonly byDate = new Map<GameDate, string>();

  async get(date: GameDate): Promise<string | null> {
    return this.byDate.get(date) ?? null;
  }

  async listBetween(from: GameDate, to: GameDate): Promise<{ date: GameDate; championId: string }[]> {
    return [...this.byDate.entries()]
      .filter(([date]) => date >= from && date <= to)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, championId]) => ({ date, championId }));
  }

  async claim(date: GameDate, championId: string): Promise<string> {
    if (!this.byDate.has(date)) this.byDate.set(date, championId);
    return this.byDate.get(date)!;
  }
}
