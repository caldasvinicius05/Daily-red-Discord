import type { LeaderboardEntry, ServerSummary } from "@/application/ports";
import { challengeNumber, type ChampionSummary } from "@/domain";

const MEDALS = ["🥇", "🥈", "🥉"];
const ACCENT = 0xff3d4a;
const MAX_LINES = 15;
/** Lines of the ranking shown in the daily results message. */
const TOP_LINES = 10;
/** `custom_id` of the "Jogar agora!" button; the interactions endpoint answers it by opening the Activity. */
export const LAUNCH_BUTTON_ID = "launch_activity";

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

/** Message body for the `/dailybattle` command: today's ranking as an embed. */
export function leaderboardMessage(date: string, champion: ChampionSummary, entries: LeaderboardEntry[]) {
  const lines = entries.slice(0, MAX_LINES).map((e) => `${MEDALS[e.rank - 1] ?? `\`${e.rank}.\``} ${who(e)} — ${describe(e)}`);
  if (entries.length > MAX_LINES) lines.push(`…e mais ${entries.length - MAX_LINES}.`);

  const empty = [
    `Ninguém deste servidor enfrentou ${champion.name} hoje ainda.`,
    "Entre num canal de voz e abra a atividade para ser o primeiro!",
  ].join("\n");

  return {
    // Never ping anyone from a ranking.
    allowed_mentions: { parse: [] as string[] },
    embeds: [
      {
        title: `Daily Battle #${challengeNumber(date)} — ${champion.name}`,
        color: ACCENT,
        description: lines.length > 0 ? lines.join("\n") : empty,
        footer: { text: `Ranking de hoje · ${champion.title} · ${champion.location}` },
      },
    ],
  };
}

/** Medal for the podium, `4.` and so on after it; `first` replaces the gold medal. */
function rankMark(rank: number, first = MEDALS[0]!): string {
  if (rank === 1) return first;
  return MEDALS[rank - 1] ?? `\`${rank}.\``;
}

const plural =(n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The Wordle-style message posted in the Activity's channel when someone finishes the
 * daily (and edited as more people finish): server streak, all-time champions defeated,
 * today's top players, the results card and a button that opens the Activity.
 */
export function dailySummaryMessage(summary: ServerSummary, cardUrl: string | null) {
  const { champion, entries } = summary;
  const headline =
    summary.streak > 1
      ? `**O servidor está numa sequência de ${plural(summary.streak, "dia", "dias")}!** 🔥`
      : "**O servidor começou uma nova sequência!** 🔥";
  const defeated = `Campeões derrotados no total: **${summary.championsDefeated}** 🏆`;

  const top = entries.slice(0, TOP_LINES).map((e) => `${rankMark(e.rank, "👑")} ${who(e)} — ${describe(e)}`);
  if (entries.length > TOP_LINES) top.push(`…e mais ${entries.length - TOP_LINES}.`);
  if (top.length === 0) top.push(`Ninguém deste servidor enfrentou ${champion.name} hoje ainda.`);

  return {
    content: [headline, defeated, "", `Resultados de hoje contra **${champion.name}**:`, ...top].join("\n"),
    allowed_mentions: { parse: [] as string[] },
    embeds: cardUrl
      ? [
          {
            title: `Daily Battle #${summary.challengeNumber} — ${champion.name}`,
            color: ACCENT,
            image: { url: cardUrl },
            footer: { text: `${champion.title} · ${champion.location}` },
          },
        ]
      : [],
    components: [
      {
        type: 1,
        components: [{ type: 2, style: 1, label: "Jogar agora!", custom_id: LAUNCH_BUTTON_ID }],
      },
    ],
  };
}
