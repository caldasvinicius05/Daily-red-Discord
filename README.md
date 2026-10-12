# Daily Red

Uma batalha por dia contra o Red, no topo do Monte Prateado — como uma **Atividade do Discord** para jogar com os amigos.

Todo mundo do servidor recebe **o mesmo time de seis Pokémon** a cada dia e tem **uma única chance** na diária. O resultado entra no ranking do servidor e pode ser postado no chat. O modo treino é ilimitado e não conta para nada.

> Projeto pessoal e sem fins comerciais, feito para um servidor privado de amigos. Não é afiliado à Nintendo, Creatures Inc., GAME FREAK ou The Pokémon Company. Nomes de Pokémon, golpes e itens pertencem aos seus donos. A interface usa apenas arte original (emblemas por tipo).

## Como funciona

- **Time do dia:** uma seed baseada na data sorteia 6 Pokémon de um pool de 30 (Gen 1–3, nível 100). O "dia" segue o horário de São Paulo, então todos do servidor estão sempre no mesmo desafio.
- **Mesma sorte para todos:** a diária usa a mesma seed de batalha para todo mundo — quem fizer as mesmas escolhas tem exatamente o mesmo resultado.
- **O Red:** time fixo (Pikachu, Espeon, Snorlax, Venusaur, Charizard, Blastoise), começa sempre com Pikachu e escolhe golpes com base em cálculo de dano.
- **Batalha:** motor do Pokémon Showdown com as regras da Gen 3 (categoria física/especial pelo tipo do golpe, mecânicas da época).

## Funcionalidades

- Tela inicial com o time do dia, contagem para o próximo, time do Red, estatísticas e ranking do servidor
- Escolha do Pokémon inicial com leitura rápida do confronto
- Batalha animada: barras de HP, narração em português, clima, mudanças de atributo, dicas de efetividade
- Histórico sempre aberto ao lado, com dano/cura exatos, itens, status e trocas
- Painel de troca compacto sobre a arena
- Resultado com texto para compartilhar e botão **Postar no Discord**
- Painel **Na atividade agora** com o status do dia de quem está na atividade
- Comando **`/dailyred`** com o ranking de hoje no chat
- Estatísticas: jogos, % de vitórias, sequência, recorde e dias seguidos

## Stack

| Parte | Tecnologia |
|---|---|
| App e API | Next.js 16 (App Router, Route Handlers), React 19, TypeScript |
| Batalha | [`pokemon-showdown`](https://www.npmjs.com/package/pokemon-showdown) (MIT) + [`@smogon/calc`](https://www.npmjs.com/package/@smogon/calc) para a IA |
| Banco | SQLite via Drizzle ORM + libSQL (arquivo local; [Turso](https://turso.tech) em produção) |
| Discord | Embedded App SDK (atividade), OAuth2, Interactions (comando `/dailyred`) |
| Testes | Vitest |
| Deploy | Vercel + Turso |

## Arquitetura

Arquitetura em camadas dentro de um único app Next.js. As dependências apontam sempre para dentro: o domínio não conhece nada de fora.

```
src/
├─ domain/          Regras puras: seed do dia, pool de sets, estatísticas, ranking, texto do resultado
├─ application/     Casos de uso + "ports" (interfaces): batalhas, jogadores, Discord, relógio
├─ infrastructure/  Implementações dos ports: Showdown, IA do Red, Drizzle/libSQL, Discord, sessão
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
   Opcionais: `DATABASE_URL` (padrão `file:./dailyred.db`), `DATABASE_AUTH_TOKEN`, `SESSION_SECRET`.
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

3. No Developer Portal, aponte para o endereço fixo da Vercel:
   - **URL Mappings:** `/` → `seu-app.vercel.app`
   - **Interactions Endpoint URL:** `https://seu-app.vercel.app/api/interactions`
4. Registre o comando `/dailyred` (só uma vez, ou quando mudar o nome/descrição/opções do comando):
   ```bash
   npm run register-commands
   ```

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
| `npm run register-commands` | Registra/atualiza o comando `/dailyred` |

## Personalizando

- **Pool de Pokémon e time do Red:** [`src/domain/data/pool.ts`](src/domain/data/pool.ts). Os sets são validados pelo próprio Showdown nos testes (`npm test`). Ao mudar o pool, aumente `POOL_VERSION`.
- **Fuso do "dia" e data de lançamento:** [`src/domain/rules/gameDate.ts`](src/domain/rules/gameDate.ts).
- **IA do Red:** [`src/infrastructure/showdown/redAI.ts`](src/infrastructure/showdown/redAI.ts).
- **Visual dos Pokémon:** [`src/ui/components/PokemonEmblem.tsx`](src/ui/components/PokemonEmblem.tsx) é o único componente que desenha um Pokémon em todas as telas.
