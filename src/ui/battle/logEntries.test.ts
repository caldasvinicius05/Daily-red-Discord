import { describe, expect, it } from "vitest";
import type { BattleEvent } from "@/domain";
import { ShowdownTeamFactory } from "@/infrastructure/showdown/ShowdownTeamFactory";
import { ShowdownBattleEngine } from "@/infrastructure/showdown/ShowdownBattleEngine";
import { buildBattleLog } from "./logEntries";

// Each side has one Pokémon on the field in this hand-written sequence.
const SLOT_player = 0;
const SLOT_red = 0;

describe("buildBattleLog", () => {
  it("shows how much HP changed, per side, and classifies sources", () => {
    const events: BattleEvent[] = [
      { kind: "switch", side: "player", slot: SLOT_player, species: "Kingdra", hp: 292, maxHp: 292, text: "Vai, Kingdra!" },
      { kind: "switch", side: "red", slot: SLOT_red, species: "Pikachu", hp: 100, maxHp: 100, text: "Red enviou Pikachu!" },
      { kind: "turn", turn: 1, text: "Turno 1" },
      { kind: "move", side: "red", slot: SLOT_red, species: "Pikachu", move: "Thunderbolt", text: "Pikachu do Red usou Thunderbolt!" },
      { kind: "hp", side: "player", slot: SLOT_player, species: "Kingdra", hp: 205, maxHp: 292, change: "damage" },
      { kind: "move", side: "player", slot: SLOT_player, species: "Kingdra", move: "Surf", text: "Kingdra usou Surf!" },
      { kind: "message", text: "Um golpe crítico!", tag: "hit" },
      { kind: "hp", side: "red", slot: SLOT_red, species: "Pikachu", hp: 34, maxHp: 100, change: "damage" },
      { kind: "status", side: "player", slot: SLOT_player, species: "Kingdra", status: "par", text: "Kingdra foi paralisado!" },
      { kind: "hp", side: "player", slot: SLOT_player, species: "Kingdra", hp: 223, maxHp: 292, change: "heal", text: "Kingdra recuperou HP com Leftovers.", source: "item" },
      { kind: "boost", side: "red", slot: SLOT_red, species: "Pikachu", stat: "atk", amount: -1, text: "Ataque de Pikachu do Red caiu!" },
      { kind: "faint", side: "red", slot: SLOT_red, species: "Pikachu", text: "Pikachu do Red desmaiou!" },
    ];
    const log = buildBattleLog(events);

    expect(log[2]).toEqual({ kind: "turn", turn: 1 });
    expect(log[4]).toMatchObject({ icon: "damage", side: "player", detail: "−87 HP", text: "Kingdra recebeu dano." });
    expect(log[6]).toMatchObject({ icon: "hit", side: null });
    expect(log[7]).toMatchObject({ icon: "damage", side: "red", detail: "−66%" });
    expect(log[8]).toMatchObject({ icon: "status", status: "par" });
    expect(log[9]).toMatchObject({ icon: "item", detail: "+18 HP" });
    expect(log[10]).toMatchObject({ icon: "drop", detail: "-1" });
    expect(log[11]).toMatchObject({ icon: "faint", side: "red" });
  });

  it("covers a whole real battle without empty lines", () => {
    const engine = new ShowdownBattleEngine();
    const setup = { seed: "log-test", championId: "lance", team: new ShowdownTeamFactory().dailyTeam("2026-10-12"), leadIndex: 0 };
    const actions = [];
    let snap = engine.simulate(setup, []);
    while (snap.view.phase !== "ended" && actions.length < 80) {
      const v = snap.view;
      actions.push(v.phase === "switch" ? { type: "switch" as const, teamIndex: v.choices.switches[0]! } : { type: "move" as const, move: 0 });
      snap = engine.simulate(setup, actions);
    }
    const log = buildBattleLog(snap.steps.flat());
    expect(log.length).toBeGreaterThan(20);
    for (const entry of log) if (entry.kind === "line") expect(entry.text.trim()).not.toBe("");
    expect(log.at(-1)).toMatchObject({ kind: "line", icon: "end" });
  });
});
