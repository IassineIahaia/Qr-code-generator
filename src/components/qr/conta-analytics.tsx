import Link from "next/link";
import { Ban, QrCode, Scan, Users } from "lucide-react";
import { Card, CardBody, CardHeader, StatCard } from "@/components/ui";
import {
  Quebra,
  rotuloAparelho,
  rotuloPais,
} from "@/components/charts/quebra";
import { SeletorPeriodo } from "@/components/charts/seletor-periodo";
import { SerieDiaria } from "@/components/charts/serie-diaria";
import {
  comCauda,
  variacao,
  type AccountAnalytics,
} from "@/lib/qr/analytics";
import { PERIODOS, type PeriodoId } from "@/lib/qr/period";
import type { ResumoDosCodigos } from "@/lib/qr/queries";

/**
 * Os números da conta inteira — item 7.2.
 *
 * A diferença para a analytics de um código (`QrAnalyticsSection`) não é de
 * tamanho, é de pergunta. Lá a pessoa já sabe qual código quer entender e
 * quer a quebra fina: navegador, cidade, origem, linha a linha. Aqui ela
 * ainda não sabe *onde olhar* — então o que importa é o rumo geral e o
 * ranking que aponta para a próxima tela. Por isso o painel mostra menos
 * quebras, e todas as linhas do ranking são links.
 *
 * Server Component: as únicas ilhas de browser são o seletor de período e o
 * gráfico de linha.
 */

export interface ContaAnalyticsProps {
  dados: AccountAnalytics;
  codigos: ResumoDosCodigos;
  periodo: PeriodoId;
}

export function ContaAnalyticsSection({
  dados,
  codigos,
  periodo,
}: ContaAnalyticsProps) {
  const varTotal = variacao(dados.total, dados.total_anterior);
  const varUnicos = variacao(dados.unicos, dados.unicos_anterior);
  const janela = PERIODOS[periodo].label.toLowerCase();

  return (
    <section className="flex flex-col gap-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-title text-on-surface">
          Visão geral
        </h2>
        <SeletorPeriodo atual={periodo} />
      </div>

      {/* ---------- quanto ---------- */}
      <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Leituras"
          value={dados.total.toLocaleString("pt-BR")}
          delta={varTotal ?? undefined}
          hint={
            varTotal === null && dados.total_anterior === 0
              ? "primeiro período com dados"
              : "vs. período anterior"
          }
          icon={<Scan size={15} />}
          className="border-t-2 border-t-primary-container"
        />
        <StatCard
          label="Pessoas distintas"
          value={dados.unicos.toLocaleString("pt-BR")}
          delta={varUnicos ?? undefined}
          hint={
            varUnicos === null && dados.unicos_anterior === 0
              ? "primeiro período com dados"
              : "vs. período anterior"
          }
          icon={<Users size={15} />}
          className="border-t-2 border-t-secondary-container"
        />
        <StatCard
          label="Códigos ativos"
          value={codigos.ativos.toLocaleString("pt-BR")}
          hint={
            codigos.total === codigos.ativos
              ? "todos os seus códigos"
              : `de ${codigos.total.toLocaleString("pt-BR")} no total`
          }
          icon={<QrCode size={15} />}
          className="border-t-2 border-t-tertiary-container"
        />
        {/* O quarto card troca de assunto conforme o que há para dizer.
            "Precisam de atenção" é o alerta que faz alguém agir hoje;
            sem nenhum código parado, o espaço serve melhor mostrando
            quantas leituras alguma regra barrou. */}
        {codigos.precisamDeAtencao > 0 ? (
          <StatCard
            label="Precisam de atenção"
            value={codigos.precisamDeAtencao.toLocaleString("pt-BR")}
            hint="expirados ou no limite"
            icon={<Ban size={15} />}
            className="border-t-2 border-t-warning"
          />
        ) : (
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
        )}
      </div>

      {/* ---------- quando, e quais ---------- */}
      <div className="grid gap-stack-md xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader
            title="Leituras por dia"
            description={`Todos os seus códigos somados, ${janela.replace(
              "últimos",
              "nos últimos",
            )}. As bloqueadas ficam de fora.`}
          />
          <CardBody>
            <SerieDiaria dados={dados.serie} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Mais escaneados"
            description="Os cinco do período. Clique para abrir a análise do código."
          />
          <CardBody className="p-0">
            <TopCodigos itens={dados.top_codigos} />
          </CardBody>
        </Card>
      </div>

      {/* ---------- quem e onde ---------- */}
      <div className="grid gap-stack-md md:grid-cols-2">
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
      </div>
    </section>
  );
}

/**
 * O ranking do período.
 *
 * Barra de proporção contra o líder, e não contra o total: o normal é um
 * código dominar, e medir contra a soma faria o segundo colocado virar um
 * traço. A comparação que interessa aqui é "quão perto do primeiro".
 */
function TopCodigos({ itens }: { itens: AccountAnalytics["top_codigos"] }) {
  if (itens.length === 0) {
    return (
      <p className="p-stack-md text-[13px] text-on-surface-variant">
        Nenhuma leitura neste período. Assim que alguém escanear, o ranking
        aparece aqui.
      </p>
    );
  }

  const lider = Math.max(...itens.map((i) => i.total), 1);

  return (
    <ol className="flex flex-col">
      {itens.map((item, i) => (
        <li key={item.qr_id} className="border-b border-hairline last:border-0">
          <Link
            href={`/painel/codigos/${item.qr_id}`}
            className="flex flex-col gap-1.5 p-stack-md transition-colors hover:bg-surface-variant/40"
          >
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="font-mono text-caption text-on-surface-variant">
                  {i + 1}
                </span>
                <span className="truncate text-on-surface" title={item.nome}>
                  {item.nome}
                </span>
              </span>
              <span className="shrink-0 font-mono tabular-nums text-on-surface-variant">
                {item.total.toLocaleString("pt-BR")}
                <span className="pl-2 text-on-surface-variant/60">
                  {item.unicos.toLocaleString("pt-BR")} únicas
                </span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant">
              <div
                className="h-full rounded-full bg-primary-container"
                style={{ width: `${Math.max(2, (item.total / lider) * 100)}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
