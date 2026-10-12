import type { LeaderboardEntry } from "@/application/useCases";
import { challengeNumber } from "@/domain";

const MEDALS = ["🥇", "🥈", "🥉"];
const RED = 0xff3d4a;
const MAX_LINES = 15;

function describe(entry: LeaderboardEntry): string {
  const { result } = entry;
  if (result.abandoned) return "desistiu 🏳️";
  if (result.won) {
    const left = result.playerAlive.filter(Boolean).length;
    return `venceu · ${left}/6 de pé · ${result.turns} turnos`;
  }
  const kos = result.redFainted.filter(Boolean).length;
  return `perdeu · ${kos}/6 derrubados`;
}

/** Real Discord ids become mentions (shown as names, without pinging); test players stay plain text. */
function who(entry: LeaderboardEntry): string {
  return /^\d+$/.test(entry.player.id) ? `<@${entry.player.id}>` : `**${entry.player.displayName}**`;
}

/** Message body for the `/dailyred` command: today's ranking as an embed. */
export function leaderboardMessage(date: string, entries: LeaderboardEntry[]) {
  const lines = entries.slice(0, MAX_LINES).map((e) => `${MEDALS[e.rank - 1] ?? `\`${e.rank}.\``} ${who(e)} — ${describe(e)}`);
  if (entries.length > MAX_LINES) lines.push(`…e mais ${entries.length - MAX_LINES}.`);

  return {
    // Never ping anyone from a ranking.
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: `Daily Red #${challengeNumber(date)} — ranking de hoje`,
        color: RED,
        description:
          lines.length > 0
            ? lines.join("\n")
            : "Ninguém deste servidor enfrentou o Red hoje ainda.\nEntre num canal de voz e abra a atividade para ser o primeiro!",
        footer: { text: "Uma batalha por dia contra o Red no Monte Prateado" },
      },
    ],
  };
}
