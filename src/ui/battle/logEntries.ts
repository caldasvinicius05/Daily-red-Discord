import type { BattleEvent, BattleSide } from "@/domain";

export type LogIcon =
  | "switch"
  | "move"
  | "damage"
  | "heal"
  | "item"
  | "status"
  | "weather"
  | "recoil"
  | "faint"
  | "boost"
  | "drop"
  | "hit"
  | "ability"
  | "effect"
  | "end"
  | "info";

export type LogEntry =
  | { kind: "turn"; turn: number }
  | {
      kind: "line";
      icon: LogIcon;
      /** Whose action/effect it is, for coloring. Null for field-wide lines (weather, hit results). */
      side: BattleSide | null;
      text: string;
      /** Short figure shown on the right, e.g. "−34%" or "+18 HP". */
      detail?: string;
      /** Status code (par, slp, ...) when the line is about a status condition. */
      status?: string;
    };

function label(side: BattleSide, species: string): string {
  return side === "red" ? `${species} do Red` : species;
}

const HP_SOURCE_ICON: Record<string, LogIcon> = {
  item: "item",
  status: "status",
  weather: "weather",
  recoil: "recoil",
  drain: "heal",
  effect: "effect",
};

/**
 * Turns the battle's event stream into history lines. Walks the events in order and
 * remembers each Pokémon's last HP, so every HP line can show exactly how much changed.
 */
export function buildBattleLog(events: readonly BattleEvent[]): LogEntry[] {
  const entries: LogEntry[] = [];
  const lastHp = new Map<string, number>();
  const key = (side: BattleSide, species: string) => `${side}:${species}`;

  for (const e of events) {
    switch (e.kind) {
      case "turn":
        entries.push({ kind: "turn", turn: e.turn });
        break;

      case "switch":
        lastHp.set(key(e.side, e.species), e.hp);
        entries.push({ kind: "line", icon: "switch", side: e.side, text: e.text });
        break;

      case "move":
        entries.push({ kind: "line", icon: "move", side: e.side, text: e.text });
        break;

      case "hp": {
        const k = key(e.side, e.species);
        const before = lastHp.get(k) ?? e.maxHp;
        lastHp.set(k, e.hp);
        const delta = e.hp - before;
        if (delta === 0) break;
        const unit = e.side === "red" ? "%" : " HP";
        const detail = `${delta > 0 ? "+" : "−"}${Math.abs(delta)}${unit}`;
        const icon = e.source ? HP_SOURCE_ICON[e.source]! : e.change === "heal" ? "heal" : "damage";
        const text = e.text ?? (e.change === "damage" ? `${label(e.side, e.species)} recebeu dano.` : `${label(e.side, e.species)} recuperou HP.`);
        entries.push({ kind: "line", icon, side: e.side, text, detail });
        break;
      }

      case "faint":
        lastHp.set(key(e.side, e.species), 0);
        entries.push({ kind: "line", icon: "faint", side: e.side, text: e.text });
        break;

      case "status":
        entries.push({ kind: "line", icon: "status", side: e.side, text: e.text, ...(e.status ? { status: e.status } : {}) });
        break;

      case "boost":
        entries.push({
          kind: "line",
          icon: e.amount >= 0 ? "boost" : "drop",
          side: e.side,
          text: e.text,
          ...(e.amount !== 0 ? { detail: `${e.amount > 0 ? "+" : ""}${e.amount}` } : {}),
        });
        break;

      case "weather":
        entries.push({ kind: "line", icon: "weather", side: null, text: e.text });
        break;

      case "message":
        entries.push({ kind: "line", icon: e.tag ?? "info", side: null, text: e.text });
        break;

      case "end":
        entries.push({ kind: "line", icon: "end", side: e.winner, text: e.text });
        break;
    }
  }
  return entries;
}
