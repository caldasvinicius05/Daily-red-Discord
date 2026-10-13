import type { BattleSide } from "@/domain";

export interface SpriteOptions {
  /**
   * Which perspective to display:
   * - "player" or "back": back sprite (viewed from behind, player in the arena)
   * - "red", "front", or omitted: front sprite (facing forward, opponent / cards / team)
   */
  side?: BattleSide | "player" | "red" | "front" | "back";
  /** Optional Pokédex number from reference.species[nome].num */
  num?: number;
}

/**
 * Normalizes a Pokémon species name into a URL-safe sprite slug.
 * Examples: "Charizard" -> "charizard", "Mr. Mime" -> "mrmime", "Ho-Oh" -> "hooh"
 */
export function toSpriteSlug(species: string): string {
  return species.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Returns the public sprite URL for a Pokémon.
 *
 * Sprites are hosted in `public/sprites/gen5/` and `public/sprites/gen5-back/`.
 * Supports resolution by species name slug and Pokédex number (`num`).
 */
export function getPokemonSprite(species: string, options?: SpriteOptions): string {
  const isBack = options?.side === "player" || options?.side === "back";
  const folder = isBack ? "gen5-back" : "gen5";
  const slug = toSpriteSlug(species);
  const fileName = slug || (options?.num ? `${options.num}` : "0");
  return `/sprites/${folder}/${fileName}.png`;
}
