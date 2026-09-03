/**
 * O seletor de período — item 7.5.
 *
 * Fica separado de `analytics.ts` pelo mesmo motivo de `list-params.ts`:
 * aquele arquivo é `server-only` e arrasta o cliente do Supabase junto,
 * enquanto o seletor roda no browser. Os dois lados precisam concordar sobre
 * os mesmos nomes, então eles moram aqui, sem dependência de nada.
 */

export const PERIODOS = {
  "7d": { label: "Últimos 7 dias", dias: 7 },
  "30d": { label: "Últimos 30 dias", dias: 30 },
  "90d": { label: "Últimos 90 dias", dias: 90 },
  tudo: { label: "Desde o início", dias: null },
} as const;

export type PeriodoId = keyof typeof PERIODOS;

export const PERIODO_PADRAO: PeriodoId = "30d";

/**
 * Lê o período da URL. Valor estranho vira o padrão em vez de erro — a
 * barra de endereços é editável, e um gráfico que quebra porque alguém
 * mexeu no `?periodo=` não ajuda ninguém.
 */
export function parsePeriodo(valor: string | string[] | undefined): PeriodoId {
  const bruto = (Array.isArray(valor) ? valor[0] : valor) ?? "";
  return bruto in PERIODOS ? (bruto as PeriodoId) : PERIODO_PADRAO;
}

/**
 * A janela em instantes ISO.
 *
 * "Desde o início" precisa de uma data e não de `null`, porque a função SQL
 * também usa a duração da janela para montar o período de comparação. Uma
 * data bem anterior ao produto resolve: a comparação fica vazia, que é a
 * resposta certa — não existe "antes do início".
 */
export function janelaDe(periodo: PeriodoId, criadoEm?: string): {
  de: string;
  ate: string;
} {
  const ate = new Date();
  const dias = PERIODOS[periodo].dias;

  if (dias === null) {
    // Ancorar na criação do código deixa o eixo do gráfico honesto: sem
    // isso, "desde o início" desenharia meses vazios antes de ele existir.
    const inicio = criadoEm ? new Date(criadoEm) : new Date("2026-01-01");
    return { de: inicio.toISOString(), ate: ate.toISOString() };
  }

  const de = new Date(ate);
  de.setDate(de.getDate() - dias);
  return { de: de.toISOString(), ate: ate.toISOString() };
}

/** Quantos dias a janela cobre — decide o passo dos rótulos do eixo X. */
export function diasDaJanela(de: string, ate: string): number {
  const ms = new Date(ate).getTime() - new Date(de).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}
