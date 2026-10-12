import type { BattleResult } from "../entities";

/** Spoiler-free summary players can paste in the channel. */
export function buildShareText(result: BattleResult, challengeNumber: number, winStreak: number): string {
  const header = `Daily Red #${challengeNumber}`;

  if (result.abandoned) {
    return `${header} — desisti da batalha 🏳️`;
  }

  if (result.won) {
    const left = result.playerAlive.filter(Boolean).length;
    const grid = result.playerAlive.map((alive) => (alive ? "🟩" : "⬛")).join("");
    return [
      `${header} — venci o Red! 🏆`,
      `${grid} ${left}/6 de pé · ${turnsLabel(result.turns)}`,
      `🔥 Sequência: ${winStreak}`,
    ].join("\n");
  }

  const knocked = result.redFainted.filter(Boolean).length;
  const grid = result.redFainted.map((fainted) => (fainted ? "🟥" : "⬛")).join("");
  return [`${header} — o Red venceu 💀`, `${grid} ${knocked}/6 derrubados · ${turnsLabel(result.turns)}`].join("\n");
}

function turnsLabel(turns: number): string {
  return turns === 1 ? "1 turno" : `${turns} turnos`;
}
