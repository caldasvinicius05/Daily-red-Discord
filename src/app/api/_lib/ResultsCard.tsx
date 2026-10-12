import type { LeaderboardEntry, ServerSummary } from "@/application/ports";

/** Players drawn on the card; the message text lists the rest. */
export const CARD_MAX_PLAYERS = 6;
const PANEL_WIDTH = 150;
const GAP = 16;
const PADDING = 40;
export const CARD_HEIGHT = 430;

export function cardWidth(summary: ServerSummary): number {
  const shown = Math.max(1, Math.min(summary.entries.length, CARD_MAX_PLAYERS));
  return Math.max(560, PADDING * 2 + shown * PANEL_WIDTH + (shown - 1) * GAP);
}

const COLORS = {
  background: "#0d1326",
  panel: "#151d38",
  line: "#2a3456",
  text: "#e8ecf8",
  dim: "#93a0c4",
  empty: "#253055",
  knocked: "#ff4d5a",
  alive: "#3fcf6e",
  gold: "#ffcb45",
};

function avatarUrl(player: LeaderboardEntry["player"]): string {
  if (/^\d+$/.test(player.id)) {
    if (player.avatar) return `https://cdn.discordapp.com/avatars/${player.id}/${player.avatar}.png?size=128`;
    return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(player.id) >> 22n) % 6n)}.png`;
  }
  return "https://cdn.discordapp.com/embed/avatars/0.png";
}

function verdict(entry: LeaderboardEntry): { label: string; color: string } {
  if (entry.result.abandoned) return { label: "desistiu", color: COLORS.dim };
  return entry.result.won ? { label: "venceu", color: COLORS.alive } : { label: "perdeu", color: COLORS.knocked };
}

function Pips({ filled, color }: { filled: readonly boolean[]; color: string }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {filled.map((on, i) => (
        <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: on ? color : COLORS.empty }} />
      ))}
    </div>
  );
}

function PlayerPanel({ entry }: { entry: LeaderboardEntry }) {
  const { label, color } = verdict(entry);
  const name = entry.player.displayName.length > 13 ? `${entry.player.displayName.slice(0, 12)}…` : entry.player.displayName;
  return (
    <div
      style={{
        width: PANEL_WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "18px 0",
        borderRadius: 20,
        border: `2px solid ${entry.rank === 1 && entry.result.won ? COLORS.gold : COLORS.line}`,
        background: COLORS.panel,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG by next/og */}
      <img src={avatarUrl(entry.player)} width={84} height={84} style={{ borderRadius: 42 }} alt="" />
      <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: COLORS.text }}>{name}</div>
      <div style={{ display: "flex", fontSize: 15, fontWeight: 700, color }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
        <Pips filled={entry.result.redFainted} color={COLORS.knocked} />
        <Pips filled={entry.result.playerAlive} color={COLORS.alive} />
      </div>
    </div>
  );
}

/**
 * The results card attached to the daily message, Wordle style: one panel per player,
 * with two rows of squares — the champion's Pokémon knocked out (red) and the
 * player's Pokémon still standing (green).
 */
export function ResultsCard({ summary }: { summary: ServerSummary }) {
  const shown = summary.entries.slice(0, CARD_MAX_PLAYERS);
  const hidden = summary.entries.length - shown.length;
  const days = summary.streak === 1 ? "dia" : "dias";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        padding: PADDING,
        background: COLORS.background,
        color: COLORS.text,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>
        {`Daily Battle #${summary.challengeNumber} · ${summary.champion.name}`}
      </div>
      <div style={{ display: "flex", gap: GAP }}>
        {shown.length > 0 ? (
          shown.map((entry) => <PlayerPanel key={entry.player.id} entry={entry} />)
        ) : (
          <div style={{ display: "flex", fontSize: 20, color: COLORS.dim }}>Ninguém jogou hoje ainda.</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 28, fontSize: 18, color: COLORS.dim }}>
        <span>{`Sequência: ${summary.streak} ${days}`}</span>
        <span>{`Campeões derrotados: ${summary.championsDefeated}`}</span>
        {hidden > 0 && <span>{`+${hidden} jogadores`}</span>}
      </div>
    </div>
  );
}
