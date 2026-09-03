# QR Generator Pro

Plataforma para criar, personalizar e **controlar** QR Codes dinâmicos: o
código impresso nunca muda, mas o destino — e o botão de ligar/desligar —
continuam nas suas mãos.

## Como funciona

Um QR dinâmico não aponta para o destino final. Ele aponta para um link curto
deste app (`/r/abc123`), que consulta o banco, decide o que fazer e redireciona.
É isso que permite trocar o destino, pausar o código, agendar expiração,
limitar scans e medir cada leitura.

## Stack

| Camada | Escolha |
|---|---|
| App | Next.js 16 (App Router) + TypeScript |
| Estilo | Tailwind CSS v4 |
| Banco e autenticação | Supabase (Postgres + Auth + RLS) |
| Geração do QR | `qr-code-styling` |
| Gráficos | Recharts |
| Deploy | Vercel + Supabase |

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # e preencha as chaves do Supabase
npm run dev
```

Abre em <http://localhost:3000>.

### Configurando o Supabase

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Em **Project Settings → API**, copie `Project URL`, `anon public` e
   `service_role` para o `.env.local`.
3. Em **SQL Editor**, rode os arquivos de `supabase/migrations/` em ordem.

## Como o QR dinâmico funciona

O código impresso não carrega o destino: carrega `…/r/<slug>`, um endereço
que nunca muda. Cada leitura passa por `src/app/r/[slug]/page.tsx`, que:

1. resolve o código pelo slug (chave `service_role` — quem escaneia não tem
   sessão, e o RLS esconderia a linha);
2. decide o desfecho em `src/lib/qr/redirect.ts` — estado, senha, e só então
   as regras de aparelho e país;
3. redireciona com **307** (não cacheável: um 301 congelaria o destino no
   browser de quem já escaneou) ou mostra a página de indisponível;
4. grava a leitura em `after()`, **depois** que a resposta já saiu — a
   estatística nunca faz alguém esperar em pé numa fila.

O estado real de um código sai de duas implementações que precisam concordar:
`public.qr_effective_status` (SQL, usada para filtrar a listagem) e
`effectiveStatus` em `src/lib/qr/status.ts` (usada para decidir o redirect).
**Mudou uma, mude a outra** — inclusive a ordem dos testes.

## Estrutura

```
src/
  app/            rotas (App Router)
    r/[slug]/     redirect público do QR + registro do scan
  components/     componentes de interface
  lib/
    supabase/     clientes browser, server e admin
    qr/           motor de geração e personalização do QR
supabase/
  migrations/     schema, políticas RLS e funções SQL
docs/             briefing de design para o Stitch
legacy/           o gerador estático original
```

## Documentos do projeto

- [`PROGRESS.md`](PROGRESS.md) — checklist de execução, fase por fase
- [`docs/stitch-design-prompt.md`](docs/stitch-design-prompt.md) — briefing de design
