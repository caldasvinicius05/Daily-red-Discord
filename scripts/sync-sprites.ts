import fs from "node:fs";
import path from "node:path";
import showdownPkg from "pokemon-showdown";

const { Dex } = showdownPkg;

const gen3 = Dex.forGen(3);

const root = process.cwd();
const sourceFront = path.join(root, "assets", "gen3");
const sourceBack = path.join(root, "assets", "gen3-back");

if (!fs.existsSync(sourceFront) || !fs.existsSync(sourceBack)) {
  console.error("Diretório assets/gen3 ou assets/gen3-back não encontrado!");
  process.exit(1);
}

const targets = {
  gen3Front: path.join(root, "public", "sprites", "gen3"),
  gen3Back: path.join(root, "public", "sprites", "gen3-back"),
  pokemonFront: path.join(root, "public", "sprites", "pokemon"),
  pokemonBack: path.join(root, "public", "sprites", "pokemon", "back"),
};

for (const dir of Object.values(targets)) {
  fs.mkdirSync(dir, { recursive: true });
}

function syncDirectory(sourceDir: string, targetDirs: string[]) {
  const files = fs.readdirSync(sourceDir);
  let count = 0;

  for (const file of files) {
    const srcPath = path.join(sourceDir, file);
    if (!fs.statSync(srcPath).isFile()) continue;

    const base = file.replace(/\.png$/, "");
    const s = gen3.species.get(base);

    for (const targetDir of targetDirs) {
      // 1. Arquivo pelo nome (ex: pikachu.png)
      const destNamed = path.join(targetDir, file);
      fs.copyFileSync(srcPath, destNamed);

      // 2. Arquivo pelo número da Pokédex (ex: 25.png)
      if (s.exists && s.num > 0) {
        const destNum = path.join(targetDir, `${s.num}.png`);
        fs.copyFileSync(srcPath, destNum);
      }
    }
    count++;
  }
  return count;
}

console.log("Sincronizando sprites frontais...");
const frontCount = syncDirectory(sourceFront, [targets.gen3Front, targets.pokemonFront]);

console.log("Sincronizando sprites traseiros...");
const backCount = syncDirectory(sourceBack, [targets.gen3Back, targets.pokemonBack]);

console.log(`✓ Concluído: ${frontCount} sprites frontais e ${backCount} traseiros sincronizados em public/sprites/!`);
