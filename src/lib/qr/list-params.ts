import type { QrEffectiveStatus, QrType } from "@/lib/supabase/types";

/**
 * Vocabulário da listagem — o que a URL pode dizer.
 *
 * Fica separado de `queries.ts` de propósito: aquele arquivo é `server-only`
 * e arrasta o cliente do Supabase junto, e a barra de filtros roda no
 * browser. Os dois lados precisam concordar sobre os mesmos nomes de
 * ordenação, então eles moram aqui, sem dependência de nada.
 */

export const PER_PAGE = 20;

export const LIST_SORTS = {
  recentes: { column: "created_at", ascending: false, label: "Mais recentes" },
  antigos: { column: "created_at", ascending: true, label: "Mais antigos" },
  nome: { column: "name", ascending: true, label: "Nome (A–Z)" },
  scans: { column: "scan_count", ascending: false, label: "Mais escaneados" },
  ultimo: {
    column: "last_scan_at",
    ascending: false,
    label: "Leitura mais recente",
  },
} as const;

export type ListSort = keyof typeof LIST_SORTS;

export interface ListParams {
  q: string;
  type: QrType | "todos";
  status: QrEffectiveStatus | "todos";
  sort: ListSort;
  page: number;
}

const TIPOS: QrType[] = [
  "url",
  "pix",
  "whatsapp",
  "wifi",
  "vcard",
  "email",
  "sms",
  "text",
  "pdf",
  "menu",
  "appstore",
  "video",
];

export const ESTADOS: QrEffectiveStatus[] = [
  "active",
  "paused",
  "scheduled",
  "expired",
  "limit_reached",
  "archived",
];

/**
 * Lê os parâmetros da URL. Qualquer valor estranho vira o padrão em vez de
 * erro: a barra de endereços é editável, e uma lista que quebra porque
 * alguém mexeu no `?ordem=` não ajuda ninguém.
 */
export function parseListParams(
  sp: Record<string, string | string[] | undefined>,
): ListParams {
  const um = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";

  const type = um(sp.tipo) as QrType;
  const status = um(sp.estado) as QrEffectiveStatus;
  const sort = um(sp.ordem) as ListSort;
  const page = Number.parseInt(um(sp.pagina), 10);

  return {
    q: um(sp.q).trim().slice(0, 80),
    type: TIPOS.includes(type) ? type : "todos",
    status: ESTADOS.includes(status) ? status : "todos",
    sort: sort in LIST_SORTS ? sort : "recentes",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

/** Há busca ou filtro ativo? Muda o texto do estado vazio. */
export function estaFiltrando(params: ListParams): boolean {
  return !!params.q || params.type !== "todos" || params.status !== "todos";
}
