import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Card, CardBody, buttonClasses } from "@/components/ui";
import { ContaAnalyticsSection } from "@/components/qr/conta-analytics";
import { getAccountAnalytics } from "@/lib/qr/analytics";
import { janelaDe, parsePeriodo } from "@/lib/qr/period";
import { resumoDosCodigos } from "@/lib/qr/queries";

export const metadata: Metadata = { title: "Painel" };

/**
 * O painel — item 7.2.
 *
 * A pergunta que esta tela responde é "como foi o período?", e ela responde
 * antes de pedir qualquer clique: os KPIs e o gráfico estão no primeiro
 * quadro. O shell definitivo (sidebar, topbar, busca ⌘K) entra no item 8.3;
 * o que muda lá é a moldura, não o conteúdo daqui.
 */
export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();

  // O middleware já barraria, mas a página não pode depender disso: um dia
  // o matcher muda e esta rota não pode virar pública por acidente.
  if (!user) redirect("/entrar?redirectTo=/painel");

  const periodo = parsePeriodo((await searchParams).periodo);
  // "Desde o início" ancora na criação da conta: sem isso o eixo desenharia
  // meses vazios de antes de a pessoa existir aqui.
  const { de, ate } = janelaDe(periodo, user.created_at);

  const supabase = await createClient();

  // Só o primeiro nome, para a saudação — o avatar e o e-mail são do menu
  // do usuário, que vive no layout e busca o próprio perfil. Leitura
  // sujeita ao RLS: só enxerga o que pertence a este usuário.
  const perfilQuery = supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const [{ data: perfil }, codigos, analytics] = await Promise.all([
    perfilQuery,
    resumoDosCodigos(),
    getAccountAnalytics(de, ate),
  ]);

  const nome = perfil?.full_name ?? user.user_metadata?.full_name ?? null;

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-headline-lg text-on-surface">
          {saudacao()}, {nome?.split(" ")[0] ?? "tudo certo"}
        </h1>
        <p className="text-on-surface-variant">
          {codigos.total > 0
            ? "Como seus códigos andaram no período."
            : "Seu primeiro QR Code leva um minuto."}
        </p>
      </header>

      {/* Conta sem nenhum código não vê gráficos de zero. Quatro cards
          vazios e uma linha rente ao eixo não informam nada — só ensinam
          que esta tela é inútil. Enquanto não há o que medir, a tela tem
          uma tarefa só. */}
      {codigos.total === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-start gap-3 py-stack-lg">
            <h2 className="font-display text-title text-on-surface">
              Nada para medir ainda
            </h2>
            <p className="max-w-prose text-[13px] text-on-surface-variant">
              Crie um código dinâmico, imprima onde quiser e volte aqui: a
              partir da primeira leitura esta tela mostra quantas pessoas
              escanearam, quando, em que aparelho e de onde — e o destino
              continua editável depois de impresso.
            </p>
            <Link href="/painel/criar" className={buttonClasses("primary")}>
              Criar o primeiro
              <ArrowRight size={16} />
            </Link>
          </CardBody>
        </Card>
      ) : (
        <ContaAnalyticsSection
          dados={analytics}
          codigos={codigos}
          periodo={periodo}
        />
      )}
    </>
  );
}

/**
 * "Bom dia" no horário de quem lê, não no do servidor.
 *
 * O servidor pode estar em qualquer fuso, e o resto do produto já fixou
 * Brasília como o fuso do negócio (`lib/qr/datetime.ts`) — a saudação segue
 * a mesma regra em vez de inventar uma terceira.
 */
function saudacao(): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(new Date()),
  );

  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}
