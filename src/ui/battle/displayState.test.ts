import { describe, expect, it } from "vitest";
import type { BattleSetup } from "@/application/ports";
import type { PlayerAction } from "@/domain";
import { ShowdownBattleEngine } from "@/infrastructure/showdown/ShowdownBattleEngine";
import { ShowdownTeamFactory } from "@/infrastructure/showdown/ShowdownTeamFactory";
import { applyEvent, displayFromView, EMPTY_DISPLAY } from "./displayState";

const engine = new ShowdownBattleEngine();
const team = new ShowdownTeamFactory().dailyTeam("2026-10-12");

/** Plays `turns` simple turns (first move, first forced switch) and returns the snapshot. */
function play(setup: BattleSetup, turns: number) {
  const actions: PlayerAction[] = [];
  let snapshot = engine.simulate(setup, actions);
  while (snapshot.view.phase !== "ended" && actions.length < turns) {
    const v = snapshot.view;
    actions.push(v.phase === "switch" ? { type: "switch", teamIndex: v.choices.switches[0]! } : { type: "move", move: 0 });
    snapshot = engine.simulate(setup, actions);
  }
  return snapshot;
}

function expectReplayMatchesView(setup: BattleSetup, turns: number) {
  const snapshot = play(setup, turns);
  const replayed = snapshot.steps.flat().reduce(applyEvent, EMPTY_DISPLAY);
  const expected = displayFromView(snapshot.view);
  expect(replayed.player.active).toBe(expected.player.active);
  expect(replayed.red.active).toBe(expected.red.active);
  expect(replayed.turn).toBe(expected.turn);
  for (const [slot, mon] of Object.entries(replayed.red.mons)) {
    expect(mon.species).toBe(expected.red.mons[Number(slot)]!.species);
    expect(mon.hp).toBe(expected.red.mons[Number(slot)]!.hp);
    expect(mon.fainted).toBe(expected.red.mons[Number(slot)]!.fainted);
  }
  const active = replayed.player.active!;
  expect(replayed.player.mons[active]!.hp).toBe(expected.player.mons[active]!.hp);
}

describe("display state", () => {
  it("replaying every event from an empty screen ends exactly at the server's view", () => {
    expectReplayMatchesView({ seed: "display-test", championId: "red", team, leadIndex: 0 }, 8);
  });

  it("keeps a champion's repeated species apart (Lance's Dragonite)", () => {
    expectReplayMatchesView({ seed: "display-lance", championId: "lance", team, leadIndex: 0 }, 60);
  });

  it("clamps stat stages to ±6 and clears them on switch", () => {
    let s = applyEvent(EMPTY_DISPLAY, { kind: "switch", side: "red", slot: 1, species: "Espeon", hp: 100, maxHp: 100, text: "" });
    for (let i = 0; i < 5; i++) s = applyEvent(s, { kind: "boost", side: "red", slot: 1, species: "Espeon", stat: "spa", amount: 2, text: "" });
    expect(s.red.mons[1]!.boosts.spa).toBe(6);
    s = applyEvent(s, { kind: "switch", side: "red", slot: 2, species: "Snorlax", hp: 100, maxHp: 100, text: "" });
    expect(s.red.mons[1]!.boosts).toEqual({});
    expect(s.red.active).toBe(2);
  });
});
