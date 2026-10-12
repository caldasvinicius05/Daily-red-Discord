import { Dex } from "pokemon-showdown";

/** The generation every battle, set and Pokédex lookup follows. */
export const GEN = 4;
/** Last National Dex number of that generation (Arceus). */
export const LAST_DEX_NUMBER = 493;
export const dex = Dex.forGen(GEN);
