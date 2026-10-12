"use client";

import { createContext, useContext } from "react";
import type { PlayerDTO, ReferenceDTO } from "./api/types";

export interface AppContextValue {
  player: PlayerDTO;
  reference: ReferenceDTO;
  insideDiscord: boolean;
  logout: (() => void) | null;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppContext.Provider>");
  return value;
}

/** Types of a species from the reference data (falls back to Normal for anything unknown). */
export function useSpeciesTypes(): (species: string) => string[] {
  const { reference } = useApp();
  return (species) => reference.species[species]?.types ?? ["Normal"];
}
