import type { BattleEvent, BattleSide, HpSource, MessageTag } from "@/domain";

const STAT_NAMES: Record<string, string> = {
  atk: "Ataque",
  def: "Defesa",
  spa: "Ataque Especial",
  spd: "Defesa Especial",
  spe: "Velocidade",
  accuracy: "Precisão",
  evasion: "Evasão",
};

const STATUS_TEXT: Record<string, string> = {
  par: "foi paralisado",
  slp: "adormeceu",
  brn: "foi queimado",
  psn: "foi envenenado",
  tox: "foi gravemente envenenado",
  frz: "foi congelado",
};

const CURE_TEXT: Record<string, string> = {
  par: "não está mais paralisado",
  slp: "acordou",
  brn: "se curou da queimadura",
  psn: "se curou do veneno",
  tox: "se curou do veneno",
  frz: "descongelou",
};

const CANT_TEXT: Record<string, string> = {
  par: "está paralisado e não consegue se mover",
  slp: "está dormindo",
  frz: "está congelado",
  recharge: "precisa recarregar",
  flinch: "recuou e não conseguiu atacar",
};

const WEATHER: Record<string, { start: string; upkeep: string }> = {
  Sandstorm: { start: "Uma tempestade de areia começou!", upkeep: "A tempestade de areia continua." },
  RainDance: { start: "Começou a chover!", upkeep: "A chuva continua." },
  SunnyDay: { start: "O sol ficou forte!", upkeep: "O sol continua forte." },
  Hail: { start: "Começou a cair granizo!", upkeep: "O granizo continua." },
};

/** HP of the champion's Pokémon is only ever shown as a percentage, like in a real link battle. */
export function toPercent(hp: number, maxHp: number): number {
  if (hp <= 0) return 0;
  return Math.max(1, Math.round((hp / maxHp) * 100));
}

interface Ident {
  side: BattleSide;
  slot: number;
  species: string;
  label: string;
}

/** Who is who in this battle: nicknames are slot ids (`m0`…`m5`), so we need the rosters. */
export interface LogContext {
  /** Species by team slot, per side. */
  roster: Record<BattleSide, readonly string[]>;
  championName: string;
  /** "do Lance", "da Cynthia". */
  championOf: string;
  /** The name the player's side is registered with in the engine, to tell who won. */
  playerName: string;
}

/** Engine nickname for a team slot. Unique per side even with repeated species. */
export function slotNickname(slot: number): string {
  return `m${slot}`;
}

export function slotFromNickname(name: string): number {
  return Number(name.slice(1));
}

/** `p2a: m3` → the champion's Pokémon in slot 3. */
function ident(ctx: LogContext, raw: string | undefined): Ident {
  const [pos = "", name = ""] = (raw ?? "").split(": ");
  const side: BattleSide = pos.startsWith("p1") ? "player" : "red";
  const slot = slotFromNickname(name);
  const species = ctx.roster[side][slot] ?? name;
  return { side, slot, species, label: side === "player" ? species : `${species} ${ctx.championOf}` };
}

/** `86/261 par` or `0 fnt`. */
function parseHp(raw: string | undefined): { hp: number; maxHp: number } {
  const [frac = "0"] = (raw ?? "").split(" ");
  const [hp, max] = frac.split("/").map(Number);
  return { hp: hp ?? 0, maxHp: max ?? 0 };
}

function shownHp(side: BattleSide, hp: number, maxHp: number) {
  return side === "player" ? { hp, maxHp } : { hp: toPercent(hp, maxHp), maxHp: 100 };
}

/** `[from] item: Leftovers` → `item: Leftovers`. */
function fromTag(args: string[]): string | null {
  const tag = args.find((a) => a.startsWith("[from]"));
  return tag ? tag.slice("[from]".length).trim() : null;
}

function hpChangeText(change: "damage" | "heal", who: Ident, from: string | null): string | undefined {
  if (!from) return undefined;
  const source = from.replace(/^(item|ability|move): /, "");
  if (change === "heal") {
    if (from === "drain") return `${who.label} teve a energia drenada.`;
    return `${who.label} recuperou HP com ${source}.`;
  }
  switch (from) {
    case "Recoil":
    case "recoil":
      return `${who.label} sofreu dano de recuo.`;
    case "psn":
    case "tox":
      return `${who.label} sofreu com o veneno.`;
    case "brn":
      return `${who.label} sofreu com a queimadura.`;
    case "Sandstorm":
      return `${who.label} foi atingido pela tempestade de areia.`;
    case "Hail":
      return `${who.label} foi atingido pelo granizo.`;
    case "Leech Seed":
      return `A Leech Seed drenou ${who.label}.`;
    case "confusion":
      return `${who.label} se atingiu na confusão.`;
    default:
      return `${who.label} foi ferido por ${source}.`;
  }
}

/** Groups an HP change's `[from]` tag for the battle log. */
function hpSource(from: string | null): HpSource | undefined {
  if (!from) return undefined;
  if (from.startsWith("item:")) return "item";
  if (["psn", "tox", "brn"].includes(from)) return "status";
  if (["Sandstorm", "Hail"].includes(from)) return "weather";
  if (from.toLowerCase() === "recoil") return "recoil";
  if (from === "drain") return "drain";
  return "effect";
}

const msg = (text: string, tag?: MessageTag): BattleEvent => (tag ? { kind: "message", text, tag } : { kind: "message", text });

/**
 * Translates Showdown protocol lines into battle events.
 * Hidden-information lines come in pairs after `|split|`: the first is the exact
 * (owner) view, the second the public one. We keep the first and convert the champion's HP
 * to a percentage ourselves.
 */
export function translateLog(lines: readonly string[], ctx: LogContext): BattleEvent[] {
  const events: BattleEvent[] = [];
  for (let i = 0; i < lines.length; i++) {
    const [, cmd = "", ...args] = lines[i]!.split("|");
    if (cmd === "split") {
      // Translate the exact line that follows, then skip its public duplicate.
      const [, secretCmd = "", ...secretArgs] = (lines[i + 1] ?? "").split("|");
      const event = translateLine(ctx, secretCmd, secretArgs);
      if (event) events.push(event);
      i += 2;
      continue;
    }
    const event = translateLine(ctx, cmd, args);
    if (event) events.push(event);
  }
  return events;
}

function translateLine(ctx: LogContext, cmd: string, args: string[]): BattleEvent | null {
  switch (cmd) {
    case "turn":
      return { kind: "turn", turn: Number(args[0]), text: `Turno ${args[0]}` };

    case "switch":
    case "drag": {
      const who = ident(ctx, args[0]);
      const { hp, maxHp } = parseHp(args[2]);
      const text =
        who.side === "player"
          ? `Vai, ${who.species}!`
          : cmd === "drag"
            ? `${who.label} foi arrastado para a batalha!`
            : `${ctx.championName} enviou ${who.species}!`;
      return { kind: "switch", side: who.side, slot: who.slot, species: who.species, ...shownHp(who.side, hp, maxHp), text };
    }

    case "move": {
      const who = ident(ctx, args[0]);
      const move = args[1] ?? "";
      return { kind: "move", side: who.side, slot: who.slot, species: who.species, move, text: `${who.label} usou ${move}!` };
    }

    case "-damage":
    case "-heal":
    case "-sethp": {
      const who = ident(ctx, args[0]);
      const { hp, maxHp } = parseHp(args[1]);
      const change = cmd === "-damage" ? "damage" : "heal";
      const from = fromTag(args);
      const text = hpChangeText(change, who, from);
      const source = hpSource(from);
      return {
        kind: "hp",
        side: who.side,
        slot: who.slot,
        species: who.species,
        ...shownHp(who.side, hp, maxHp),
        change,
        ...(text ? { text } : {}),
        ...(source ? { source } : {}),
      };
    }

    case "faint": {
      const who = ident(ctx, args[0]);
      return { kind: "faint", side: who.side, slot: who.slot, species: who.species, text: `${who.label} desmaiou!` };
    }

    case "-status": {
      const who = ident(ctx, args[0]);
      const status = args[1] ?? "";
      return { kind: "status", side: who.side, slot: who.slot, species: who.species, status, text: `${who.label} ${STATUS_TEXT[status] ?? "foi afetado"}!` };
    }

    case "-curestatus": {
      const who = ident(ctx, args[0]);
      const status = args[1] ?? "";
      return { kind: "status", side: who.side, slot: who.slot, species: who.species, status: null, text: `${who.label} ${CURE_TEXT[status] ?? "se curou"}!` };
    }

    case "-boost":
    case "-unboost": {
      const who = ident(ctx, args[0]);
      const stat = args[1] ?? "";
      const n = Number(args[2] ?? 0);
      const amount = cmd === "-boost" ? n : -n;
      const verb = amount > 0 ? (n >= 2 ? "aumentou muito" : "aumentou") : n >= 2 ? "caiu muito" : "caiu";
      const text = n === 0 ? `${STAT_NAMES[stat] ?? stat} de ${who.label} não pode mudar mais!` : `${STAT_NAMES[stat] ?? stat} de ${who.label} ${verb}!`;
      return { kind: "boost", side: who.side, slot: who.slot, species: who.species, stat, amount, text };
    }

    case "-weather": {
      const weather = args[0] ?? "none";
      if (weather === "none") return { kind: "weather", weather: null, text: "O clima voltou ao normal." };
      const upkeep = args.includes("[upkeep]");
      const text = WEATHER[weather]?.[upkeep ? "upkeep" : "start"] ?? weather;
      return { kind: "weather", weather, text };
    }

    case "cant": {
      const who = ident(ctx, args[0]);
      const reason = args[1] ?? "";
      return msg(`${who.label} ${CANT_TEXT[reason] ?? "não conseguiu se mover"}!`, "status");
    }

    case "-supereffective":
      return msg("É super efetivo!", "hit");
    case "-resisted":
      return msg("Não é muito efetivo...", "hit");
    case "-crit":
      return msg("Um golpe crítico!", "hit");
    case "-immune":
      return msg(`Não afeta ${ident(ctx, args[0]).label}...`, "hit");
    case "-miss":
      return msg(`${ident(ctx, args[1] ?? args[0]).label} desviou do ataque!`, "hit");
    case "-fail":
      return msg("Mas falhou!", "hit");
    case "-ohko":
      return msg("É um nocaute instantâneo!", "hit");
    case "-hitcount":
      return msg(`Acertou ${args[1]} vez(es)!`, "hit");

    case "-ability": {
      const who = ident(ctx, args[0]);
      return msg(`[${args[1]} de ${who.label}]`, "ability");
    }
    case "-enditem": {
      const who = ident(ctx, args[0]);
      const eaten = args.includes("[eat]");
      return msg(eaten ? `${who.label} comeu a ${args[1]}!` : `${who.label} perdeu ${args[1]}.`, "item");
    }
    case "-start": {
      const who = ident(ctx, args[0]);
      const effect = (args[1] ?? "").replace(/^move: /, "");
      if (effect === "confusion") return msg(`${who.label} ficou confuso!`, "effect");
      if (effect === "Substitute") return msg(`${who.label} criou um substituto!`, "effect");
      if (effect === "Leech Seed") return msg(`${who.label} foi semeado!`, "effect");
      if (effect === "Taunt") return msg(`${who.label} caiu na provocação!`, "effect");
      return null;
    }
    case "-end": {
      const who = ident(ctx, args[0]);
      const effect = (args[1] ?? "").replace(/^move: /, "");
      if (effect === "confusion") return msg(`${who.label} não está mais confuso!`, "effect");
      if (effect === "Substitute") return msg(`O substituto de ${who.label} sumiu!`, "effect");
      if (effect === "Taunt") return msg(`${who.label} não está mais provocado.`, "effect");
      return null;
    }
    case "-activate": {
      const effect = (args[1] ?? "").replace(/^(move|ability|item): /, "");
      if (effect === "confusion") return msg(`${ident(ctx, args[0]).label} está confuso!`, "effect");
      if (effect === "Substitute") return msg("O substituto recebeu o dano!", "effect");
      return null;
    }

    case "win": {
      const playerWon = args[0] === ctx.playerName;
      return {
        kind: "end",
        winner: playerWon ? "player" : "red",
        text: playerWon ? `Você venceu ${ctx.championName}!` : `${ctx.championName} venceu...`,
      };
    }
    case "tie":
      return { kind: "end", winner: null, text: "Empate!" };

    default:
      return null;
  }
}
