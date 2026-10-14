/**
 * Downloads Smogon's competitive sets for Gen 4 singles (via the pkmn project's JSON
 * export of the Smogon analyses), turns each one into a concrete set and keeps the ones
 * Showdown's validator accepts:
 *   npm run update-sets
 *
 * Output: src/infrastructure/showdown/data/smogon-sets.gen4.json — the daily team picks
 * from it, so the app never needs the network for sets. Run again to refresh the data
 * (then bump DATA_VERSION, since the daily builds change).
 */
import fs from "node:fs";
import path from "node:path";
import showdownPkg from "pokemon-showdown";

const { Dex, TeamValidator } = showdownPkg;

const GEN = 4;
const LAST_DEX_NUMBER = 493;
const SOURCE = `https://pkmn.github.io/smogon/data/sets/gen${GEN}.json`;
/** Singles formats only, strongest first (no Little Cup, doubles, VGC or CAP). */
const FORMATS = ["ubers", "ou", "uu", "nu", "pu", "zu", "anythinggoes"];
const OUTPUT = path.join(process.cwd(), "src", "infrastructure", "showdown", "data", `smogon-sets.gen${GEN}.json`);

type Stats = Partial<Record<"hp" | "atk" | "def" | "spa" | "spd" | "spe", number>>;
type OneOrMany<T> = T | T[];

interface RawSet {
  moves: OneOrMany<string>[];
  item?: OneOrMany<string>;
  ability?: OneOrMany<string>;
  nature?: OneOrMany<string>;
  evs?: OneOrMany<Stats>;
  ivs?: OneOrMany<Stats>;
}

interface CompetitiveSet {
  /** Smogon's name for the set, e.g. "Swords Dance". */
  name: string;
  format: string;
  item: string;
  ability: string;
  nature: string;
  evs: Stats;
  ivs?: Stats;
  moves: string[];
}

const dex = Dex.forGen(GEN);
const validator = TeamValidator.get(`gen${GEN}ubers`);
const first = <T>(value: OneOrMany<T> | undefined): T | undefined => (Array.isArray(value) ? value[0] : value);
const isChoice = (item: string) => /^Choice /.test(item);

const STATS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

/**
 * Before Gen 7 the Hidden Power type comes from the IVs. Keeps the IVs Smogon fixes on
 * purpose (e.g. 29 HP for Life Orb recoil) and finds 30/31 values for the others that
 * give the wanted type, as close to all-31 as possible.
 */
function hiddenPowerIvs(type: string, fixed: Stats = {}): Stats | undefined {
  const free = STATS.filter((stat) => fixed[stat] === undefined);
  let best: Stats | undefined;
  let bestPerfect = -1;
  for (let mask = 0; mask < 1 << free.length; mask++) {
    const ivs: Stats = { ...fixed };
    free.forEach((stat, i) => (ivs[stat] = mask & (1 << i) ? 30 : 31));
    const full = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31, ...ivs };
    if (dex.getHiddenPower(full).type !== type) continue;
    const perfect = free.filter((stat) => ivs[stat] === 31).length;
    if (perfect > bestPerfect) {
      bestPerfect = perfect;
      best = Object.fromEntries(Object.entries(ivs).filter(([, v]) => v !== 31));
    }
  }
  // No combination keeps the fixed IVs: the type matters more than the fine-tuning.
  return best ?? (dex.types.get(type).HPivs as Stats);
}

/** Smogon lists alternatives with slashes; the first one is the main recommendation. */
function realize(species: string, format: string, name: string, raw: RawSet): CompetitiveSet {
  const moves: string[] = [];
  for (const slot of raw.moves) {
    const option = ([] as string[]).concat(slot).find((m) => !moves.includes(m));
    if (option) moves.push(option);
  }

  const items = ([] as string[]).concat(raw.item ?? []);
  // Choice items lock the holder into one move; the app replaces them, so prefer another option.
  const item = items.find((i) => !isChoice(i)) ?? items[0] ?? "";

  const hiddenPower = moves.find((m) => m.startsWith("Hidden Power "));
  const ivs = hiddenPower ? hiddenPowerIvs(hiddenPower.slice("Hidden Power ".length), first(raw.ivs)) : first(raw.ivs);

  const set: CompetitiveSet = {
    name,
    format,
    item,
    ability: first(raw.ability) ?? dex.species.get(species).abilities[0],
    nature: first(raw.nature) ?? "Serious",
    evs: first(raw.evs) ?? {},
    moves,
  };
  if (ivs && Object.keys(ivs).length > 0) set.ivs = ivs;
  return set;
}

function problems(species: string, set: CompetitiveSet): string[] {
  const full = (stats: Stats | undefined, fill: number) => ({ hp: fill, atk: fill, def: fill, spa: fill, spd: fill, spe: fill, ...stats });
  const team = [{ ...set, name: species, species, evs: full(set.evs, 0), ivs: full(set.ivs, 31), level: 100, gender: "" }];
  return validator.validateTeam(team as never) ?? [];
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Não foi possível baixar os sets (${response.status})`);
const data = (await response.json()) as Record<string, Record<string, Record<string, RawSet>>>;

const output: Record<string, CompetitiveSet[]> = {};
let kept = 0;
const rejected: string[] = [];

for (const [species, byFormat] of Object.entries(data)) {
  const s = dex.species.get(species);
  if (!s.exists || s.num < 1 || s.num > LAST_DEX_NUMBER || s.name !== s.baseSpecies) continue;
  for (const format of FORMATS) {
    for (const [name, raw] of Object.entries(byFormat[format] ?? {})) {
      const set = realize(s.name, format, name, raw);
      const errors = problems(s.name, set);
      if (errors.length > 0) {
        rejected.push(`${s.name} (${format}, ${name}): ${errors[0]}`);
        continue;
      }
      (output[s.name] ??= []).push(set);
      kept++;
    }
  }
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
const sorted = Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUTPUT, `${JSON.stringify(sorted, null, 1)}\n`);

console.log(`✓ ${kept} sets de ${Object.keys(output).length} espécies salvos em ${path.relative(process.cwd(), OUTPUT)}`);
if (rejected.length > 0) {
  console.log(`${rejected.length} sets recusados pelo validador:`);
  for (const line of rejected) console.log(`  - ${line}`);
}
