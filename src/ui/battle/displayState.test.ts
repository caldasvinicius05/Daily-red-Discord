import { describe, expect, it } from "vitest";
import { generateDailyTeam } from "@/domain";
import { ShowdownBattleEngine } from "@/infrastructure/showdown/ShowdownBattleEngine";
import { applyEvent, displayFromView, EMPTY_DISPLAY } from "./displayState";

const engine = new ShowdownBattleEngine();
const setup = { seed: "display-test", team: generateDailyTeam("2026-10-12"), leadIndex: 0 };

describe("display state", () => {
  it("replaying every event from an empty screen ends exactly at the server's view", () => {
    const actions = [
      { type: "move", move: 0 },
      { type: "switch", teamIndex: 3 },
      { type: "move", move: 1 },
      { type: "move", move: 0 },
    ] as const;
    // Keep only the prefix of actions that is legal for this seed.
    let snapshot = engine.simulate(setup, []);
    const played = [];
    for (const action of actions) {
      try {
        snapshot = engine.simulate(setup, [...played, action]);
        played.push(action);
      } catch {
        break;
      }
    }

    const replayed = snapshot.steps.flat().reduce(applyEvent, EMPTY_DISPLAY);
    const expected = displayFromView(snapshot.view);
    expect(replayed.player.active).toBe(expected.player.active);
    expect(replayed.red.active).toBe(expected.red.active);
    expect(replayed.turn).toBe(expected.turn);
    for (const [species, mon] of Object.entries(replayed.red.mons)) {
      expect(mon.hp).toBe(expected.red.mons[species]!.hp);
      expect(mon.fainted).toBe(expected.red.mons[species]!.fainted);
    }
    const active = replayed.player.active!;
    expect(replayed.player.mons[active]!.hp).toBe(expected.player.mons[active]!.hp);
  });

  it("clamps stat stages to ±6 and clears them on switch", () => {
    let s = applyEvent(EMPTY_DISPLAY, { kind: "switch", side: "red", species: "Espeon", hp: 100, maxHp: 100, text: "" });
    for (let i = 0; i < 5; i++) s = applyEvent(s, { kind: "boost", side: "red", species: "Espeon", stat: "spa", amount: 2, text: "" });
    expect(s.red.mons["Espeon"]!.boosts.spa).toBe(6);
    s = applyEvent(s, { kind: "switch", side: "red", species: "Snorlax", hp: 100, maxHp: 100, text: "" });
    expect(s.red.mons["Espeon"]!.boosts).toEqual({});
    expect(s.red.active).toBe("Snorlax");
  });
});
