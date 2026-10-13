import fs from "node:fs";
import path from "node:path";
import showdownPkg from "pokemon-showdown";

const { Dex } = showdownPkg;

// Gen 4 Pokédex: resolves the dex number of every species up to Arceus (493).
const dex = Dex.forGen(4);
const LAST_DEX = 493;

const root = process.cwd();
const sourceFront = path.join(root, "assets", "gen5");
const sourceBack = path.join(root, "assets", "gen5-back");

if (!fs.existsSync(sourceFront) || !fs.existsSync(sourceBack)) {
  console.error("Diretório assets/gen5 ou assets/gen5-back não encontrado!");
  process.exit(1);
}

const targets = {
  gen5Front: path.join(root, "public", "sprites", "gen5"),
  gen5Back: path.join(root, "public", "sprites", "gen5-back"),
};

for (const dir of Object.values(targets)) {
  fs.mkdirSync(dir, { recursive: true });
}

function syncDirectory(sourceDir: string, targetDir: string) {
  const files = fs.readdirSync(sourceDir);
  let count = 0;

  for (const file of files) {
    const srcPath = path.join(sourceDir, file);
    if (!fs.statSync(srcPath).isFile()) continue;

    const base = file.replace(/\.png$/, "");
    const s = dex.species.get(base);

    // Filter to species up to Gen 4 (493), or base non-species files (0.png, substitute.png)
    if (s.exists) {
      if (s.num > LAST_DEX || s.num <= 0) continue;
      // Skip forms from later generations (Megas, Gigantamax, Alola/Galar forms, etc.)
      if (s.forme && !["East", "Sunny", "Rainy", "Snowy", "Attack", "Defense", "Speed", "Fan", "Frost", "Heat", "Mow", "Wash", "Sandy", "Trash"].includes(s.forme)) {
        continue;
      }
    } else if (file !== "0.png" && file !== "substitute.png") {
      continue;
    }

    // 1. Arquivo pelo nome da espécie (ex: garchomp.png)
    const destNamed = path.join(targetDir, file);
    fs.copyFileSync(srcPath, destNamed);

    // 2. Arquivo pelo número da Pokédex (ex: 445.png) se for espécie base
    if (s.exists && s.num > 0 && !s.forme) {
      const destNum = path.join(targetDir, `${s.num}.png`);
      fs.copyFileSync(srcPath, destNum);
    }
    count++;
  }
  return count;
}

console.log("Sincronizando sprites frontais...");
const frontCount = syncDirectory(sourceFront, targets.gen5Front);

console.log("Sincronizando sprites traseiros...");
const backCount = syncDirectory(sourceBack, targets.gen5Back);

console.log(`✓ Concluído: ${frontCount} sprites frontais e ${backCount} traseiros sincronizados em public/sprites/gen5/!`);

