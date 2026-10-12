import { describe, expect, it } from "vitest";
import { InvalidActionError } from "@/application/errors";
import type { BattleSetup } from "@/application/ports";
import { addDays, CHAMPIONS, type BattleView, type PlayerAction } from "@/domain";
import { createRandom } from "@/domain/rules/random";
import { ShowdownBattleEngine } from "./ShowdownBattleEngine";
import { ShowdownTeamFactory } from "./ShowdownTeamFactory";

const engine = new ShowdownBattleEngine();
const teams = new ShowdownTeamFactory();
const setup: BattleSetup = { seed: "test-seed", championId: "red", team: teams.dailyTeam("2026-10-12"), leadIndex: 0 };

/** Simple player: always the first usable move, first available switch when forced. */
function nextAction(view: BattleView): PlayerAction {
  if (view.phase === "switch") return { type: "switch", teamIndex: view.choices.switches[0]! };
  const move = view.choices.moves.find((m) => !m.disabled)!;
  return { type: "move", move: move.index };
}

function playToEnd(s: BattleSetup): { actions: PlayerAction[]; snapshot: ReturnType<typeof engine.simulate> } {
  const actions: PlayerAction[] = [];
  let snapshot = engine.simulate(s, actions);
  while (snapshot.view.phase !== "ended") {
    actions.push(nextAction(snapshot.view));
    snapshot = engine.simulate(s, actions);
    if (actions.length > 400) throw new Error("battle did not end");
  }
  return { actions, snapshot };
}

describe("ShowdownBattleEngine", () => {
  it("opens with both leads on the field and asks for a move", () => {
    const { view, steps, outcome } = engine.simulate(setup, []);
    expect(outcome).toBeNull();
    expect(view.phase).toBe("move");
    expect(view.turn).toBe(1);
    expect(view.player.active).toBe(0);
    expect(view.red.active).toBe(0); // Pikachu leads
    expect(view.choices.moves).toHaveLength(4);
    expect(view.choices.switches).toEqual([1, 2, 3, 4, 5]);
    expect(steps[0]!.map((e) => e.kind)).toEqual(["switch", "switch", "turn"]);
  });

  it("respects the chosen lead", () => {
    const { view } = engine.simulate({ ...setup, leadIndex: 3 }, []);
    expect(view.player.active).toBe(3);
    expect(view.choices.switches).toEqual([0, 1, 2, 4, 5]);
  });

  it("hides Red's unrevealed Pokémon and shows his HP only as a percentage", () => {
    const { view, steps } = engine.simulate(setup, []);
    expect(view.red.team[0]).toMatchObject({ species: "Pikachu", hpPercent: 100 });
    expect(view.red.team.slice(1)).toEqual([null, null, null, null, null]);
    const redHp = steps.flat().filter((e) => (e.kind === "hp" || e.kind === "switch") && e.side === "red");
    for (const e of redHp) if ("maxHp" in e) expect(e.maxHp).toBe(100);
  });

  it("plays a full battle to a result", () => {
    const { actions, snapshot } = playToEnd(setup);
    const { outcome, view, steps } = snapshot;
    expect(view.phase).toBe("ended");
    expect(outcome).not.toBeNull();
    expect(outcome!.playerAlive).toHaveLength(6);
    expect(outcome!.redFainted).toHaveLength(6);
    if (outcome!.won) expect(outcome!.redFainted.every(Boolean)).toBe(true);
    else expect(outcome!.playerAlive.some(Boolean)).toBe(false);
    expect(steps).toHaveLength(actions.length + 1);
    expect(steps.at(-1)!.at(-1)!.kind).toBe("end");
  });

  it("is deterministic: replaying the same actions gives the same battle", () => {
    const { actions, snapshot } = playToEnd(setup);
    expect(engine.simulate(setup, actions)).toEqual(snapshot);
  });

  it("different seeds play out differently", () => {
    const a = playToEnd(setup).snapshot.steps.flat().map((e) => e.text);
    const b = playToEnd({ ...setup, seed: "another-seed" }).snapshot.steps.flat().map((e) => e.text);
    expect(a).not.toEqual(b);
  });

  it("lets the player switch voluntarily", () => {
    const { view, steps } = engine.simulate(setup, [{ type: "switch", teamIndex: 2 }]);
    expect(view.player.active).toBe(2);
    expect(steps[1]!.some((e) => e.kind === "switch" && e.side === "player")).toBe(true);
  });

  it("rejects illegal actions", () => {
    expect(() => engine.simulate(setup, [{ type: "move", move: 7 }])).toThrow(InvalidActionError);
    expect(() => engine.simulate(setup, [{ type: "switch", teamIndex: 0 }])).toThrow(InvalidActionError); // already active
    expect(() => engine.simulate(setup, [{ type: "switch", teamIndex: 9 }])).toThrow(InvalidActionError);
    expect(() => engine.simulate({ ...setup, leadIndex: 6 }, [])).toThrow(InvalidActionError);
  });

  it("rejects actions after the battle ends", () => {
    const { actions } = playToEnd(setup);
    expect(() => engine.simulate(setup, [...actions, { type: "move", move: 0 }])).toThrow(InvalidActionError);
  });

  it("survives many battles with varied teams, leads and random choices", () => {
    for (let n = 0; n < 40; n++) {
      const random = createRandom(`fuzz-${n}`);
      const s: BattleSetup = {
        seed: `fuzz-${n}`,
        // Every champion, and a different generated team each time.
        championId: CHAMPIONS[n % CHAMPIONS.length]!.id,
        team: teams.dailyTeam(addDays("2026-10-12", n)),
        leadIndex: n % 6,
      };
      const actions: PlayerAction[] = [];
      let snapshot = engine.simulate(s, actions);
      while (snapshot.view.phase !== "ended") {
        const { phase, choices } = snapshot.view;
        const usable = choices.moves.filter((m) => !m.disabled);
        const switchNow = phase === "switch" || (choices.switches.length > 0 && random() < 0.15);
        actions.push(
          switchNow
            ? { type: "switch", teamIndex: choices.switches[Math.floor(random() * choices.switches.length)]! }
            : { type: "move", move: usable[Math.floor(random() * usable.length)]!.index },
        );
        snapshot = engine.simulate(s, actions);
        expect(actions.length).toBeLessThan(400);
      }
      expect(snapshot.outcome).not.toBeNull();
    }
  }, 120_000);

  it("tells apart a champion's repeated species (Lance's three Dragonite)", () => {
    const lance: BattleSetup = { ...setup, seed: "lance-dupes", championId: "lance" };
    const { snapshot } = playToEnd(lance);
    const steps = snapshot.steps.flat();
    // Each Dragonite slot (1, 2 and 5) that came out is tracked under its own slot.
    const dragoniteSlots = new Set(steps.flatMap((e) => (e.kind === "switch" && e.side === "red" && e.species === "Dragonite" ? [e.slot] : [])));
    for (const slot of dragoniteSlots) expect([1, 2, 5]).toContain(slot);
    // A faint on one Dragonite never marks another one as fainted.
    const faintedSlots = steps.flatMap((e) => (e.kind === "faint" && e.side === "red" ? [e.slot] : []));
    expect(new Set(faintedSlots).size).toBe(faintedSlots.length);
    snapshot.outcome!.redFainted.forEach((fainted, slot) => expect(fainted).toBe(faintedSlots.includes(slot)));
    // Revealed Pokémon in the view line up with their own slots.
    snapshot.view.red.team.forEach((mon, slot) => {
      if (mon) expect(mon.species).toBe(CHAMPIONS.find((c) => c.id === "lance")!.team[slot]!.species);
    });
  });

  it("uses the champion's name in the narration", () => {
    const { steps } = engine.simulate({ ...setup, championId: "steven" }, []);
    expect(steps.flat().map((e) => e.text)).toContain("Steven enviou Skarmory!");
  });

  it("narrates in Portuguese", () => {
    const { steps } = engine.simulate(setup, [{ type: "move", move: 0 }]);
    const texts = steps.flat().map((e) => e.text).filter(Boolean);
    expect(texts).toContain("Red enviou Pikachu!");
    expect(texts.some((t) => t!.includes(" usou "))).toBe(true);
  });
});
