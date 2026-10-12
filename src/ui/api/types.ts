import type { Player } from "@/application/ports";
import type { BattleState, DailyStatus, LeaderboardEntry, ReferenceData, TodayOverview } from "@/application/useCases";

/** What a server type looks like after JSON serialisation (Dates become strings). */
// Mapped types keep arrays and tuples as they are, so one branch covers objects, arrays and tuples.
type Jsonify<T> = T extends Date ? string : T extends object ? { [K in keyof T]: Jsonify<T[K]> } : T;

export type TodayDTO = Jsonify<TodayOverview>;
export type BattleDTO = Jsonify<BattleState>;
export type LeaderboardEntryDTO = Jsonify<LeaderboardEntry>;
export type LeaderboardDTO = { date: string; entries: LeaderboardEntryDTO[] };
export type StatusesDTO = { date: string; statuses: Jsonify<DailyStatus>[] };
export type ReferenceDTO = ReferenceData;
export type PlayerDTO = Player;

export interface SessionDTO {
  token: string;
  expiresAt: number;
  player: PlayerDTO;
}

export interface AuthConfigDTO {
  discord: boolean;
  devLogin: boolean;
}
