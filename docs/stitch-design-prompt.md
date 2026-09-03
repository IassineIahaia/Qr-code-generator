# Prompts de Design para o Stitch — QR Generator Pro

> **Como usar:** cole o **PROMPT MESTRE** primeiro (ele define o design system).
> Depois gere **uma tela por vez**, colando o bloco da tela + a linha final
> `Follow the QR Generator Pro design system defined earlier.`
> Os prompts estão em **inglês** (o Stitch entende muito melhor e erra menos layout),
> mas todos os textos da interface são especificados em **português do Brasil**.

---

## 0. PROMPT MESTRE — Design System

```
You are designing "QR Generator Pro", a premium SaaS platform for creating,
customizing, tracking and MANAGING dynamic QR codes. Think of it as the
"Stripe Dashboard of QR codes": calm, dense, precise, expensive-looking.
All UI copy must be in Brazilian Portuguese (pt-BR).

VISUAL DIRECTION
- Mood: dark, elegant, high-contrast, editorial. Cinematic depth, never neon,
  never playful. Confident enterprise product with a warm signature accent.
- Reference quality bar: Linear, Vercel Dashboard, Stripe Dashboard, Dub.co,
  Raycast and Framer. Generous whitespace, hairline borders, restrained color,
  strong typographic hierarchy. No drop-shadow bloat, no clip-art icons.

COLOR TOKENS (dark theme is the default)
- Background base: #00121F
- Surface: #001A2E
- Surface elevated / cards: #06283F
- Hairline border: rgba(255,255,255,0.08); hover border: rgba(255,255,255,0.16)
- Primary accent gradient: 135deg #FF4D00 -> #FF8A00 (buttons, active states,
  key data points). Use it on at most 10% of the screen so it feels precious.
- Accent soft glow: rgba(255,110,20,0.18) blurred behind primary elements
- Data/secondary accent: #22D3EE (charts, links, informational)
- Success #34D399 | Warning #FBBF24 | Danger #F43F5E | Paused/neutral #64748B
- Text primary #F2F7FA | Text secondary #9CB0C0 | Text muted #5F7386
- Also provide a LIGHT theme variant: bg #F7F9FB, surface #FFFFFF,
  ink #06121C, borders rgba(6,18,28,0.10), same orange accent.

TYPOGRAPHY
- Headings: "Inter Tight" (or Inter), weight 600-700, tight letter-spacing (-0.02em)
- Body/UI: "Inter", 400/500, 14px base, 1.5 line-height
- Numbers, IDs, short links and code: "JetBrains Mono" 500
- Scale: 40/32/24/18/16/14/13/11px. Section labels: 11px uppercase,
  letter-spacing 0.08em, text-secondary.

SHAPE, DEPTH & MOTION
- Radius: 16px cards, 12px inputs/buttons, 999px pills and status chips, 20px modals
- Depth comes from layered surfaces + hairline borders, not heavy shadows.
  One soft shadow allowed: 0 24px 60px rgba(0,0,0,0.45) on modals and popovers.
- Subtle glassmorphism ONLY on the top bar and on floating panels:
  background rgba(6,40,63,0.72) + backdrop blur 20px.
- Background atmosphere: two very large, very blurred orange/navy radial orbs
  at ~8% opacity behind the app shell. Barely perceptible, never distracting.
- Micro-interactions: 150ms ease-out hovers, rows lift 1px, buttons brighten,
  skeleton shimmer while loading.

ICONOGRAPHY & IMAGERY
- Lucide-style line icons, 1.5px stroke, 18-20px, monochrome text-secondary,
  turning accent on active state. No filled or multicolor icon sets, no emojis
  inside the UI chrome.
- QR previews are always rendered on a white rounded tile with generous padding,
  so the code stays scannable against the dark UI.

LAYOUT SHELL (all internal screens)
- Left sidebar 248px: logo lockup (an abstract QR-module mark in the orange
  gradient + wordmark "QR Generator Pro"), a primary "+ Criar QR Code" button,
  nav items [Painel, Meus QR Codes, Analytics, Pastas, Dominios, Equipe,
  Configuracoes], and a bottom plan card showing usage ("128 de 500 scans" with
  a thin progress bar) and "Fazer upgrade".
- Top bar 64px: breadcrumb, global search with a Cmd+K hint, workspace switcher,
  notification bell, avatar menu.
- Content max-width 1360px, 32px padding, 24px grid gap, 8px spacing system.
- Every screen must include an empty state, a loading skeleton and a
  compact mobile version (sidebar becomes a bottom tab bar).

ACCESSIBILITY
- WCAG AA contrast on all text. Status is never communicated by color alone:
  always pair a colored dot with a text label. Visible focus ring in accent color.
```

---

## 1. Landing / Página de vendas

```
Design the marketing landing page for QR Generator Pro (dark theme, pt-BR copy).
Sections, top to bottom:
1. Sticky glass navbar: logo, links [Recursos, Precos, Casos de uso, Docs],
   "Entrar" ghost button and "Comecar gratis" gradient button.
2. Hero, two columns. Left: eyebrow pill "QR Codes dinamicos com rastreamento",
   headline 56px "Crie, controle e desative seus QR Codes quando quiser",
   subheadline explaining that the printed code never changes but the
   destination - and its on/off switch - stays in your hands. Two CTAs
   ("Criar meu primeiro QR" + "Ver demonstracao"), and a trust row
   "+12.000 QR Codes gerados - Sem cartao de credito".
   Right: a floating, slightly tilted product screenshot of the dashboard with
   an orange glow behind it, plus a small floating card showing a live
   "Scans hoje +38" sparkline.
3. Logo strip of client brands in muted grayscale.
4. Feature grid, 3 columns x 2 rows, bento style with one wide highlighted card:
   QR dinamico editavel, Ativar/Desativar em 1 clique, Analytics em tempo real,
   Personalizacao visual com logo, Agendamento e expiracao, Dominio proprio.
5. "Como funciona" - 3 numbered steps connected by a hairline.
6. Analytics showcase: a wide dark card with a realistic area chart and a
   world map with scan hotspots.
7. Pricing: 3 cards (Free, Pro highlighted with a gradient border, Empresas),
   monthly/annual toggle.
8. FAQ accordion + final CTA band using the orange gradient.
9. Footer with 4 link columns.
Follow the QR Generator Pro design system defined earlier.
```

---

## 2. Painel (Dashboard / visão geral)

```
Design the "Painel" overview screen of QR Generator Pro using the app shell.
- Page header: "Bom dia, Iassine" (h1 32px) with the subtitle
  "Aqui esta o desempenho dos seus QR Codes nos ultimos 30 dias" and, on the
  right, a date-range picker "Ultimos 30 dias" plus "+ Criar QR Code".
- KPI row: 4 stat cards - "Total de QR Codes 42", "Scans no periodo 8.412",
  "QR Codes ativos 37", "Taxa de scan unica 68%". Each card shows the big
  number in Inter Tight 32px, a trend chip (+12,4% green / -3,1% red) and a
  40px-tall sparkline in the accent gradient.
- Main chart card (spans 2/3): "Scans ao longo do tempo", area chart with an
  orange gradient fill fading to transparent, hairline grid, hover tooltip
  showing date + scans. Segmented control above it: Dia / Semana / Mes.
- Right column (1/3): "Top QR Codes" list - 5 rows, each with a 40px QR
  thumbnail, name, short link in mono, scan count and a mini bar.
- Bottom row, two cards: "Scans por dispositivo" (donut: Android, iOS,
  Desktop, Outros) and "Atividade recente" (timeline: QR criado, QR pausado,
  destino alterado, limite de scans atingido - each with icon, actor and
  relative time "ha 12 min").
Follow the QR Generator Pro design system defined earlier.
```

---

## 3. Meus QR Codes (a tela de gerenciamento — a mais importante)

```
Design the "Meus QR Codes" management screen for QR Generator Pro. This is the
core screen: a dense, powerful management table where the user controls every
code. Dark theme, pt-BR.
- Header: title "Meus QR Codes" + counter chip "42 codigos"; on the right a
  view switcher (list / grid icons), an "Exportar CSV" ghost button and a
  "+ Criar QR Code" gradient button.
- Filter bar: search field "Buscar por nome, destino ou link curto",
  dropdown filters [Status: Todos/Ativos/Pausados/Expirados/Agendados],
  [Tipo: URL, PIX, WiFi, vCard, WhatsApp, PDF, Cardapio], [Pasta], [Periodo],
  and tag chips. Active filters appear as removable pills below the bar.
- Table rows (56px tall, hairline separators, row lifts on hover):
  checkbox | 44px white-tile QR thumbnail | name + short link in mono with a
  copy icon | type icon + label | destination URL truncated with a tooltip |
  scan count with a 60px sparkline | status pill (Ativo green dot / Pausado
  gray dot / Expirado red dot / Agendado amber dot) | a REAL TOGGLE SWITCH in
  the accent gradient to enable/disable the code instantly | "..." menu
  (Editar, Ver analytics, Duplicar, Baixar PNG/SVG/PDF, Mover para pasta,
  Compartilhar, Excluir).
- Selecting rows reveals a floating glass bulk-action bar anchored bottom
  center: "3 selecionados - Ativar - Pausar - Mover - Excluir".
- Include the empty state ("Voce ainda nao criou nenhum QR Code" with an
  illustrated dashed QR frame and a CTA) and the grid/card variant.
Follow the QR Generator Pro design system defined earlier.
```

---

## 4. Criar QR Code — assistente em 3 passos com preview ao vivo

```
Design the "Criar QR Code" wizard screen for QR Generator Pro: two columns,
form on the left (60%), sticky live preview on the right (40%).
- A 3-step progress indicator at the top: "1 Tipo e conteudo - 2 Design -
  3 Regras e publicacao", completed steps in the accent gradient.
- STEP 1: a grid of selectable type cards with line icons - Link/URL, PIX,
  WhatsApp, Wi-Fi, vCard, E-mail, SMS, PDF, Cardapio digital, App Store,
  Video, Texto. The selected card gets a gradient border and a soft glow.
  Below it, the contextual form for the chosen type (for URL: "Nome interno",
  "Destino (URL)", "Pasta", "Tags"), plus a highlighted switch card
  "QR Code dinamico - permite editar o destino e pausar depois de impresso"
  turned on, with a "Recomendado" badge.
- STEP 2 (design panel as tabs): Cores (foreground/background pickers +
  gradient option + preset swatches), Modulos (dot styles: quadrado,
  arredondado, pontos, extra-arredondado), Olhos (frame and pupil styles),
  Logo (drag-and-drop upload with size slider and "remover fundo" toggle),
  Moldura com chamada ("ESCANEIE-ME", "PECA AQUI", custom text, color, font),
  Nivel de correcao de erros (L/M/Q/H segmented control).
- STEP 3: scheduling and rules - "Ativar em", "Expirar em", "Limite de scans",
  "Proteger com senha", "Redirecionar por dispositivo (iOS/Android)",
  "Redirecionar por pais", "Link curto personalizado" showing
  qrpro.link/meu-cardapio as an editable slug in mono.
- LIVE PREVIEW panel: the QR on a white rounded tile with a soft shadow, a
  mockup toggle (celular / cartao / adesivo), the short link with a copy
  button, a scannability meter ("Otima legibilidade" green / "Contraste baixo"
  amber warning) and download buttons PNG - SVG - PDF - EPS.
- Sticky footer bar: "Cancelar" ghost, "Salvar rascunho", "Criar QR Code"
  gradient.
Follow the QR Generator Pro design system defined earlier.
```

---

## 5. Detalhe do QR Code + Analytics

```
Design the detail/analytics screen for a single QR code in QR Generator Pro.
- Header block: a large white QR tile on the left; on the right the name
  "Cardapio Verao 2026" (editable inline), the short link in mono with copy
  and open icons, the destination URL with an "Editar destino" pencil,
  creation date, folder and tags. Far right: a prominent status card with the
  ON/OFF toggle, label "QR Code ativo", helper text "Desative para exibir a
  pagina de indisponibilidade sem perder o historico", and buttons "Baixar",
  "Compartilhar" and a "..." menu.
- Alert strip variant (amber) for scheduled/expiring codes:
  "Este QR Code expira em 12 dias (14/09/2026)" with "Estender prazo".
- KPI row: Total de scans, Scans unicos, Scans hoje, Dispositivo mais usado.
- Charts grid:
  - Wide area chart "Scans por dia" with a range selector.
  - Brazil/world choropleth map "Scans por localizacao" with a ranked city
    list beside it and an orange intensity scale.
  - Donut "Sistema operacional" (iOS, Android, Windows, Outros).
  - Bar chart "Scans por hora do dia" with heat-tinted bars.
  - Table "Ultimos scans": data/hora, cidade, dispositivo, navegador, IP mascarado.
- Right rail: "Historico de alteracoes" timeline (destino alterado, pausado,
  reativado) with actor avatars and timestamps.
Follow the QR Generator Pro design system defined earlier.
```

---

## 6. Modal de controle: pausar, agendar e regras

```
Design the control modal of QR Generator Pro, centered over a blurred dark
overlay, 560px wide, 20px radius, one soft deep shadow.
Title "Controle do QR Code" + subtitle with the code name.
Content:
- A large highlighted switch row: "QR Code ativo" with the gradient toggle ON
  and the explanation "Quem escanear sera redirecionado para o destino atual".
  When OFF the row turns neutral gray and reveals a nested option:
  "Pagina exibida quando desativado" - radio options [Pagina padrao do sistema,
  Mensagem personalizada, Redirecionar para outra URL].
- Divider, then "Agendamento": two datetime inputs "Ativar em" / "Desativar em"
  and the hint "Fuso horario: America/Sao_Paulo".
- "Limite de scans": numeric input + switch "Desativar automaticamente ao
  atingir o limite".
- "Protecao": switch "Exigir senha" with a password field, and switch
  "Bloquear novos scans fora do horario comercial".
Footer: "Cancelar" ghost + "Salvar alteracoes" gradient.
Also design the danger confirmation dialog variant for "Excluir QR Code", with
a red-tinted icon, a warning that printed codes will stop working forever, and
a field where the user types the code name to confirm.
Follow the QR Generator Pro design system defined earlier.
```

---

## 7. Página pública de QR desativado (o que o usuário final vê)

```
Design the public landing page shown when someone scans a paused, expired or
scan-limited QR code from QR Generator Pro. Mobile-first, full screen, pt-BR.
- A centered card over the dark atmospheric background with the blurred orbs.
- A large 96px line icon of a paused QR code inside a soft circular glow.
- Headline "Este QR Code esta temporariamente indisponivel" and supportive text
  "O responsavel desativou este codigo. Tente novamente mais tarde ou entre em
  contato."
- Optional owner-customized block: brand logo, custom message and a primary
  button with a fallback link (e.g. "Visitar nosso site" / "Falar no WhatsApp").
- Discreet footer "Protegido por QR Generator Pro" with the logo mark.
- Also produce the two sibling variants: "QR Code expirado" (amber accent) and
  "Este QR Code exige senha" (single password input + unlock button).
Follow the QR Generator Pro design system defined earlier.
```

---

## 8. Pastas, Equipe e Configurações

```
Design the settings area of QR Generator Pro with a secondary vertical tab
navigation inside the content area: [Perfil, Workspace, Dominios, Equipe,
API e Webhooks, Faturamento, Notificacoes].
- "Dominios": table of custom short domains (qrpro.link, menu.suamarca.com.br)
  with DNS status pills (Verificado / Pendente), an "Adicionar dominio" button
  and an expandable DNS instructions block with copyable CNAME records in mono.
- "Equipe": member list with avatar, name, e-mail, role dropdown (Proprietario,
  Editor, Visualizador), last-active time, "Convidar membro" button and a
  pending-invites section.
- "API e Webhooks": masked API key in mono with reveal/copy/regenerate, a usage
  meter, and a webhook endpoints table with event checkboxes (qr.criado,
  qr.pausado, qr.escaneado) and delivery status.
- "Faturamento": current plan card with a gradient border, usage bars (QR
  codes, scans, membros), invoice history table and payment method.
Also design the "Pastas" screen: a grid of folder cards with a stacked-QR
thumbnail, name, count "12 codigos", color dot and "..." menu, plus a
"Nova pasta" dashed card.
Follow the QR Generator Pro design system defined earlier.
```

---

## 9. Mobile (app / responsivo)

```
Design the mobile version of QR Generator Pro (390x844), dark theme, pt-BR:
1. Painel: KPI cards in a horizontal snap-scroll carousel, compact area chart,
   "Top QR Codes" list.
2. Meus QR Codes: card list (QR thumbnail on the left, name, short link, scans,
   status pill and the on/off toggle on the right), a sticky search + filter
   chips row on top, and a floating "+" gradient FAB bottom-right.
3. Criar QR Code: single-column stepped flow with the live preview pinned in a
   collapsible bottom sheet.
Bottom tab bar with 5 items (Painel, QR Codes, Criar [center gradient circle],
Analytics, Perfil) on a glass background.
Follow the QR Generator Pro design system defined earlier.
```

---

## 10. Micro-prompts de refinamento (use depois de gerar)

Cole no chat do Stitch, um por vez, para ajustar sem regenerar tudo:

```
Increase whitespace: 32px page padding, 24px card padding, 24px grid gap.
```
```
Reduce the orange accent to buttons, active states and the primary data series
only. Everything else stays neutral.
```
```
Make the table denser and more editorial: 13px mono for links and IDs,
uppercase 11px column headers with 0.08em letter-spacing, hairline separators
at rgba(255,255,255,0.08), no vertical borders.
```
```
Replace all filled or multicolor icons with 1.5px Lucide-style line icons in
the secondary text color.
```
```
Add the light theme version of this same screen, keeping identical layout,
spacing and the orange accent.
```
```
Show the empty state and the loading skeleton variants of this screen.
```

---

## Referências visuais usadas

| Referência | O que aproveitar |
|---|---|
| **Dub.co** | tabela de links curtos com analytics inline, chip de status, ações rápidas |
| **Linear** | densidade, hairlines, tipografia apertada, atalhos ⌘K |
| **Stripe Dashboard** | hierarquia de números, gráficos sóbrios, tabelas de dados |
| **Vercel / Geist** | dark elegante, cards com borda de 1px, estados vazios |
| **Raycast** | glass sutil, sombras profundas em modais |
| **Uniqode / QR Code Generator PRO** | fluxo de criação em passos, painel de personalização, moldura com CTA |
| **Framer** | landing page com bento grid e mockup flutuante |

---

## Ordem sugerida de geração no Stitch

1. Prompt Mestre → 2. Meus QR Codes → 3. Criar QR Code → 4. Detalhe/Analytics
→ 5. Painel → 6. Modal de controle → 7. Página de QR desativado → 8. Landing
→ 9. Configurações → 10. Mobile

Comece pela tela **Meus QR Codes**: é ela que define o "sabor" do produto.
Se ela ficar elegante, o resto herda.
