import { describe, expect, it } from "vitest";
import { getPokemonSprite, toSpriteSlug } from "./sprites";

describe("sprites helper", () => {
  it("normalizes species names to slugs correctly", () => {
    expect(toSpriteSlug("Pikachu")).toBe("pikachu");
    expect(toSpriteSlug("Mr. Mime")).toBe("mrmime");
    expect(toSpriteSlug("Ho-Oh")).toBe("hooh");
    expect(toSpriteSlug("Farfetch'd")).toBe("farfetchd");
    expect(toSpriteSlug("Porygon2")).toBe("porygon2");
  });

  it("returns front sprites by default or for red side", () => {
    expect(getPokemonSprite("Pikachu")).toBe("/sprites/gen5/pikachu.png");
    expect(getPokemonSprite("Pikachu", { side: "red" })).toBe("/sprites/gen5/pikachu.png");
    expect(getPokemonSprite("Pikachu", { side: "front" })).toBe("/sprites/gen5/pikachu.png");
  });

  it("returns back sprites for player side", () => {
    expect(getPokemonSprite("Charizard", { side: "player" })).toBe("/sprites/gen5-back/charizard.png");
    expect(getPokemonSprite("Charizard", { side: "back" })).toBe("/sprites/gen5-back/charizard.png");
  });

  it("uses pokedex number when slug is empty", () => {
    expect(getPokemonSprite("", { num: 25 })).toBe("/sprites/gen5/25.png");
    expect(getPokemonSprite("", { num: 6, side: "player" })).toBe("/sprites/gen5-back/6.png");
  });
});
