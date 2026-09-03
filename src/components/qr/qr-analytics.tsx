import Link from "next/link";
import { Ban, Scan, TrendingUp, Users } from "lucide-react";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui";
import { HorasDoDia } from "@/components/charts/horas-do-dia";
import {
  Quebra,
  rotuloAparelho,
  rotuloDesfecho,
  rotuloPais,
  rotuloSimples,
} from "@/components/charts/quebra";
import { SeletorPeriodo } from "@/components/charts/seletor-periodo";
import { SerieDiaria } from "@/components/charts/serie-diaria";
import { ScansRecentes } from "./scans-recentes";
import {
  comCauda,
  variacao,
  type LeituraRecente,
  type QrAnalytics as Dados,
} from "@/lib/qr/analytics";
import { PERIODOS, type PeriodoId } from "@/lib/qr/period";

/**
 * A seção de analytics de um QR — itens 7.1 a 7.6.
 *
 * Server Component: tudo aqui é leitura, e as únicas ilhas de browser são o
 * gráfico de linha (recharts precisa do DOM), o seletor de período e o
 * botão "ver como tabela".
 *
 * A ordem das peças segue a ordem das perguntas de quem abre esta tela:
 * *quanto* (os KPIs), *quando* (a série e as horas), *quem* (aparelho,
 * sistema, navegador), *onde* (país e cidade) e, por último, *o que deu
 * errado* (os bloqueios) — que só aparece quando houve algum.
 */

export interface QrAnalyticsProps {
  qrId: string;
  dados: Dados;
  leituras: LeituraRecente[];
  periodo: PeriodoId;
}

export function QrAnalyticsSection({
  qrId,
  dados,
  leituras,
  periodo,
}: QrAnalyticsProps) {
  const varTotal = variacao(dados.total, dados.total_anterior);
  const varUnicos = variacao(dados.unicos, dados.unicos_anterior);
  const janela = PERIODOS[periodo].label.toLowerCase();

  const nunca = dados.total === 0 && dados.bloqueados === 0;

  return (
    <section className="flex flex-col gap-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-title text-on-surface">Analytics</h2>
        <div className="flex items-center gap-2">
          <SeletorPeriodo atual={periodo} />
          {/* Item 7.6. É um `<a>` de verdade, e não um botão com fetch: o
              navegador já sabe baixar arquivo, e assim funciona com
              ctrl+clique e com "salvar como". */}
          <a
            href={`/painel/codigos/${qrId}/leituras.csv?periodo=${periodo}`}
            className="text-[12px] text-primary underline-offset-4 hover:underline"
          >
            Baixar CSV
          </a>
        </div>
      </div>

      {nunca ? (
        <Card>
          <CardBody className="flex flex-col gap-2 py-stack-lg text-center">
            <p className="text-on-surface">
              Nenhuma leitura {janela === "desde o início" ? "ainda" : `nos ${janela}`}.
            </p>
            <p className="text-[13px] text-on-surface-variant">
              Assim que alguém escanear o código, os números aparecem aqui —
              dia a dia, por aparelho e por lugar.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {/* ---------- quanto ---------- */}
      <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Leituras"
          value={dados.total.toLocaleString("pt-BR")}
          delta={varTotal ?? undefined}
          hint={textoDaVariacao(varTotal, dados.total_anterior)}
          icon={<Scan size={15} />}
          className="border-t-2 border-t-primary-container"
        />
        <StatCard
          label="Pessoas distintas"
          value={dados.unicos.toLocaleString("pt-BR")}
          delta={varUnicos ?? undefined}
          hint={textoDaVariacao(varUnicos, dados.unicos_anterior)}
          icon={<Users size={15} />}
          className="border-t-2 border-t-secondary-container"
        />
        <StatCard
          label="Leituras por pessoa"
          value={
            dados.unicos > 0
              ? (dados.total / dados.unicos).toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })
              : "—"
          }
          hint="quantas vezes cada uma voltou"
          icon={<TrendingUp size={15} />}
          className="border-t-2 border-t-tertiary-container"
        />
        <StatCard
          label="Bloqueadas"
          value={dados.bloqueados.toLocaleString("pt-BR")}
          hint={
            dados.bloqueados > 0
              ? "alguma regra barrou"
              : "nenhuma regra barrou ninguém"
          }
          icon={<Ban size={15} />}
          className="border-t-2 border-t-warning"
        />
      </div>

      {/* ---------- quando ---------- */}
      <div className="grid gap-stack-md xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader
            title="Leituras por dia"
            description="Cada leitura entregue. As bloqueadas ficam de fora — elas não chegaram ao destino."
          />
          <CardBody>
            <SerieDiaria dados={dados.serie} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Hora do dia"
            description="Somando o período inteiro: o horário em que seu público escaneia."
          />
          <CardBody>
            <HorasDoDia dados={dados.horas} />
          </CardBody>
        </Card>
      </div>

      {/* ---------- quem e onde ---------- */}
      <div className="grid gap-stack-md md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Aparelho" />
          <CardBody>
            <Quebra
              fatias={comCauda(dados.aparelhos)}
              rotulo={rotuloAparelho}
              total={dados.total}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sistema" />
          <CardBody>
            <Quebra
              fatias={comCauda(dados.sistemas)}
              rotulo={rotuloSimples}
              total={dados.total}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Navegador" />
          <CardBody>
            <Quebra
              fatias={comCauda(dados.navegadores)}
              rotulo={rotuloSimples}
              total={dados.total}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="País" />
          <CardBody>
            <Quebra
              fatias={comCauda(dados.paises)}
              rotulo={rotuloPais}
              total={dados.total}
              vazio="Nenhum país identificado. Em desenvolvimento local não há de onde ler — a informação vem da borda da hospedagem."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cidade" />
          <CardBody>
            <Quebra
              fatias={comCauda(dados.cidades)}
              rotulo={rotuloSimples}
              total={dados.total}
              vazio="Nenhuma cidade identificada."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Origem"
            description="De onde a pessoa veio. QR escaneado pela câmera não tem origem: entra como acesso direto."
          />
          <CardBody>
            <Quebra
              fatias={comCauda(dados.origens)}
              rotulo={rotuloSimples}
              total={dados.total}
            />
          </CardBody>
        </Card>
      </div>

      {/* ---------- o que deu errado ---------- */}
      {dados.bloqueados > 0 ? (
        <Card className="border-warning/25">
          <CardHeader
            title="Leituras que não chegaram ao destino"
            description="Quase sempre é uma regra sua funcionando. Se não for o que você queria, ajuste em Regras, acima."
          />
          <CardBody>
            <Quebra
              fatias={dados.desfechos}
              rotulo={rotuloDesfecho}
              total={dados.bloqueados}
            />
          </CardBody>
        </Card>
      ) : null}

      {/* ---------- linha a linha ---------- */}
      <Card>
        <CardHeader
          title="Últimas leituras"
          description="As 25 mais recentes, entregues e bloqueadas. O histórico completo sai no CSV."
          action={
            <Link
              href={`/painel/codigos/${qrId}/leituras.csv?periodo=${periodo}`}
              className="text-[12px] text-primary underline-offset-4 hover:underline"
            >
              Baixar CSV
            </Link>
          }
        />
        <CardBody className="p-0">
          <ScansRecentes leituras={leituras} />
        </CardBody>
      </Card>
    </section>
  );
}

/**
 * A legenda que acompanha a variação percentual.
 *
 * Sem janela anterior não existe porcentagem — e dizer "+100%" quando se
 * saiu de zero seria inventar uma comparação. A tela fala a verdade: é o
 * primeiro período com dados.
 */
function textoDaVariacao(v: number | null, anterior: number): string {
  if (v === null) {
    return anterior === 0 ? "primeiro período com dados" : "vs. período anterior";
  }
  return "vs. período anterior";
}
