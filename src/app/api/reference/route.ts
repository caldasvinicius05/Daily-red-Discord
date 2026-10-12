import { handle } from "../_lib/http";

/** Static per deploy: types, stats and move data for every Pokémon that can appear. */
export const GET = handle(async ({ app }) => app.getReferenceData());
