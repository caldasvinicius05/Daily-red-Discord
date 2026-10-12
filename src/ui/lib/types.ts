/** Gen 2–5 types (no Fairy before Gen 6). Colors follow the palette fans commonly use for each type. */
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A77A",
  Fire: "#EE8130",
  Water: "#6390F0",
  Electric: "#F7D02C",
  Grass: "#7AC74C",
  Ice: "#96D9D6",
  Fighting: "#C22E28",
  Poison: "#A33EA1",
  Ground: "#E2BF65",
  Flying: "#A98FF3",
  Psychic: "#F95587",
  Bug: "#A6B91A",
  Rock: "#B6A136",
  Ghost: "#735797",
  Dragon: "#6F35FC",
  Dark: "#705746",
  Steel: "#B7B7CE",
};

export const TYPE_NAMES_PT: Record<string, string> = {
  Normal: "Normal",
  Fire: "Fogo",
  Water: "Água",
  Electric: "Elétrico",
  Grass: "Planta",
  Ice: "Gelo",
  Fighting: "Lutador",
  Poison: "Veneno",
  Ground: "Terra",
  Flying: "Voador",
  Psychic: "Psíquico",
  Bug: "Inseto",
  Rock: "Pedra",
  Ghost: "Fantasma",
  Dragon: "Dragão",
  Dark: "Sombrio",
  Steel: "Aço",
};

export function typeColor(type: string | undefined): string {
  return (type && TYPE_COLORS[type]) || "#8890a8";
}

/** Light text on dark types, dark text on bright ones. */
export function typeTextColor(type: string): string {
  return ["Electric", "Ice", "Ground", "Steel", "Normal", "Bug", "Rock", "Grass"].includes(type) ? "#141a2a" : "#ffffff";
}

// Attacking type → defending types it hits for 2× / ½× / 0× (Gen 2–5 chart).
const SUPER: Record<string, string[]> = {
  Fire: ["Grass", "Ice", "Bug", "Steel"],
  Water: ["Fire", "Ground", "Rock"],
  Electric: ["Water", "Flying"],
  Grass: ["Water", "Ground", "Rock"],
  Ice: ["Grass", "Ground", "Flying", "Dragon"],
  Fighting: ["Normal", "Ice", "Rock", "Dark", "Steel"],
  Poison: ["Grass"],
  Ground: ["Fire", "Electric", "Poison", "Rock", "Steel"],
  Flying: ["Grass", "Fighting", "Bug"],
  Psychic: ["Fighting", "Poison"],
  Bug: ["Grass", "Psychic", "Dark"],
  Rock: ["Fire", "Ice", "Flying", "Bug"],
  Ghost: ["Psychic", "Ghost"],
  Dragon: ["Dragon"],
  Dark: ["Psychic", "Ghost"],
  Steel: ["Ice", "Rock"],
};
const RESISTED: Record<string, string[]> = {
  Normal: ["Rock", "Steel"],
  Fire: ["Fire", "Water", "Rock", "Dragon"],
  Water: ["Water", "Grass", "Dragon"],
  Electric: ["Electric", "Grass", "Dragon"],
  Grass: ["Fire", "Grass", "Poison", "Flying", "Bug", "Dragon", "Steel"],
  Ice: ["Fire", "Water", "Ice", "Steel"],
  Fighting: ["Poison", "Flying", "Psychic", "Bug"],
  Poison: ["Poison", "Ground", "Rock", "Ghost"],
  Ground: ["Grass", "Bug"],
  Flying: ["Electric", "Rock", "Steel"],
  Psychic: ["Psychic", "Steel"],
  Bug: ["Fire", "Fighting", "Poison", "Flying", "Ghost", "Steel"],
  Rock: ["Fighting", "Ground", "Steel"],
  Ghost: ["Dark", "Steel"],
  Dragon: ["Steel"],
  Dark: ["Fighting", "Dark", "Steel"],
  Steel: ["Fire", "Water", "Electric", "Steel"],
};
const IMMUNE: Record<string, string[]> = {
  Normal: ["Ghost"],
  Fighting: ["Ghost"],
  Electric: ["Ground"],
  Poison: ["Steel"],
  Ground: ["Flying"],
  Psychic: ["Dark"],
  Ghost: ["Normal"],
};

/** Damage multiplier of an attacking type against a (possibly dual-typed) defender. */
export function effectiveness(attack: string, defenderTypes: readonly string[]): number {
  return defenderTypes.reduce((mult, def) => {
    if (IMMUNE[attack]?.includes(def)) return 0;
    if (SUPER[attack]?.includes(def)) return mult * 2;
    if (RESISTED[attack]?.includes(def)) return mult * 0.5;
    return mult;
  }, 1);
}

export function effectivenessLabel(mult: number): { text: string; tone: "super" | "weak" | "none" | "neutral" } {
  if (mult === 0) return { text: "Sem efeito", tone: "none" };
  if (mult >= 4) return { text: "Super efetivo ×4", tone: "super" };
  if (mult >= 2) return { text: "Super efetivo", tone: "super" };
  if (mult <= 0.25) return { text: "Muito pouco efetivo", tone: "weak" };
  if (mult < 1) return { text: "Pouco efetivo", tone: "weak" };
  return { text: "Efetivo", tone: "neutral" };
}

export const STATUS_INFO: Record<string, { label: string; color: string; name: string }> = {
  par: { label: "PAR", color: "#f6c945", name: "Paralisado" },
  slp: { label: "DOR", color: "#9aa6c4", name: "Dormindo" },
  brn: { label: "QUE", color: "#ff7a3d", name: "Queimado" },
  psn: { label: "ENV", color: "#c06ee0", name: "Envenenado" },
  tox: { label: "TOX", color: "#9c3fd1", name: "Gravemente envenenado" },
  frz: { label: "CON", color: "#7fd6f0", name: "Congelado" },
};

export const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  atk: "Atq",
  def: "Def",
  spa: "AtE",
  spd: "DfE",
  spe: "Vel",
  accuracy: "Prec",
  evasion: "Eva",
};

export const CATEGORY_PT: Record<string, string> = {
  Physical: "Físico",
  Special: "Especial",
  Status: "Status",
};
