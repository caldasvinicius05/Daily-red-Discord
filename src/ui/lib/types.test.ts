import { describe, expect, it } from "vitest";
import { effectiveness, effectivenessLabel } from "./types";

describe("type chart (Gen 2–5)", () => {
  it("handles single types", () => {
    expect(effectiveness("Water", ["Fire"])).toBe(2);
    expect(effectiveness("Fire", ["Water"])).toBe(0.5);
    expect(effectiveness("Electric", ["Ground"])).toBe(0);
    expect(effectiveness("Normal", ["Psychic"])).toBe(1);
  });

  it("multiplies dual types", () => {
    expect(effectiveness("Ice", ["Dragon", "Flying"])).toBe(4); // Salamence
    expect(effectiveness("Electric", ["Water", "Flying"])).toBe(4); // Gyarados
    expect(effectiveness("Ground", ["Fire", "Flying"])).toBe(0); // Charizard
    expect(effectiveness("Grass", ["Grass", "Poison"])).toBe(0.25); // Venusaur
  });

  it("uses pre-Gen 6 Steel resistances", () => {
    expect(effectiveness("Dark", ["Steel"])).toBe(0.5);
    expect(effectiveness("Ghost", ["Steel"])).toBe(0.5);
  });

  it("labels multipliers", () => {
    expect(effectivenessLabel(4).tone).toBe("super");
    expect(effectivenessLabel(0.5).text).toBe("Pouco efetivo");
    expect(effectivenessLabel(0).tone).toBe("none");
  });
});
