import type { Battle } from "pokemon-showdown";

type Side = Battle["p1"];

export interface MoveOption {
  move: string;
  id: string;
  disabled?: string | boolean;
  pp?: number;
}

/** Move options of the side's current request; empty unless it is a move request. */
export function moveOptions(side: Side): MoveOption[] {
  const request = side.activeRequest;
  if (!request || !("active" in request)) return [];
  return (request.active?.[0]?.moves ?? []) as MoveOption[];
}

export function isForcedSwitch(side: Side): boolean {
  const request = side.activeRequest;
  return Boolean(request && "forceSwitch" in request && request.forceSwitch);
}
