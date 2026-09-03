import type { Fatia } from "@/lib/qr/analytics";
import { COR_LEITURAS } from "./palette";

/**
 * Uma quebra em barras horizontais ordenadas — sistema, navegador, país,
 * cidade, origem.
 *
 * **Por que não a rosca do desenho do Stitch.** Rosca e pizza só funcionam
 * para parte-do-todo *num relance*, com poucas fatias e valores bem
 * diferentes. As quebras reais aqui são quase sempre o contrário: nomes
 * longos ("Mobile Safari", "São Paulo"), muitas categorias e valores
 * próximos — exatamente o caso em que ninguém consegue dizer qual arco é
 * maior. A barra ordenada resolve os três problemas de uma vez, e ainda
 * carrega o número ao lado.
 *
 * O componente é a própria alternativa em tabela: rótulo, valor e
 * porcentagem estão escritos, não só desenhados. Nada aqui depende de
 * enxergar cor — é por isso que uma cor só basta, e a comparação fica por
 * conta do comprimento.
 */

export interface QuebraProps {
  fatias: Fatia[];
  /** Traduz a chave crua do banco para algo legível. */
  rotulo?: (chave: string) => string;
  /**
   * O denominador das porcentagens. Vem de fora porque o SQL corta a cauda
   * em 8 fatias: somar o que está na tela daria 100% de um todo incompleto.
   */
  total?: number;
  vazio?: string;
  max?: number;
}

export function Quebra({
  fatias,
  rotulo = (c) => c,
  total,
  vazio = "Sem dados neste período.",
  max = 6,
}: QuebraProps) {
  const linhas = fatias.slice(0, max);

  if (linhas.length === 0) {
    return <p className="text-[13px] text-on-surface-variant">{vazio}</p>;
  }

  // A barra mais longa é o topo do ranking, não o total: com uma categoria
  // dominante (o normal), tudo o mais viraria um traço invisível.
  const maior = Math.max(...linhas.map((f) => f.total), 1);
  const denominador = total ?? fatias.reduce((s, f) => s + f.total, 0);

  return (
    <ol className="flex flex-col gap-2.5">
      {linhas.map((fatia) => {
        const proporcao = denominador > 0 ? fatia.total / denominador : 0;

        return (
          <li key={fatia.chave} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate text-on-surface" title={rotulo(fatia.chave)}>
                {rotulo(fatia.chave)}
              </span>
              <span className="shrink-0 font-mono tabular-nums text-on-surface-variant">
                {fatia.total.toLocaleString("pt-BR")}
                <span className="pl-2 text-on-surface-variant/60">
                  {(proporcao * 100).toLocaleString("pt-BR", {
                    maximumFractionDigits: 0,
                  })}
                  %
                </span>
              </span>
            </div>
            {/* O trilho fica visível de propósito: sem ele, uma barra curta
                pareceria um dado faltando em vez de um valor pequeno. */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((fatia.total / maior) * 100, 2)}%`,
                  background: COR_LEITURAS,
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/*  Tradutores das chaves cruas                                        */
/* ------------------------------------------------------------------ */

const APARELHOS: Record<string, string> = {
  mobile: "Celular",
  tablet: "Tablet",
  desktop: "Computador",
  smarttv: "Smart TV",
  console: "Console",
  wearable: "Vestível",
  embedded: "Embarcado",
  desconhecido: "Não identificado",
  outros: "Outros",
};

export function rotuloAparelho(chave: string): string {
  return APARELHOS[chave] ?? chave;
}

/**
 * País em ISO-2 vira o nome por conta do próprio browser/Node — não vale a
 * pena carregar uma tabela de 250 países que o `Intl` já tem.
 */
const NOMES_DE_PAIS = new Intl.DisplayNames(["pt-BR"], { type: "region" });

export function rotuloPais(chave: string): string {
  if (chave === "desconhecido") return "Não identificado";
  if (chave === "outros") return "Outros";
  try {
    return NOMES_DE_PAIS.of(chave) ?? chave;
  } catch {
    return chave;
  }
}

export function rotuloSimples(chave: string): string {
  if (chave === "desconhecido") return "Não identificado";
  if (chave === "outros") return "Outros";
  if (chave === "direto") return "Acesso direto";
  return chave;
}

const DESFECHOS: Record<string, string> = {
  blocked_paused: "Bloqueada — código pausado",
  blocked_expired: "Bloqueada — código expirado",
  blocked_scheduled: "Bloqueada — ainda não começou",
  blocked_limit: "Bloqueada — limite atingido",
  password_required: "Parou na senha",
};

export function rotuloDesfecho(chave: string): string {
  return DESFECHOS[chave] ?? chave;
}
