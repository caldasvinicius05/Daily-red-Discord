# Daily Battle

Uma batalha por dia contra um campeão das gerações 1 a 4 — como uma **Atividade do Discord** para jogar com os amigos.

Todo mundo do servidor recebe **o mesmo time de seis Pokémon** a cada dia e tem **uma única chance** na diária. O resultado entra no ranking do servidor e pode ser postado no chat. O modo treino é ilimitado e não conta para nada.

> Projeto pessoal e sem fins comerciais, feito para um servidor privado de amigos. Não é afiliado à Nintendo, Creatures Inc., GAME FREAK ou The Pokémon Company. Nomes de Pokémon, golpes e itens pertencem aos seus donos. A interface usa apenas arte original (emblemas por tipo).

## Como funciona

- **Time do dia:** uma seed baseada na data sorteia 6 Pokémon entre os 227 em forma final das gerações 1 a 4 (sem lendários), cada um com um **set do Smogon** para singles da Gen 4 (golpes, item, habilidade, natureza, EVs e IVs), todos no nível 100. Sets com item Choice só são usados quando a espécie não tem outro. Pokémon que ganharam evolução na Gen 4 aparecem já evoluídos (Murkrow → Honchkrow, Electabuzz → Electivire). Itens que prendem num golpe só (Choice Band, Specs e Scarf) viram Leftovers. O "dia" segue o horário de São Paulo, então todos do servidor estão sempre no mesmo desafio.
- **Mesma sorte para todos:** a diária usa a mesma seed de batalha para todo mundo — quem fizer as mesmas escolhas tem exatamente o mesmo resultado.
- **Campeões:** Blue (time do Ginásio de Viridian em HeartGold/SoulSilver), Lance, Red, Steven, Wallace e Cynthia (time de Platinum), com sets competitivos validados nas regras da Gen 4. O campeão do dia é sorteado entre os que **ainda não apareceram na semana** (segunda a domingo) e fica guardado no banco. Com 6 campeões, todos aparecem uma vez e o domingo começa uma nova rodada, nunca repetindo o campeão do dia anterior. O campeão começa sempre com o primeiro Pokémon do time e escolhe golpes com base em cálculo de dano.
- **Treino:** ilimitado, com o mesmo time do dia; o jogador escolhe o campeão (ou deixa no sorteio).
- **Batalha:** motor do Pokémon Showdown com as regras da Gen 4 (cada golpe com sua categoria física/especial).
- **Resultado no canal:** quando alguém termina a diária, o bot posta no canal da atividade uma mensagem no estilo do Wordle — sequência de dias do servidor, campeões derrotados no total, top do dia, um card com o resultado de cada jogador e o botão **Jogar agora!**. A mensagem é editada conforme mais gente termina (uma por servidor por dia).

## Versões

| Versão | Nome | O que mudou |
|---|---|---|
| 1.0 | Daily Red | Uma batalha por dia contra o Red |
| 2.0 | Daily Champion | Campeões das gerações 1 a 3 com rodízio semanal, pool com todas as formas finais |
| 2.1 | Daily Battle | Um único time do Blue (Viridian, HGSS), sem Choice Band no time do jogador, tipos visíveis na troca |
| 3.0 | Daily Battle | Gen 4: Cynthia, pool até Arceus com evoluções da Gen 4, escolha do campeão no treino, mensagem de resultado estilo Wordle |
| 3.1 | Daily Battle | Time do jogador com sets reais do Smogon (EVs, naturezas, IVs e golpes competitivos), treino que continua de onde parou |

## Funcionalidades

- Tela inicial com o time do dia, contagem para o próximo, campeão do dia, estatísticas e ranking do servidor
- Escolha do Pokémon inicial com leitura rápida do confronto
- Batalha animada: barras de HP, narração em português, clima, mudanças de atributo, dicas de efetividade
- Histórico sempre aberto ao lado, com dano/cura exatos, itens, status e trocas
- Painel de troca compacto sobre a arena, com os tipos de cada Pokémon
- Resultado com texto para compartilhar, botão **Postar no Discord** e resumo do servidor (sequência, campeões derrotados, top do dia)
- Mensagem automática do resultado do dia no canal, estilo Wordle
- Painel **Na atividade agora** com o status do dia de quem está na atividade
- Comando **`/dailybattle`** com o ranking de hoje no chat
- Estatísticas: jogos, % de vitórias, sequência, recorde e dias seguidos

## Stack

| Parte | Tecnologia |
|---|---|
| App e API | Next.js 16 (App Router, Route Handlers), React 19, TypeScript |
| Batalha | [`pokemon-showdown`](https://www.npmjs.com/package/pokemon-showdown) (MIT) + [`@smogon/calc`](https://www.npmjs.com/package/@smogon/calc) para a IA |
| Banco | SQLite via Drizzle ORM + libSQL (arquivo local; [Turso](https://turso.tech) em produção) |
| Discord | Embedded App SDK (atividade), OAuth2, Interactions (comando `/dailybattle`) |
| Testes | Vitest |
| Deploy | Vercel + Turso |

## Arquitetura

Arquitetura em camadas dentro de um único app Next.js. As dependências apontam sempre para dentro: o domínio não conhece nada de fora.

```
src/
├─ domain/          Regras puras: campeões, rodízio semanal, seed do dia, estatísticas, ranking, texto do resultado
├─ application/     Casos de uso + "ports" (interfaces): batalhas, jogadores, Discord, relógio
├─ infrastructure/  Implementações dos ports: Showdown (motor, gerador de times, IA), Drizzle/libSQL, Discord, sessão
│  └─ container.ts  Composição: o único lugar que liga cada port à sua implementação
├─ app/             Next.js: páginas e rotas da API (camada de apresentação HTTP)
└─ ui/              Interface React: telas, batalha, componentes
```

A batalha não fica em memória: o banco guarda só a **seed e a lista de jogadas**, e a cada requisição o servidor refaz a batalha no Showdown (≈13 ms para uma batalha inteira). Isso funciona em serverless e impede trapaças, já que o cliente só envia "golpe 2" ou "trocar para o 4".

## Rodando localmente

Requisitos: Node.js 24+.

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um `.env` na raiz:
   ```env
   CLIENT_ID=...        # Discord Developer Portal → General Information
   CLIENT_SECRET=...    # Discord Developer Portal → OAuth2
   PUBLIC_KEY=...       # Discord Developer Portal → General Information
   ```
   Opcionais: `DATABASE_URL` (padrão `file:./dailyred.db`), `DATABASE_AUTH_TOKEN`, `SESSION_SECRET`, `BOT_TOKEN` (mensagem de resultado no canal) e `PUBLIC_URL` (endereço público, para o card da mensagem; na Vercel é descoberto sozinho).
3. Suba o app:
   ```bash
   npm run dev
   ```
4. Abra http://localhost:3000 e entre com qualquer nome. Esse **login de teste** só existe em desenvolvimento; todos que entram por ele caem no mesmo "servidor de teste", então dá para testar o ranking com duas abas.

O banco é criado e migrado automaticamente na primeira requisição.

## Testando dentro do Discord (sem deploy)

1. Instale o [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) e, com o `npm run dev` rodando, abra o túnel:
   ```bash
   npm run tunnel
   ```
2. No [Developer Portal](https://discord.com/developers/applications):
   - **Activities → Settings:** ative *Enable Activities*.
   - **Activities → URL Mappings:** prefixo `/`, alvo = endereço do túnel **sem** `https://`.
   - **OAuth2 → Redirects:** adicione `https://127.0.0.1`.
   - **Installation:** marque *Guild Install* e instale o app no servidor.
3. Entre num canal de voz → 🚀 Atividades → escolha o app.

O endereço do túnel muda a cada execução; atualize o URL Mapping quando isso acontecer.

## Deploy (Vercel + Turso)

1. Crie um banco no Turso e gere um token.
2. Importe o repositório na Vercel e configure as variáveis (Settings → Environment Variables, ambiente *Production*):

   | Variável | Valor |
   |---|---|
   | `CLIENT_ID`, `CLIENT_SECRET`, `PUBLIC_KEY` | Do Developer Portal |
   | `DATABASE_URL` | `libsql://<banco>-<usuario>.turso.io` |
   | `DATABASE_AUTH_TOKEN` | Token do Turso |
   | `SESSION_SECRET` | Valor aleatório: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `BOT_TOKEN` | Developer Portal → **Bot** → *Reset Token* (para a mensagem de resultado no canal) |

3. No Developer Portal, aponte para o endereço fixo da Vercel:
   - **URL Mappings:** `/` → `seu-app.vercel.app`
   - **Interactions Endpoint URL:** `https://seu-app.vercel.app/api/interactions`
4. Registre o comando `/dailybattle` (só uma vez, ou quando mudar o nome/descrição/opções do comando). O script também remove o antigo `/dailyred`:
   ```bash
   npm run register-commands
   ```

5. Para a mensagem de resultado no canal, o **bot** do app precisa estar no servidor: Developer Portal → **OAuth2 → URL Generator**, marque os escopos `bot` e `applications.commands` e as permissões *View Channels*, *Send Messages* e *Embed Links*; abra o link gerado e escolha o servidor. Sem `BOT_TOKEN` o resto funciona normalmente e o resumo aparece só dentro da atividade.

Cada push na branch `master` gera um novo deploy automaticamente. O login de teste fica desativado em produção.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm test` | Roda os testes (Vitest) |
| `npm run typecheck` | Verificação de tipos |
| `npm run db:generate` | Gera uma nova migration a partir do schema |
| `npm run tunnel` | Túnel HTTPS para testar no Discord |
| `npm run register-commands` | Registra/atualiza o comando `/dailybattle` |
| `npm run update-sets` | Atualiza os sets competitivos do Smogon usados no time do dia |

## Personalizando

- **Campeões e seus sets:** [`src/domain/data/champions.ts`](src/domain/data/champions.ts). Os sets são validados pelo próprio Showdown nos testes (`npm test`). Ao mudar sets ou regras do pool, aumente `DATA_VERSION`.
- **Pool do jogador:** [`src/infrastructure/showdown/ShowdownTeamFactory.ts`](src/infrastructure/showdown/ShowdownTeamFactory.ts) (formas finais até a Gen 4, sem lendários).
- **Sets do jogador:** `npm run update-sets` baixa os sets do Smogon (export JSON do projeto [pkmn](https://github.com/pkmn/smogon)), valida cada um no Showdown e grava em `src/infrastructure/showdown/data/smogon-sets.gen4.json`. Depois de atualizar, aumente `DATA_VERSION`.
- **Geração das regras:** [`src/infrastructure/showdown/generation.ts`](src/infrastructure/showdown/generation.ts) (`GEN` e último número da Pokédex).
- **Mensagem e card do resultado:** [`src/infrastructure/discord/messages.ts`](src/infrastructure/discord/messages.ts) e [`src/app/api/_lib/ResultsCard.tsx`](src/app/api/_lib/ResultsCard.tsx).
- **Rodízio dos campeões:** [`src/domain/rules/championRotation.ts`](src/domain/rules/championRotation.ts).
- **Fuso do "dia" e data de lançamento:** [`src/domain/rules/gameDate.ts`](src/domain/rules/gameDate.ts).
- **IA dos campeões:** [`src/infrastructure/showdown/redAI.ts`](src/infrastructure/showdown/redAI.ts).
- **Visual dos Pokémon:** [`src/ui/components/PokemonEmblem.tsx`](src/ui/components/PokemonEmblem.tsx) é o único componente que desenha um Pokémon em todas as telas. Os sprites não ficam no repositório; veja o [guia de sprites](docs/SPRITES.md) para adicioná-los.
