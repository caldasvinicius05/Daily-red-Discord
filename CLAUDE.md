@AGENTS.md

# Daily Battle — guia para agentes

Atividade do Discord: uma batalha Pokémon diária contra um campeão (Gen 1–4, todos aparecem antes de repetir na semana), para um servidor privado de amigos. Visão geral, setup e deploy estão no [README.md](README.md).

## Idioma

- **Toda conversa com o usuário em português (pt-BR)**, inclusive guias longos e listas. Não trocar para inglês.
- Textos visíveis no app (UI, narração da batalha, mensagens de erro da API, mensagens do Discord) em pt-BR.
- Código, identificadores e comentários em inglês.

## Arquitetura (respeitar as camadas)

- `src/domain` — regras puras, sem dependências externas. Nada de Next, Showdown, banco ou Discord aqui.
- `src/application` — casos de uso (`useCases.ts`) e interfaces dos ports (`ports.ts`), erros (`errors.ts`).
- `src/infrastructure` — implementações dos ports. `container.ts` é o único lugar que liga ports a implementações.
- `src/app` — Next.js: páginas e Route Handlers. Rotas usam `handle()`/`requireSession()`/`parseBody()` de `src/app/api/_lib/http.ts` e chamam só casos de uso.
- `src/ui` — React. O cliente importa do servidor apenas **tipos** (`import type`), nunca código de infraestrutura.

Pokémon na batalha são identificados pela **posição no time** (`slot`, apelido `m0`…`m5` no Showdown), nunca pela espécie — campeões podem repetir espécies (três Dragonite do Lance). No código, o lado do campeão ainda se chama `red` (e o resultado `redFainted`), por compatibilidade.

Regras da **Gen 4**: a geração fica em `src/infrastructure/showdown/generation.ts` (`GEN`, `dex`); nada de `Dex.forGen(n)` espalhado. Pokémon sem sprite em `public/sprites/` caem no emblema por tipo (`PokemonEmblem`), então espécies novas funcionam antes dos sprites.

Quando uma diária termina, `announceDaily` publica/edita a mensagem do dia no canal (port `DailyAnnouncer`, bot com `BOT_TOKEN`); falhas do Discord nunca quebram a batalha.

Batalhas são **sem estado em memória**: guardar seed + ações e refazer no Showdown a cada requisição (`ShowdownBattleEngine.simulate`). A diária usa a mesma seed para todos.

## Visual

- Sprites dos Pokémon (guia em `docs/SPRITES.md`) são servidos a partir de `public/sprites/` (`gen5` para frente e `gen5-back` para costas). `PokemonEmblem.tsx` é a única peça visual que renderiza um Pokémon, recebendo a espécie e o lado da arena (`side`) para determinar a perspectiva.
- Fontes: `--font-ui` (Outfit) para textos e **números**; `--font-pixel` só na narração e em títulos curtos; `--font-logo` no logo.
- Números com `font-variant-numeric: tabular-nums`.
- Animações: só `transform`/`opacity` em loops infinitos; evitar `backdrop-filter` e `filter` animados (causaram lentidão).

## Comandos

```bash
npm run dev            # http://localhost:3000 (login de teste habilitado)
npm test               # Vitest — rodar antes de commitar
npm run typecheck      # tsc --noEmit
npm run build          # build de produção
npm run db:generate    # nova migration após mudar src/infrastructure/db/schema.ts
```

## Armadilhas conhecidas

- **Next 16:** ler `node_modules/next/dist/docs/` antes de usar APIs do Next (ver `AGENTS.md`). Rotas só podem exportar nomes reservados (`GET`, `POST`, `dynamic`...).
- **CSS Modules renomeiam `@keyframes`:** declarar as animações dentro do próprio `.module.css`, não depender das globais.
- **Windows não diferencia maiúsculas em nomes de arquivo:** não criar `foo.ts` e `Foo.tsx` na mesma pasta.
- **Migrations em produção:** são lidas do disco; `outputFileTracingIncludes` em `next.config.ts` garante que entrem no deploy da Vercel.
- **SQLite local:** `prepareDatabase` liga WAL + `synchronous=NORMAL` (sem isso cada jogada levava ~150 ms no Windows).
- **Discord:** a sessão é token Bearer (cookies falham no iframe). `allowedDevOrigins` libera o túnel e `*.discordsays.com` no dev. O comando `/dailybattle` é registrado por POST individual para não apagar o comando "Launch" da atividade.
- **Variáveis de ambiente na Vercel:** mudanças só valem após *Redeploy*.

## Fluxo de trabalho

- Commits e push só quando o usuário pedir. Branch principal: `master` (push gera deploy na Vercel).
- Nunca commitar `.env`, `*.db*` ou segredos; conferir antes de commitar.
- Depois de mudanças de UI, verificar no navegador (desktop e 375 px de largura) e liberar a porta 3000 ao terminar.
