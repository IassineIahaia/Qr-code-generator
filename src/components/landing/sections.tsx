import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Download,
  Gauge,
  KeyRound,
  Pencil,
  QrCode,
  Shapes,
} from "lucide-react";
import { Card, buttonClasses } from "@/components/ui";

/**
 * As peças da landing — item 8.4.
 *
 * **Nada aqui é invenção.** O desenho do Stitch trazia "+12.000 QR Codes
 * gerados" e três avatares de clientes; os dois saíram. Um número de uso que
 * não existe é propaganda enganosa, não é detalhe de layout — e o dia em que
 * o produto tiver doze mil códigos, esse número entra sozinho, medido.
 * Ficou o que é verdade e se verifica no próprio produto: não há cobrança
 * nenhuma implementada, então "grátis, sem cartão" é literal.
 *
 * Pelo mesmo motivo o menu perdeu "Preços", "Casos de uso" e "Docs": as
 * três telas não existem. Um menu que leva a 404 é pior que um menu curto.
 */

export function Navbar() {
  return (
    <nav className="glass fixed top-0 z-50 w-full border-b border-hairline">
      <div className="mx-auto flex h-20 max-w-app items-center justify-between px-margin-mobile md:px-gutter">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-control bg-brand-gradient">
            <QrCode size={20} className="text-white" aria-hidden />
          </span>
          <span className="font-display text-body-lg font-bold tracking-tight text-on-surface">
            QR Generator Pro
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#recursos"
            className="text-label text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Recursos
          </a>
          <a
            href="#como-funciona"
            className="text-label text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Como funciona
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/entrar"
            className="hidden text-label text-on-surface-variant transition-colors hover:text-on-surface sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/cadastrar"
            className="rounded-full bg-brand-gradient px-5 py-2.5 text-label font-medium text-white transition-all hover:brightness-110"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function Hero() {
  return (
    <section className="mx-auto grid max-w-app items-center gap-16 px-margin-mobile pt-28 pb-14 md:px-gutter md:pt-32 md:pb-24 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <span className="flex w-fit items-center gap-2 rounded-full border border-hairline bg-surface-high px-3 py-1.5">
          <span className="size-2 rounded-full bg-tertiary shadow-[0_0_8px_#45dfa4]" />
          <span className="font-mono text-caption text-on-surface-variant">
            QR dinâmico, com controle e analytics
          </span>
        </span>

        <h1 className="font-display text-[40px] leading-[1.1] font-bold tracking-tight text-on-surface md:text-[56px]">
          Crie, controle e{" "}
          <span className="text-on-surface-variant">desative seus</span> QR
          Codes <span className="text-brand-gradient">quando quiser.</span>
        </h1>

        <p className="max-w-xl text-body-lg text-on-surface-variant">
          O código impresso não muda — o destino dele sim. Troque para onde
          ele leva depois da gráfica, pause quando a campanha acabar e veja
          quantas pessoas escanearam, quando e de onde.
        </p>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <Link
            href="/cadastrar"
            className={buttonClasses("primary", "lg", "rounded-control")}
          >
            Criar meu primeiro QR
            <ArrowRight size={18} aria-hidden />
          </Link>
          <a
            href="#como-funciona"
            className={buttonClasses("secondary", "lg", "rounded-control")}
          >
            Ver como funciona
          </a>
        </div>

        <p className="mt-2 border-t border-hairline pt-6 text-[13px] text-on-surface-variant md:mt-4 md:pt-8">
          <strong className="font-medium text-on-surface">
            Grátis para começar.
          </strong>{" "}
          Sem cartão de crédito — não há cobrança nenhuma no produto hoje.
        </p>
      </div>

      <MockDoPainel />
    </section>
  );
}

/**
 * A ilustração do painel.
 *
 * É desenho, não captura de tela, e os números são de exemplo — está escrito
 * no card, porque um mock com números redondos vira estatística na cabeça de
 * quem lê. O que ele mostra de verdade é a **forma** do produto: um código,
 * o destino atual editável, e a contagem ao lado.
 */
function MockDoPainel() {
  return (
    <div className="relative hidden lg:block" aria-hidden>
      <div
        className="absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,77,0,0.14) 0%, transparent 65%)",
        }}
      />

      <Card tone="elevated" className="flex flex-col gap-stack-md p-stack-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-control border border-hairline bg-surface">
              <QrCode size={20} className="text-on-surface" />
            </span>
            <span className="flex flex-col">
              <span className="font-display text-title text-on-surface">
                Campanha de exemplo
              </span>
              <span className="flex items-center gap-1.5 text-caption text-tertiary">
                <span className="size-1.5 rounded-full bg-tertiary" />
                Ativo
              </span>
            </span>
          </div>
          <span className="rounded-full border border-hairline bg-surface px-2 py-1 font-mono text-[10px] text-on-surface-variant">
            exemplo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-stack-md">
          <div className="flex flex-col gap-1 rounded-card border border-hairline bg-surface p-stack-md">
            <span className="text-caption tracking-wider text-on-surface-variant uppercase">
              Leituras
            </span>
            <span className="font-display text-headline text-on-surface tabular-nums">
              1.492
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-card border border-hairline bg-surface p-stack-md">
            <span className="text-caption tracking-wider text-on-surface-variant uppercase">
              Hoje
            </span>
            <span className="font-display text-headline text-tertiary tabular-nums">
              +38
            </span>
          </div>
        </div>

        <Sparkline />

        <div className="flex flex-col gap-1 rounded-card border border-hairline bg-surface p-stack-md">
          <span className="text-caption tracking-wider text-on-surface-variant uppercase">
            Destino atual
          </span>
          <span className="flex items-center gap-2 font-mono text-data text-secondary">
            https://exemplo.com/verao
            <Pencil size={13} className="text-on-surface-variant" />
          </span>
        </div>
      </Card>
    </div>
  );
}

/** Uma linha decorativa. Sem eixo e sem número: não é um gráfico, é textura. */
function Sparkline() {
  const pontos = [8, 22, 14, 38, 30, 52, 44, 70, 62, 88];
  const caminho = pontos
    .map((v, i) => `${(i / (pontos.length - 1)) * 100},${100 - v}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-24 w-full rounded-card border border-hairline bg-surface"
    >
      <polyline
        points={caminho}
        fill="none"
        stroke="#F4561A"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const RECURSOS = [
  {
    icon: Pencil,
    titulo: "Troque o destino depois de impresso",
    texto:
      "O desenho do código não muda quando o link muda. Mil adesivos já colados continuam valendo — quem escaneia amanhã cai no lugar novo.",
  },
  {
    icon: CalendarClock,
    titulo: "Pause, agende e limite",
    texto:
      "Ligue o código na véspera, desligue quando a promoção acabar, ou pare sozinho depois de N leituras. Quem chegar depois vê um recado seu, não um erro.",
  },
  {
    icon: KeyRound,
    titulo: "Proteja com senha",
    texto:
      "Um código que só abre para quem tem a senha. Quem acerta ganha um passe de 12 horas — e o passe de um código não abre outro.",
  },
  {
    icon: BarChart3,
    titulo: "Saiba quem escaneou",
    texto:
      "Leituras por dia e por hora, pessoas distintas, aparelho, sistema, navegador e país. O endereço IP nunca é guardado — só um hash com sal.",
  },
  {
    icon: Shapes,
    titulo: "Oito tipos de conteúdo",
    texto:
      "Link, Pix, WhatsApp, Wi-Fi, cartão de visita, e-mail, SMS e texto. O Pix sai no BR Code do Banco Central, com o CRC conferido.",
  },
  {
    icon: Download,
    titulo: "Exporte em PNG, SVG e PDF",
    texto:
      "Com cores, gradiente, logo no meio e moldura com chamada. E um medidor que avisa antes de imprimir se o contraste ou o tamanho vão atrapalhar a leitura.",
  },
];

export function Recursos() {
  return (
    <section
      id="recursos"
      className="mx-auto flex max-w-app scroll-mt-24 flex-col gap-stack-lg px-margin-mobile py-14 md:px-gutter md:py-24"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <span className="font-mono text-caption tracking-[0.14em] text-primary uppercase">
          Recursos
        </span>
        <h2 className="font-display text-headline-lg text-on-surface">
          Um QR Code que continua seu depois de sair da gráfica
        </h2>
      </div>

      <div className="grid gap-stack-md md:grid-cols-2 lg:grid-cols-3">
        {RECURSOS.map(({ icon: Icone, titulo, texto }) => (
          <Card key={titulo} className="flex flex-col gap-3 p-stack-md">
            <span className="flex size-10 items-center justify-center rounded-control border border-hairline bg-surface-high text-primary">
              <Icone size={18} aria-hidden />
            </span>
            <h3 className="font-display text-title text-on-surface">{titulo}</h3>
            <p className="text-[13px] leading-relaxed text-on-surface-variant">
              {texto}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

const PASSOS = [
  {
    numero: "01",
    titulo: "Crie",
    texto:
      "Escolha o que o código carrega, ajuste as cores e o formato, e dê a ele um endereço curto. Leva um minuto.",
  },
  {
    numero: "02",
    titulo: "Imprima",
    texto:
      "Baixe em PNG, SVG ou PDF e mande para onde for — cartaz, embalagem, cardápio, crachá. Esse desenho não muda mais.",
  },
  {
    numero: "03",
    titulo: "Controle",
    texto:
      "Do painel, troque o destino, pause, agende, limite ou proteja com senha. E acompanhe as leituras chegando.",
  },
];

export function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="mx-auto flex max-w-app scroll-mt-24 flex-col gap-stack-lg px-margin-mobile py-14 md:px-gutter md:py-24"
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <span className="font-mono text-caption tracking-[0.14em] text-primary uppercase">
          Como funciona
        </span>
        <h2 className="font-display text-headline-lg text-on-surface">
          Três passos, e o controle fica com você
        </h2>
      </div>

      <ol className="grid gap-stack-md md:grid-cols-3">
        {PASSOS.map(({ numero, titulo, texto }) => (
          <li key={numero}>
            <Card className="flex h-full flex-col gap-3 p-stack-md">
              <span className="font-mono text-caption tracking-[0.2em] text-primary">
                {numero}
              </span>
              <h3 className="font-display text-title text-on-surface">
                {titulo}
              </h3>
              <p className="text-[13px] leading-relaxed text-on-surface-variant">
                {texto}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ChamadaFinal() {
  return (
    <section className="mx-auto max-w-app px-margin-mobile py-14 md:px-gutter md:py-24">
      <Card
        tone="elevated"
        className="flex flex-col items-center gap-6 px-margin-mobile py-stack-lg text-center md:px-gutter"
      >
        <span className="flex size-12 items-center justify-center rounded-control bg-brand-gradient">
          <Gauge size={22} className="text-white" aria-hidden />
        </span>
        <h2 className="max-w-2xl font-display text-headline-lg text-on-surface">
          Seu primeiro código leva um minuto
        </h2>
        <p className="max-w-xl text-on-surface-variant">
          Sem cartão, sem instalação. Crie a conta, gere o código e imprima —
          o resto você ajusta depois, sem reimprimir nada.
        </p>
        <Link
          href="/cadastrar"
          className={buttonClasses("primary", "lg", "rounded-control")}
        >
          Começar grátis
          <ArrowRight size={18} aria-hidden />
        </Link>
      </Card>
    </section>
  );
}

export function Rodape() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-app flex-col items-center justify-between gap-4 px-margin-mobile py-stack-lg md:flex-row md:px-gutter">
        <span className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-control bg-brand-gradient">
            <QrCode size={15} className="text-white" aria-hidden />
          </span>
          <span className="font-display text-label font-bold text-on-surface">
            QR Generator Pro
          </span>
        </span>

        <nav className="flex items-center gap-6 text-[13px] text-on-surface-variant">
          <a href="#recursos" className="transition-colors hover:text-on-surface">
            Recursos
          </a>
          <a
            href="#como-funciona"
            className="transition-colors hover:text-on-surface"
          >
            Como funciona
          </a>
          <Link href="/entrar" className="transition-colors hover:text-on-surface">
            Entrar
          </Link>
        </nav>
      </div>
    </footer>
  );
}
