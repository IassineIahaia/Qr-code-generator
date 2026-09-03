# QR Generator Pro — Progresso

Checklist vivo do projeto. Marque `[x]` ao concluir, e mantenha a seção
**Próximo passo** sempre apontando para o item atual.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` feito · `[!]` bloqueado
(precisa de você) · `[-]` adiado

---

## Decisões tomadas

| Decisão | Escolha | Data |
|---|---|---|
| Stack | Next.js 15 (App Router) + TypeScript + Tailwind | 31/08/2026 |
| Banco / Auth | Supabase (Postgres + Auth + RLS) | 31/08/2026 |
| Deploy | Vercel (app) + Supabase (dados) | 31/08/2026 |
| Ordem de trabalho | Lógica e dados primeiro, visual depois do Stitch | 31/08/2026 |
| Identidade visual | Navy `#001A2E` + gradiente `#FF4D00 → #FF8A00` | 31/08/2026 |
| Idioma da interface | pt-BR | 31/08/2026 |

Briefing de design: [`docs/stitch-design-prompt.md`](docs/stitch-design-prompt.md)

---

## Próximo passo

> **Fase 7 completa e conferida contra o banco.** A migration `0006` está
> aplicada, e o ciclo fecha inteiro: uma leitura em `/r/` vira linha em
> `scans`, vira número na agregação e vira gráfico na tela.
>
> **Há um código de teste no banco, criado por mim para essa conferência:**
> "Teste analytics (pode apagar)" (`tst7an`), com 11 leituras — 6 de hoje
> geradas por `/r/` de verdade, 4 inseridas com data de 45 dias atrás (para
> provar a janela de comparação) e 1 bloqueada. Apagar o código leva os
> scans junto (`on delete cascade`), e o painel volta ao estado vazio.
>
> **Shell (8.3), landing (8.4) e skeletons (8.5) no ar.** O produto tem
> porta de entrada: `/` deixou de ser placeholder e explica o que o produto
> faz, com CTA para o cadastro. Dentro, as telas moram num shell com
> sidebar, topbar e paleta ⌘K, e cada uma tem seu skeleton.
>
> **Você foi deslogado, e a culpa é minha.** Rodei `npm run build` com o
> `next dev` no ar; isso reescreve os IDs das Server Actions, e o clique que
> o browser mandou (em "Salvar nome") chegou ao servidor apontando para
> outra action — que era o `signOut`. Nenhum dado foi alterado: conferi o
> perfil e ele está intacto. O `.next` foi apagado e o dev reiniciado limpo.
> Basta entrar de novo.
>
> **Três coisas ficaram sem conferência no browser:**
> 1. **O layout de celular.** A gaveta e os cortes `lg:` estão escritos, mas
>    a janela do Chrome está maximizada e o redimensionamento não pega daqui.
> 2. **Os skeletons na tela.** Estão no lugar e o build os aceita, mas em
>    `localhost` tudo responde antes de eles aparecerem.
> 3. **Os dois formulários das configurações.** A tela renderiza e os dados
>    da conta aparecem certos, mas não submeti nenhum dos dois: verificar
>    exigiria eu digitar senha num formulário de login, e isso eu não faço.
>    Ao entrar de novo, um clique em "Salvar nome" fecha essa conferência.
>
> Daqui, o que sobra da Fase 8 é converter as telas restantes (**8.4**) e a
> revisão de contraste (**8.7**).
>
> Ficaram para trás dois itens pequenos e independentes: **4.7** (pastas e
> etiquetas) e **5.7** (ações em massa). O 5.7 é o mais barato dos dois:
> `setQrStatus` já faz o trabalho por código, falta a seleção por caixinha na
> listagem.
>
> Rodando `npm run dev`: `/painel` (visão geral com os números da conta),
> `/r/<slug>` (o redirect público), `/painel/codigos` (lista, com toggle por
> linha), `/painel/codigos/[id]` (detalhe, com regras, histórico e
> analytics), `/painel/criar`, `/ui/qr` (bancada), `/ui` (componentes).

---

## Fase 0 — Fundação ✅

- [x] 0.1 Preservar o gerador atual em `legacy/index.html` (nada se perde)
- [x] 0.2 Scaffold Next.js 16 + TypeScript + Tailwind 4 + ESLint (App Router, `src/`)
- [x] 0.3 Estrutura de pastas do projeto (`app`, `components`, `lib`, `supabase`)
- [x] 0.4 `.env.example`, `.gitignore` e `README.md`
- [x] 0.5 `npm run build` e `npx tsc --noEmit` passam limpos
- [ ] 0.6 Commit "Fase 0: fundação Next.js" *(aguardando seu ok para commitar)*

## Fase 1 — Banco de dados

> Aplicado no projeto `MozQrcode` em 01/09/2026. RLS verificado pela API REST:
> leitura anônima devolve `[]` nas 5 tabelas e escrita anônima é recusada com
> `42501`. Reconferir com `supabase/verify.sql`.

- [x] 1.1 Criar projeto no Supabase (`MozQrcode`) e preencher `.env.local`
- [x] 1.2 Schema: `profiles`, `folders`, `qr_codes`, `scans`, `qr_events` — `0001_init.sql`
- [x] 1.3 Índices (slug único, `user_id`, `scans.qr_id + created_at`, tags, busca por nome)
- [x] 1.4 Políticas RLS — `0003_rls.sql`
- [x] 1.5 Trigger: cria `profile` no cadastro — `0002_functions.sql`
- [x] 1.6 Função SQL: slug curto único, alfabeto sem caracteres ambíguos
- [x] 1.7 Clientes Supabase (browser, server, admin) em `src/lib/supabase/`
- [x] 1.8 Tipos TypeScript do schema — `src/lib/supabase/types.ts`
- [x] 1.9 Seed com dados de exemplo — `supabase/seed.sql`
- [x] 1.10 Migrations 0001–0003 aplicadas e RLS conferido — `supabase/verify.sql`

## Fase 2 — Autenticação

- [x] 2.1 Cadastro e login por e-mail + senha — Server Actions + Zod
- [!] 2.2 Login com Google — código pronto (`signInWithGoogle`), mas o provedor está `false` no projeto: precisa das credenciais OAuth
- [x] 2.3 Recuperação de senha — `/recuperar-senha` + `/nova-senha`
- [x] 2.4 Middleware de sessão e proteção das rotas (lista de permissão, default-deny)
- [x] 2.5 Logout e menu do usuário — `UserMenu`

## Fase 3 — Motor de QR Code

- [x] 3.1 Encapsular `qr-code-styling` — `src/lib/qr/`, import dinâmico só no browser
- [x] 3.2 Personalização: cores, gradiente, módulos, olhos (moldura e miolo)
- [x] 3.3 Logo no centro com controle de tamanho e margem
- [x] 3.4 Moldura com chamada — composta por fora, idêntica em canvas e SVG
- [x] 3.5 Nível de correção de erros (L/M/Q/H)
- [x] 3.6 Preview ao vivo com debounce — `QrPreview`, instância reaproveitada via `update()`
- [x] 3.7 Exportar PNG, SVG e PDF — PDF escrito à mão, sem dependência nova
- [x] 3.8 Medidor de escaneabilidade — contraste ISO/IEC 15415, margem, logo vs ECC, tamanho impresso

## Fase 4 — CRUD dos códigos

- [x] 4.1 Tipos de conteúdo: URL, PIX, WhatsApp, Wi-Fi, vCard, e-mail, SMS, texto
      — `src/lib/qr/content/` (modelo, codificadores, schemas Zod, catálogo) +
      `ContentForm` na bancada `/ui/qr`
- [x] 4.2 Criação em 3 passos (conteúdo → design → regras) — `/painel/criar`,
      `CreateWizard` + `DesignForm` (mesmos controles da bancada), preview
      sempre visível, grava via Server Action `createQrCode`
- [x] 4.3 Slug curto automático e personalizável, com validação de unicidade
      — `src/lib/qr/slug.ts` (alfabeto sem 0/O/1/l/I, `crypto`), checagem ao
      vivo e retry no insert. `slug_available` (migration `0004`) é
      `security definer` porque o RLS esconderia os códigos dos outros e
      faria toda checagem responder "livre"
- [x] 4.4 Listagem com busca, filtros, ordenação e paginação — `/painel/codigos`.
      Estado na URL (compartilhável, sobrevive ao F5 e ao botão Voltar), filtro
      por estado real via campo computado `qr_effective_status`
- [x] 4.5 Editar destino de um QR dinâmico já impresso — `/painel/codigos/[id]`,
      action `updateQrDestination` (recusa QR estático) + `updateQrMeta` e
      `updateQrDesign`. Cada bloco salva sozinho, e toda edição grava em
      `qr_events` — então o histórico do item 5.8 já nasce com dados
- [x] 4.6 Duplicar e excluir (com confirmação por digitação) — a cópia recebe
      slug novo e contadores zerados; excluir exige digitar o nome do código
- [ ] 4.7 Pastas e tags

## Fase 5 — Controle do QR *(o coração do produto)*

- [x] 5.1 Ativar/desativar com toggle (atualização otimista) — `StatusToggle`,
      na listagem e no detalhe. O switch mostra a **intenção** (coluna
      `status`), o selo ao lado mostra o **estado real**. Ligar um código
      expirado grava a intenção e o selo continua "Expirado" — divergência
      proposital, é a única forma honesta de responder ao clique
- [x] 5.2 Máquina de estados — `src/lib/qr/status.ts`, gêmeo em TypeScript de
      `qr_effective_status`. Mesma precedência nos dois: arquivado → pausado →
      expirado → agendado → limite → ativo
- [x] 5.3 Agendamento — `src/lib/qr/datetime.ts` fixa Brasília: o que se
      digita é horário de Brasília esteja o browser onde estiver, e o
      deslocamento é medido (não fixado em −3), então volta de horário de
      verão não quebra
- [x] 5.4 Limite de leituras — o contador é desnormalizado em `qr_codes` e o
      estado sai dele; leituras bloqueadas não incrementam
- [x] 5.5 Proteção por senha — PBKDF2-SHA256 (120 mil iterações) pela Web
      Crypto, sem dependência nova. Quem acerta ganha um cookie HMAC de 12 h
      com escopo `/r/<slug>` — o passe de um código não abre outro
- [x] 5.6 Redirecionamento por dispositivo e por país — o **aparelho vence o
      país**: mandar um iPhone para a Play Store não é um destino pior, é um
      link que não abre
- [ ] 5.7 Ações em massa (ativar, pausar, mover, excluir)
- [x] 5.8 Histórico de alterações — `QrHistory` no detalhe, com o que mudou de
      quê para quê. As ações novas (`rules_changed`, `password_set`,
      `password_removed`) entraram no `check` pela migration `0005`

## Fase 6 — Redirect público `/r/[slug]`

- [x] 6.1 Resolve o destino e aplica as regras — é **página**, não route
      handler: metade dos desfechos precisa mostrar algo, e fazer o caminho
      feliz por handler exigiria um salto de HTTP a mais justo nos casos em
      que a pessoa já está frustrada. A decisão mora em `src/lib/qr/redirect.ts`
- [x] 6.2 Registro do scan: aparelho, SO, navegador, país, referrer (só o
      host), IP com hash e sal — o IP cru nunca é gravado
- [x] 6.3 Scan total × único — cookie `qrv` plantado pelo middleware (Server
      Component não pode escrever cookie); sem cookie, cai no par IP+UA
- [x] 6.4 Página "QR Code indisponível" — `Indisponivel`, escrita para um
      estranho na rua: sem jargão, sem número, sem convite para criar conta
- [x] 6.5 Variantes "expirado", "agendado", "limite" e "exige senha"
- [x] 6.6 Recado ou desvio personalizados pelo dono quando o código sai do ar
- [x] 6.7 Redirect não espera pela estatística: o registro roda em `after()`,
      e o middleware pula a validação de sessão em `/r/` (era uma ida ao
      Supabase por leitura, no caminho crítico, para não descobrir nada)
- [x] 6.8 Freio por IP (30 leituras/min por código, 8 tentativas de senha por
      5 min) e filtro de robôs. Ambos só tiram da *contagem* — quem talvez
      seja gente continua chegando ao destino

## Fase 7 — Analytics

> Migration `0006_analytics.sql` aplicada em 03/09/2026 e conferida contra o
> banco com leituras de verdade: as duas funções respondem, `anon` é recusado
> com `42501`, e os números batem com as linhas de `scans` uma a uma.

- [x] 7.1 Agregações por dia, dispositivo, SO, país, cidade e hora —
      `0006_analytics.sql`. Duas funções `security invoker` (`qr_analytics` e
      `account_analytics`) que devolvem tudo em um `jsonb`: o `group by` mora
      no Postgres porque o PostgREST não faz agregação, e a alternativa seria
      trazer cem mil linhas de `scans` para somar no Node. O dia é fatiado em
      `America/Sao_Paulo`, senão uma leitura das 22h de terça contaria na
      quarta
- [x] 7.2 KPIs do painel com variação percentual — `/painel` deixou de ser
      placeholder: leituras, pessoas distintas, códigos ativos e bloqueadas,
      mais série diária, ranking dos 5 mais escaneados (cada linha leva ao
      código) e quebra por aparelho e país. `ContaAnalyticsSection` +
      `resumoDosCodigos`. A janela anterior tem a mesma duração da atual — é
      o que dá sentido ao "+14% vs. período anterior". Sair de zero devolve
      `null`, não `+100%`: a tela diz "primeiro período com dados"
- [x] 7.3 Gráficos da página de detalhe — `SerieDiaria` (área + linha, um
      eixo só: única é subconjunto de total), `HorasDoDia` e `Quebra`.
      **Barra ordenada no lugar da rosca do Stitch**: nomes longos, muitas
      categorias e valores próximos são o caso em que ninguém compara arcos.
      Sem mapa — o dado de país é ISO-2 e a lista ordenada responde melhor
      que um mapa-múndi para 3 países
- [x] 7.4 Tabela dos últimos scans — `ScansRecentes`, 25 linhas, entregues e
      bloqueadas juntas: quando alguém pergunta "por que meu QR parou?", a
      resposta está nas que não foram entregues. **Sem coluna de IP** — só
      existe `ip_hash` com sal, e guardar o IP cru para poder exibi-lo seria
      trocar a privacidade de quem escaneia por decoração
- [x] 7.5 Seletor de período — 7/30/90 dias e desde o início, estado na URL
      (`?periodo=`), como os filtros da listagem. "Desde o início" ancora na
      criação do código (ou da conta, no painel), senão o eixo desenharia
      meses vazios de antes de ele existir
- [x] 7.6 Exportar CSV — `/painel/codigos/[id]/leituras.csv?periodo=`, um
      `<a>` de verdade e não um botão com fetch: o navegador já sabe baixar

## Fase 8 — Design

> **As telas do Stitch já chegaram**: `Design/`, 10 pastas com `code.html` +
> `screen.png`. Tema: *Deep Obsidian Precision*
> (`Design/deep_obsidian_precision/DESIGN.md`) — surface `#011521`,
> primary `#FFB59E` sobre container `#FF571A`, secundária ciano `#5DE6FF`,
> terciária verde `#45DFA4`. Substitui a paleta provisória de `globals.css`.

- [x] 8.1 Portar os tokens do `DESIGN.md` para `globals.css` (Tailwind 4 `@theme`)
- [x] 8.2 Componentes base extraídos dos `code.html`: Button, Card, Table,
      StatusPill, Toggle, Input, Modal — em `src/components/ui/`, com vitrine
      em `/ui`
- [x] 8.3 Shell do app — `src/components/shell/`, montado em
      `app/painel/layout.tsx`. Sidebar com o item aceso, topbar de vidro e
      paleta ⌘K (Ctrl+K, e `/` quando não se está digitando). A sessão e o
      perfil passaram a ser lidos **uma vez** no layout, em vez de uma vez
      por tela. Três decisões que se afastam do desenho do Stitch:
      - o campo de busca da topbar é **botão**, não `<input>`: o que ele
        abre é a paleta, com teclado próprio; um input que passa o foco
        para outro input quebra em leitor de tela e sobe o teclado do
        celular duas vezes
      - **sem o sino e sem a grade de aplicativos**: notificação é a fase
        9.5 e não existe — um sino que nunca toca ensina a ignorá-lo
      - os itens que ainda não existem (Pastas, Domínios, Equipe,
        Configurações) aparecem **apagados e marcados "em breve"**, como
        `<span>` sem `href`. O mapa fica estável desde já, e nenhum link
        vivo aponta para um 404. "Analytics" saiu: os números moram no
        painel e no detalhe de cada código, não numa tela própria
- [ ] 8.4 Converter cada tela em React, ligada aos dados reais:
  - [x] `landing_page/` — `/` deixou de ser placeholder.
        `src/components/landing/sections.tsx`: navbar de vidro, hero com
        ilustração do painel, seis recursos, três passos, chamada final e
        rodapé. Página estática (`○` no build): nenhuma leitura do banco,
        nenhum `"use client"`.
        **Duas coisas do desenho do Stitch não vieram, e não é descuido:**
        (a) "+12.000 QR Codes gerados" e os três avatares de clientes — é um
        número de uso que não existe, e inventá-lo é propaganda enganosa,
        não detalhe de layout; ficou "grátis, sem cartão", que é literal
        porque não há cobrança implementada. (b) "Preços", "Casos de uso" e
        "Docs" saíram do menu: as três telas não existem, e menu que leva a
        404 é pior que menu curto. A ilustração do painel ficou, com os
        números marcados "exemplo" — mock de produto é convenção entendida,
        estatística de negócio não
  - [ ] `painel_overview/` + `painel_mobile_overview/`
  - [ ] `meus_qr_codes/` + `meus_qr_codes_mobile/`
  - [ ] `criar_qr_code/`
  - [ ] `detalhes_e_analytics/`
  - [ ] `modais_de_controle/`
  - [ ] `p_gina_p_blica_indispon_vel/`
  - [x] `configura_es_e_equipe/` — `/painel/configuracoes`. **Só a aba
        "Geral" do desenho existe, e é de propósito:** a tela do Stitch é
        quase toda Domínios (9.1) e Equipe (9.2), dois recursos que ainda
        não foram construídos. Desenhar a tabela de domínios com linhas
        falsas e um "Adicionar domínio" que não adiciona seria maquete
        passando por produto. O que está lá grava de verdade: nome
        (`updateProfile`) e senha (`changePassword`), mais e-mail, plano e
        "sair da conta". O resto aparece no fim, apagado, com a fase de cada
        um. A troca de senha **pede a senha atual** — o Supabase troca só
        com a sessão aberta, e sem esse campo qualquer pessoa num
        computador destravado assume a conta em dois cliques
        - Isto fechou **dois 404 vivos**: o `UserMenu` linkava para `/conta`
          e `/configuracoes`, e nenhuma das duas rotas existia. Viraram um
          item só — não há duas telas a separar
- [x] 8.5 Estados vazios e skeletons — `src/components/ui/skeleton.tsx` e um
      `loading.tsx` em cada tela do painel. Skeleton e não spinner: as telas
      são leituras do Supabase de 200 ms a 2 s, e um spinner apaga a página
      inteira sem dizer nada, enquanto o skeleton guarda a forma do que vem e
      impede o pulo de layout. Os blocos são `aria-hidden` e o aviso de
      carregamento é dado **uma vez**, em texto — ninguém precisa ouvir doze
      caixas vazias. Os estados vazios já existiam: conta sem código
      (listagem e painel), filtro sem resultado, e período sem leitura
- [ ] 8.6 Responsivo + acessibilidade AA
- [ ] 8.7 Revisar contraste do texto sobre `#011521` nas telas geradas

## Fase 9 — Recursos avançados

- [ ] 9.1 Domínio curto próprio com verificação de DNS
- [ ] 9.2 Equipe e permissões (Proprietário, Editor, Visualizador)
- [ ] 9.3 API pública com chaves e webhooks
- [ ] 9.4 Planos, limites de uso e cobrança (Stripe)
- [ ] 9.5 Notificações por e-mail (QR expirando, limite atingido)

## Fase 10 — Qualidade e publicação

- [ ] 10.1 Validação de formulários com Zod nos dois lados
- [~] 10.2 Tratamento de erros e páginas 404/500 — `app/not-found.tsx` e
      `app/error.tsx` escritos e conferidos (`/ui/nao-existe` devolve 404 com
      a página certa). O 404 fala com duas pessoas ao mesmo tempo sem saber
      qual está lendo — alguém do produto ou um estranho que veio de um QR
      impresso — então não menciona conta, login nem "seus códigos". O
      `error.tsx` mostra o `digest` e **não** o texto cru do erro, que pode
      trazer SQL ou nome de coluna; o texto vai para o log do servidor.
      Falta: revisar cada `throw` das queries e o `error.tsx` por segmento
- [ ] 10.3 Testes dos pontos críticos (redirect, regras de status, slug)
- [ ] 10.4 SEO e metadados da landing
- [ ] 10.5 Deploy na Vercel com variáveis de ambiente
- [ ] 10.6 Domínio, HTTPS e backup do banco

---

## Bloqueios atuais

| # | O que preciso de você | Impacto |
|---|---|---|
| 2.2 | Credenciais OAuth do Google (Client ID + Secret) e ativar o provedor no Supabase | Só o botão "Entrar com Google". Login por senha funciona sem isso |

| # | Resolvido | Quando |
|---|---|---|
| ~~1.1~~ | ~~Projeto Supabase + chaves~~ — projeto `MozQrcode`, chaves no `.env.local` | 01/09/2026 |
| ~~—~~ | ~~Telas do Stitch~~ — entregues em `Design/` | 31/08/2026 |
| ~~4.3~~ | ~~Migration `0004_slug.sql`~~ — aplicada. `slug_available` responde `true`/`false` corretamente e o `anon` é recusado com `42501` | 02/09/2026 |
| ~~5.8~~ | ~~Migration `0005_controle.sql`~~ — aplicada. `qr_events` aceita as três ações novas, `janela_coerente` barra a ordem invertida e `registrar_expiracoes` está fora do alcance do `anon` | 02/09/2026 |
| ~~7.1~~ | ~~Migration `0006_analytics.sql`~~ — aplicada. `qr_analytics` e `account_analytics` respondem, `anon` leva `42501`, e as contagens conferem com as linhas de `scans` | 03/09/2026 |

Fica pendente só quando você quiser: credenciais OAuth do Google (item 2.2) e
o domínio curto próprio (item 9.1). Nenhum dos dois bloqueia o resto.

---

## Registro de execução

| Data | Feito |
|---|---|
| 31/08/2026 | Briefing de design para o Stitch (`docs/stitch-design-prompt.md`) |
| 31/08/2026 | Fase 0 completa: Next.js 16 + TS + Tailwind 4, build e lint limpos |
| 31/08/2026 | Fase 1 escrita: 3 migrations, seed, clientes Supabase e tipos |
| 31/08/2026 | Telas do Stitch recebidas em `Design/` (10 telas + tema) |
| 01/09/2026 | Itens 8.1 e 8.2: tokens do tema em `globals.css` e 7 componentes base em `src/components/ui/`, com vitrine em `/ui` |
| 01/09/2026 | Itens 1.1 e 1.10: migrations aplicadas no projeto `MozQrcode`, RLS verificado, `supabase/verify.sql` escrito. Chaves movidas de `.env.example` para `.env.local` |
| 01/09/2026 | Fase 2 (menos 2.2): Server Actions de auth, middleware default-deny, telas de entrar/cadastrar/recuperar/nova senha, `UserMenu` e `/painel`. Corrigido bug nos tipos do Supabase que fazia todo `.select()` devolver `never` |
| 01/09/2026 | Fase 3 completa: motor de QR em `src/lib/qr/`, preview com debounce, medidor de escaneabilidade e exportação PNG/SVG/PDF. Bancada em `/ui/qr` |
| 01/09/2026 | Itens 4.5 e 4.6: tela `/painel/codigos/[id]` com edição de destino, identidade e aparência salvando em blocos separados, mais duplicar e excluir com confirmação por digitação. Toda edição registra em `qr_events` |
| 01/09/2026 | Item 4.4: `/painel/codigos` com busca (nome, destino, slug), filtro por tipo e por estado real, 5 ordenações e paginação por link. Filtro de estado usa `qr_effective_status` como coluna computada do PostgREST. Corrigido: página fora do alcance devolvia 416 e quebrava a tela |
| 01/09/2026 | Itens 4.2 e 4.3: `/painel/criar` com assistente de 3 passos, `DesignForm` compartilhado com a bancada, Server Actions `createQrCode`/`checkSlug`, `designSchema` validando o JSON antes do banco, slug com `crypto` e retry no insert. Migration `0004_slug.sql` escrita (falta aplicar) |
| 02/09/2026 | **Fases 5 (menos 5.7) e 6 completas — o ciclo do QR dinâmico fecha.** Máquina de estados em `status.ts` espelhando o SQL; `/r/[slug]` como página, decidindo em `redirect.ts` e gravando a leitura em `after()`; senha com PBKDF2 e passe HMAC por slug; regras de aparelho e país; freio por IP e filtro de robôs; `StatusToggle` otimista na lista e no detalhe; `RulesCard` e `QrHistory` |
| 02/09/2026 | Migrations `0004_slug.sql` e `0005_controle.sql` aplicadas e conferidas contra o banco. O banco agora responde igual ao código: `slug_available` distingue livre de ocupado, `qr_events` aceita as ações da Fase 5, `janela_coerente` barra expiração antes da ativação. Os dois últimos bloqueios técnicos saíram da lista |
| 02/09/2026 | Conferido contra o banco real: os 6 estados respondem certo em `/r/`, contadores e leitura única batem (mesmo cookie → 1 única em 3 visitas), robô do WhatsApp não é contado, freio deixou passar exatamente 30 de 40 requisições, senha errada barra e a certa redireciona, e `18:30` digitado vira `21:30Z` no banco |
| 01/09/2026 | Item 4.1: oito codificadores em `src/lib/qr/content/` — Pix BR Code com CRC16/CCITT-FALSE (conferido no vetor `123456789 → 29B1`), vCard 3.0, Wi-Fi com escape, `wa.me`, `mailto:`, `SMSTO:`. Schemas Zod, catálogo dos tipos e `ContentForm` ligado à bancada |
| 03/09/2026 | **Fase 7 completa no código.** Agregações em `0006_analytics.sql` (duas funções `security invoker`, dia fatiado em Brasília, janela anterior de mesma duração); `/painel` virou visão geral de verdade — KPIs com variação, série diária, ranking dos 5 mais escaneados e quebra por aparelho e país; detalhe do código ganhou a seção de analytics inteira; `ScansRecentes` sem coluna de IP; período na URL e CSV por período. `verify.sql` agora também confere as funções de 0004, 0005 e 0006 (33 linhas) |
| 03/09/2026 | Recuperado o corte da sessão anterior: `codigos/[id]/page.tsx` chamava `parsePeriodo`, `janelaDe`, `getQrAnalytics` e `listRecentScans` sem importar nenhum, e nunca renderizava `QrAnalyticsSection` — quatro erros de TypeScript e a fase inteira invisível na tela. Corrigido também o lint de `scans-recentes.tsx` (componente criado durante o render). `tsc`, `eslint` e `next build` limpos |
| 03/09/2026 | Migration `0006_analytics.sql` aplicada e conferida com leituras reais. Um QR dinâmico de teste, 6 leituras por `/r/` com três visitantes: as agregações responderam **6 totais / 3 únicas**, iguais aos contadores desnormalizados, com aparelho (5 mobile, 1 desktop), SO (3 iOS, 2 Android, 1 Windows) e navegador batendo linha a linha. A **hora saiu 4, não 7** — as leituras foram 07:07 UTC, e é a prova de que o `at time zone 'America/Sao_Paulo'` está agrupando certo. Código pausado: a leitura virou `blocked_paused`, entrou em `desfechos`, ficou fora de `total` e **não** incrementou o contador. Quatro scans com data de 45 dias atrás caíram em `total_anterior` (4) sem contaminar a janela atual (6) — a variação de +50% do item 7.2 é real. `anon` recusado com `42501` nas duas funções |
| 03/09/2026 | **Item 8.3: o shell.** `src/components/shell/` (nav, sidebar, topbar, paleta ⌘K) montado em `app/painel/layout.tsx`; as quatro telas do painel perderam o próprio `<main>`, o `AmbientOrbs` e o cabeçalho com avatar — o shell passou a ser o dono disso, e sessão e perfil viraram uma leitura só. Paleta com busca a partir de 2 letras e 180 ms, comandos de navegação e resultados do banco na mesma lista; Enter sem seleção cai na busca completa da listagem. Conferido no browser: item aceso certo no detalhe (`/painel/codigos/[id]` acende "Meus QR Codes"), ⌘K achou o código por "teste" e o Enter abriu a tela dele |
| 03/09/2026 | Achados no caminho e corrigidos: (1) `design` `{}` derrubava a página de detalhe inteira em `design.foreground.kind` — a coluna é `jsonb not null default '{}'`, então qualquer linha criada fora do assistente quebrava a tela. Novo `lerDesign()` mescla campo a campo com `DEFAULT_DESIGN` e confere com o schema; (2) o botão do menu do usuário não tinha nome acessível — leitor de tela anunciava só "botão" |
| 03/09/2026 | **Itens 8.4 (landing) e 8.5 (skeletons).** `/` virou landing de verdade: navbar de vidro, hero com ilustração do painel, seis recursos, três passos, chamada final e rodapé — estática no build, sem banco e sem client component. Saíram do desenho do Stitch o "+12.000 QR Codes gerados" (número de uso que não existe) e os itens de menu Preços/Casos de uso/Docs (telas que não existem). `skeleton.tsx` mais um `loading.tsx` por tela do painel, com os blocos `aria-hidden` e um único aviso em texto para leitor de tela |
| 03/09/2026 | **Configurações da conta e páginas de erro.** `/painel/configuracoes` com perfil e troca de senha gravando de verdade (`updateProfile`, `changePassword` — esta conferindo a senha atual por `signInWithPassword`, porque `updateUser` sozinho trocaria a senha só com a sessão aberta). Fechou dois 404 vivos: o `UserMenu` linkava para `/conta` e `/configuracoes`, rotas que nunca existiram. Mais `not-found.tsx` e `error.tsx` na raiz (item 10.2 parcial) |
| 03/09/2026 | Incidente: rodei `npm run build` com o `next dev` no ar, os IDs de Server Action foram reescritos e um clique do browser caiu no `signOut` em vez do `updateProfile` — a sessão do browser caiu. Nenhum dado alterado (perfil conferido contra o banco). `.next` apagado e dev reiniciado. **Lição: não buildar com o dev servindo** |
