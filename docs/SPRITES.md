# Guia de sprites

O app funciona sem nenhum sprite: quando a imagem de um Pokémon não existe, `PokemonEmblem` mostra o emblema por tipo. Os sprites podem ser adicionados aos poucos.

## Onde colocar

```
public/sprites/
├─ gen5/         frente (oponente, cards, times, listas)
└─ gen5-back/    costas (o seu Pokémon na arena)
```

Os nomes das pastas vêm de [`src/ui/lib/sprites.ts`](../src/ui/lib/sprites.ts). Se mudar o nome delas, mude também esse arquivo.

## Nome dos arquivos

`<slug>.png`, em que o slug é o nome da espécie em minúsculas, só com letras e números (`toSpriteSlug`):

| Espécie | Arquivo |
|---|---|
| Garchomp | `garchomp.png` |
| Porygon-Z | `porygonz.png` |
| Mr. Mime | `mrmime.png` |
| Farfetch'd | `farfetchd.png` |
| Ho-Oh | `hooh.png` |

Se o arquivo pelo nome não existir, o app tenta pelo número da Pokédex (`445.png`) e, por fim, cai no emblema. Basta um dos dois nomes.

## Recomendações

- **PNG com fundo transparente.** O app não recorta fundo.
- **Mesmo tamanho para todos** (ex.: 96×96 ou 80×80, como os sprites originais de GBA/DS), com o Pokémon centralizado e "pisando" perto da base da imagem. Tamanhos misturados ficam desalinhados na arena.
- **Pixel art:** o app já desenha sem suavização; não precisa aumentar a imagem antes.
- **Costas:** sem o sprite de costas, o seu Pokémon na arena cai no emblema. Se só tiver frente, dá para copiar o mesmo arquivo para `gen5-back/` como paliativo.

## Usando a pasta `assets/` (opcional)

Se preferir guardar os originais em `assets/gen5` e `assets/gen5-back` (mesmos nomes de arquivo), `npm run sync-sprites` copia tudo para `public/sprites/` e cria também as cópias pelo número da Pokédex.

## Publicar

As pastas `assets/` e `public/sprites/` estão no `.gitignore` desde que os sprites antigos foram removidos do repositório. Quando os novos estiverem prontos:

1. Tire a linha `public/sprites/` do `.gitignore` (deixe `assets/` se quiser manter os originais só na sua máquina).
2. `git add public/sprites`, commit e push. A Vercel publica junto.
3. Abra a atividade e confira a arena (frente e costas), a tela de escolha e o painel de troca.

## Checklist: todos os Pokémon que podem aparecer

230 espécies: o pool do jogador (formas finais até a Gen 4, sem lendários) e os times dos campeões (inclui Pikachu, que só o Red usa). Gerada a partir do código; se o pool mudar, gere de novo.

### Novos da Gen 4 (54)

| Nº | Pokémon | Arquivo |
|---|---|---|
| 389 | Torterra | `torterra.png` |
| 392 | Infernape | `infernape.png` |
| 395 | Empoleon | `empoleon.png` |
| 398 | Staraptor | `staraptor.png` |
| 400 | Bibarel | `bibarel.png` |
| 402 | Kricketune | `kricketune.png` |
| 405 | Luxray | `luxray.png` |
| 407 | Roserade | `roserade.png` |
| 409 | Rampardos | `rampardos.png` |
| 411 | Bastiodon | `bastiodon.png` |
| 413 | Wormadam | `wormadam.png` |
| 414 | Mothim | `mothim.png` |
| 416 | Vespiquen | `vespiquen.png` |
| 417 | Pachirisu | `pachirisu.png` |
| 419 | Floatzel | `floatzel.png` |
| 421 | Cherrim | `cherrim.png` |
| 423 | Gastrodon | `gastrodon.png` |
| 424 | Ambipom | `ambipom.png` |
| 426 | Drifblim | `drifblim.png` |
| 428 | Lopunny | `lopunny.png` |
| 429 | Mismagius | `mismagius.png` |
| 430 | Honchkrow | `honchkrow.png` |
| 432 | Purugly | `purugly.png` |
| 435 | Skuntank | `skuntank.png` |
| 437 | Bronzong | `bronzong.png` |
| 441 | Chatot | `chatot.png` |
| 442 | Spiritomb | `spiritomb.png` |
| 445 | Garchomp | `garchomp.png` |
| 448 | Lucario | `lucario.png` |
| 450 | Hippowdon | `hippowdon.png` |
| 452 | Drapion | `drapion.png` |
| 454 | Toxicroak | `toxicroak.png` |
| 455 | Carnivine | `carnivine.png` |
| 457 | Lumineon | `lumineon.png` |
| 460 | Abomasnow | `abomasnow.png` |
| 461 | Weavile | `weavile.png` |
| 462 | Magnezone | `magnezone.png` |
| 463 | Lickilicky | `lickilicky.png` |
| 464 | Rhyperior | `rhyperior.png` |
| 465 | Tangrowth | `tangrowth.png` |
| 466 | Electivire | `electivire.png` |
| 467 | Magmortar | `magmortar.png` |
| 468 | Togekiss | `togekiss.png` |
| 469 | Yanmega | `yanmega.png` |
| 470 | Leafeon | `leafeon.png` |
| 471 | Glaceon | `glaceon.png` |
| 472 | Gliscor | `gliscor.png` |
| 473 | Mamoswine | `mamoswine.png` |
| 474 | Porygon-Z | `porygonz.png` |
| 475 | Gallade | `gallade.png` |
| 476 | Probopass | `probopass.png` |
| 477 | Dusknoir | `dusknoir.png` |
| 478 | Froslass | `froslass.png` |
| 479 | Rotom | `rotom.png` |

### Gerações 1 a 3 (176)

| Nº | Pokémon | Arquivo |
|---|---|---|
| 3 | Venusaur | `venusaur.png` |
| 6 | Charizard | `charizard.png` |
| 9 | Blastoise | `blastoise.png` |
| 12 | Butterfree | `butterfree.png` |
| 15 | Beedrill | `beedrill.png` |
| 18 | Pidgeot | `pidgeot.png` |
| 20 | Raticate | `raticate.png` |
| 22 | Fearow | `fearow.png` |
| 24 | Arbok | `arbok.png` |
| 25 | Pikachu | `pikachu.png` |
| 26 | Raichu | `raichu.png` |
| 28 | Sandslash | `sandslash.png` |
| 31 | Nidoqueen | `nidoqueen.png` |
| 34 | Nidoking | `nidoking.png` |
| 36 | Clefable | `clefable.png` |
| 38 | Ninetales | `ninetales.png` |
| 40 | Wigglytuff | `wigglytuff.png` |
| 45 | Vileplume | `vileplume.png` |
| 47 | Parasect | `parasect.png` |
| 49 | Venomoth | `venomoth.png` |
| 51 | Dugtrio | `dugtrio.png` |
| 53 | Persian | `persian.png` |
| 55 | Golduck | `golduck.png` |
| 57 | Primeape | `primeape.png` |
| 59 | Arcanine | `arcanine.png` |
| 62 | Poliwrath | `poliwrath.png` |
| 65 | Alakazam | `alakazam.png` |
| 68 | Machamp | `machamp.png` |
| 71 | Victreebel | `victreebel.png` |
| 73 | Tentacruel | `tentacruel.png` |
| 76 | Golem | `golem.png` |
| 78 | Rapidash | `rapidash.png` |
| 80 | Slowbro | `slowbro.png` |
| 83 | Farfetch’d | `farfetchd.png` |
| 85 | Dodrio | `dodrio.png` |
| 87 | Dewgong | `dewgong.png` |
| 89 | Muk | `muk.png` |
| 91 | Cloyster | `cloyster.png` |
| 94 | Gengar | `gengar.png` |
| 97 | Hypno | `hypno.png` |
| 99 | Kingler | `kingler.png` |
| 101 | Electrode | `electrode.png` |
| 103 | Exeggutor | `exeggutor.png` |
| 105 | Marowak | `marowak.png` |
| 106 | Hitmonlee | `hitmonlee.png` |
| 107 | Hitmonchan | `hitmonchan.png` |
| 110 | Weezing | `weezing.png` |
| 112 | Rhydon | `rhydon.png` |
| 115 | Kangaskhan | `kangaskhan.png` |
| 119 | Seaking | `seaking.png` |
| 121 | Starmie | `starmie.png` |
| 122 | Mr. Mime | `mrmime.png` |
| 124 | Jynx | `jynx.png` |
| 127 | Pinsir | `pinsir.png` |
| 128 | Tauros | `tauros.png` |
| 130 | Gyarados | `gyarados.png` |
| 131 | Lapras | `lapras.png` |
| 132 | Ditto | `ditto.png` |
| 134 | Vaporeon | `vaporeon.png` |
| 135 | Jolteon | `jolteon.png` |
| 136 | Flareon | `flareon.png` |
| 139 | Omastar | `omastar.png` |
| 141 | Kabutops | `kabutops.png` |
| 142 | Aerodactyl | `aerodactyl.png` |
| 143 | Snorlax | `snorlax.png` |
| 149 | Dragonite | `dragonite.png` |
| 154 | Meganium | `meganium.png` |
| 157 | Typhlosion | `typhlosion.png` |
| 160 | Feraligatr | `feraligatr.png` |
| 162 | Furret | `furret.png` |
| 164 | Noctowl | `noctowl.png` |
| 166 | Ledian | `ledian.png` |
| 168 | Ariados | `ariados.png` |
| 169 | Crobat | `crobat.png` |
| 171 | Lanturn | `lanturn.png` |
| 178 | Xatu | `xatu.png` |
| 181 | Ampharos | `ampharos.png` |
| 182 | Bellossom | `bellossom.png` |
| 184 | Azumarill | `azumarill.png` |
| 185 | Sudowoodo | `sudowoodo.png` |
| 186 | Politoed | `politoed.png` |
| 189 | Jumpluff | `jumpluff.png` |
| 192 | Sunflora | `sunflora.png` |
| 195 | Quagsire | `quagsire.png` |
| 196 | Espeon | `espeon.png` |
| 197 | Umbreon | `umbreon.png` |
| 199 | Slowking | `slowking.png` |
| 202 | Wobbuffet | `wobbuffet.png` |
| 203 | Girafarig | `girafarig.png` |
| 205 | Forretress | `forretress.png` |
| 206 | Dunsparce | `dunsparce.png` |
| 208 | Steelix | `steelix.png` |
| 210 | Granbull | `granbull.png` |
| 211 | Qwilfish | `qwilfish.png` |
| 212 | Scizor | `scizor.png` |
| 213 | Shuckle | `shuckle.png` |
| 214 | Heracross | `heracross.png` |
| 217 | Ursaring | `ursaring.png` |
| 219 | Magcargo | `magcargo.png` |
| 222 | Corsola | `corsola.png` |
| 224 | Octillery | `octillery.png` |
| 225 | Delibird | `delibird.png` |
| 226 | Mantine | `mantine.png` |
| 227 | Skarmory | `skarmory.png` |
| 229 | Houndoom | `houndoom.png` |
| 230 | Kingdra | `kingdra.png` |
| 232 | Donphan | `donphan.png` |
| 234 | Stantler | `stantler.png` |
| 235 | Smeargle | `smeargle.png` |
| 237 | Hitmontop | `hitmontop.png` |
| 241 | Miltank | `miltank.png` |
| 242 | Blissey | `blissey.png` |
| 248 | Tyranitar | `tyranitar.png` |
| 254 | Sceptile | `sceptile.png` |
| 257 | Blaziken | `blaziken.png` |
| 260 | Swampert | `swampert.png` |
| 262 | Mightyena | `mightyena.png` |
| 264 | Linoone | `linoone.png` |
| 267 | Beautifly | `beautifly.png` |
| 269 | Dustox | `dustox.png` |
| 272 | Ludicolo | `ludicolo.png` |
| 275 | Shiftry | `shiftry.png` |
| 277 | Swellow | `swellow.png` |
| 279 | Pelipper | `pelipper.png` |
| 282 | Gardevoir | `gardevoir.png` |
| 284 | Masquerain | `masquerain.png` |
| 286 | Breloom | `breloom.png` |
| 289 | Slaking | `slaking.png` |
| 291 | Ninjask | `ninjask.png` |
| 292 | Shedinja | `shedinja.png` |
| 295 | Exploud | `exploud.png` |
| 297 | Hariyama | `hariyama.png` |
| 301 | Delcatty | `delcatty.png` |
| 302 | Sableye | `sableye.png` |
| 303 | Mawile | `mawile.png` |
| 306 | Aggron | `aggron.png` |
| 308 | Medicham | `medicham.png` |
| 310 | Manectric | `manectric.png` |
| 311 | Plusle | `plusle.png` |
| 312 | Minun | `minun.png` |
| 313 | Volbeat | `volbeat.png` |
| 314 | Illumise | `illumise.png` |
| 317 | Swalot | `swalot.png` |
| 319 | Sharpedo | `sharpedo.png` |
| 321 | Wailord | `wailord.png` |
| 323 | Camerupt | `camerupt.png` |
| 324 | Torkoal | `torkoal.png` |
| 326 | Grumpig | `grumpig.png` |
| 327 | Spinda | `spinda.png` |
| 330 | Flygon | `flygon.png` |
| 332 | Cacturne | `cacturne.png` |
| 334 | Altaria | `altaria.png` |
| 335 | Zangoose | `zangoose.png` |
| 336 | Seviper | `seviper.png` |
| 337 | Lunatone | `lunatone.png` |
| 338 | Solrock | `solrock.png` |
| 340 | Whiscash | `whiscash.png` |
| 342 | Crawdaunt | `crawdaunt.png` |
| 344 | Claydol | `claydol.png` |
| 346 | Cradily | `cradily.png` |
| 348 | Armaldo | `armaldo.png` |
| 350 | Milotic | `milotic.png` |
| 351 | Castform | `castform.png` |
| 352 | Kecleon | `kecleon.png` |
| 354 | Banette | `banette.png` |
| 357 | Tropius | `tropius.png` |
| 358 | Chimecho | `chimecho.png` |
| 359 | Absol | `absol.png` |
| 362 | Glalie | `glalie.png` |
| 365 | Walrein | `walrein.png` |
| 367 | Huntail | `huntail.png` |
| 368 | Gorebyss | `gorebyss.png` |
| 369 | Relicanth | `relicanth.png` |
| 370 | Luvdisc | `luvdisc.png` |
| 373 | Salamence | `salamence.png` |
| 376 | Metagross | `metagross.png` |
