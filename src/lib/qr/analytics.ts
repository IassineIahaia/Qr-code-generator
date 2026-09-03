import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ScanOutcome } from "@/lib/supabase/types";

/**
 * Leitura das agregações — Fase 7.
 *
 * O trabalho pesado está em `0006_analytics.sql`; aqui só chamamos e damos
 * forma. A regra que guia este arquivo: **nunca contar no Node o que o
 * Postgres já sabe contar**. Trazer cem mil linhas de `scans` para somar em
 * JavaScript funcionaria hoje e derreteria no dia em que o produto pegasse.
 *
 * O RLS continua sendo quem protege: as funções são `security invoker`, e
 * pedir os números de um código alheio devolve zeros, não erro.
 */

/** Uma fatia de uma quebra — aparelho, SO, país, o que for. */
export interface Fatia {
  chave: string;
  total: number;
}

export interface PontoDoDia {
  dia: string; // YYYY-MM-DD, no fuso do produto
  total: number;
  unicos: number;
}

export interface PontoDaHora {
  hora: number; // 0–23
  total: number;
}

export interface QrAnalytics {
  total: number;
  unicos: number;
  bloqueados: number;
  total_anterior: number;
  unicos_anterior: number;
  serie: PontoDoDia[];
  horas: PontoDaHora[];
  aparelhos: Fatia[];
  sistemas: Fatia[];
  navegadores: Fatia[];
  paises: Fatia[];
  cidades: Fatia[];
  origens: Fatia[];
  desfechos: Fatia[];
}

export interface TopCodigo {
  qr_id: string;
  nome: string;
  slug: string;
  total: number;
  unicos: number;
}

export interface AccountAnalytics {
  total: number;
  unicos: number;
  bloqueados: number;
  total_anterior: number;
  unicos_anterior: number;
  serie: PontoDoDia[];
  top_codigos: TopCodigo[];
  aparelhos: Fatia[];
  paises: Fatia[];
}

/**
 * A resposta para uma conta sem nenhuma leitura ainda.
 *
 * Existe para que a tela nunca precise checar `null` antes de desenhar: um
 * gráfico de zeros é uma resposta legítima e verdadeira ("ninguém escaneou
 * ainda"), enquanto um `null` obrigaria cada componente a ter dois modos.
 */
const VAZIO_QR: QrAnalytics = {
  total: 0, unicos: 0, bloqueados: 0, total_anterior: 0, unicos_anterior: 0,
  serie: [], horas: [], aparelhos: [], sistemas: [], navegadores: [],
  paises: [], cidades: [], origens: [], desfechos: [],
};

const VAZIO_CONTA: AccountAnalytics = {
  total: 0, unicos: 0, bloqueados: 0, total_anterior: 0, unicos_anterior: 0,
  serie: [], top_codigos: [], aparelhos: [], paises: [],
};

/**
 * `PGRST202` é "não achei a função": a migration `0006` ainda não foi
 * aplicada. Devolvemos vazio em vez de derrubar a página — o resto do
 * detalhe do QR (destino, regras, exportação) não tem nada a ver com
 * analytics e continua servindo.
 */
const FUNCAO_AUSENTE = "PGRST202";

export async function getQrAnalytics(
  qrId: string,
  de: string,
  ate: string,
): Promise<QrAnalytics> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("qr_analytics", {
    p_qr_id: qrId,
    p_from: de,
    p_to: ate,
  });

  if (error) {
    if (error.code !== FUNCAO_AUSENTE) {
      console.error("[analytics] qr_analytics falhou:", error.message);
    }
    return VAZIO_QR;
  }

  return { ...VAZIO_QR, ...(data as unknown as QrAnalytics) };
}

export async function getAccountAnalytics(
  de: string,
  ate: string,
): Promise<AccountAnalytics> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("account_analytics", {
    p_from: de,
    p_to: ate,
  });

  if (error) {
    if (error.code !== FUNCAO_AUSENTE) {
      console.error("[analytics] account_analytics falhou:", error.message);
    }
    return VAZIO_CONTA;
  }

  return { ...VAZIO_CONTA, ...(data as unknown as AccountAnalytics) };
}

/* ------------------------------------------------------------------ */
/*  Últimos scans — item 7.4                                           */
/* ------------------------------------------------------------------ */

export interface LeituraRecente {
  id: number;
  created_at: string;
  outcome: ScanOutcome;
  is_unique: boolean;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  referrer: string | null;
}

/**
 * As últimas leituras, linha a linha.
 *
 * **Sem coluna de IP** — a tela do Stitch tinha uma, e ela não existe aqui
 * porque o dado não existe: `scans` guarda só o hash com sal. Mostrar o
 * hash não ajudaria ninguém, e guardar o IP cru para poder mostrá-lo seria
 * trocar a privacidade de quem escaneia por uma coluna decorativa.
 */
export async function listRecentScans(
  qrId: string,
  limite = 25,
): Promise<LeituraRecente[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scans")
    .select(
      "id, created_at, outcome, is_unique, device_type, os, browser, country, city, referrer",
    )
    .eq("qr_id", qrId)
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error || !data) return [];
  return data as unknown as LeituraRecente[];
}

/* ------------------------------------------------------------------ */
/*  Utilidades de apresentação                                         */
/* ------------------------------------------------------------------ */

/**
 * A variação percentual entre duas janelas.
 *
 * `null` quando a janela anterior foi zero — e isso é deliberado. "Saiu de 0
 * e foi para 40" não é `+∞%` nem `+100%`: é o primeiro período com dados, e
 * a tela precisa dizer isso em vez de inventar um número.
 */
export function variacao(agora: number, antes: number): number | null {
  if (antes === 0) return null;
  return ((agora - antes) / antes) * 100;
}

/**
 * Junta a cauda de uma quebra em "outros".
 *
 * O SQL já corta em 8 fatias; esta função aperta mais, para o teto de cores
 * que um gráfico categórico aguenta. O que sobra não some: vira uma fatia
 * somada, para que as partes continuem fechando com o todo.
 */
export function comCauda(fatias: Fatia[], maximo = 5): Fatia[] {
  if (fatias.length <= maximo) return fatias;

  const cabeca = fatias.slice(0, maximo);
  const resto = fatias.slice(maximo).reduce((soma, f) => soma + f.total, 0);
  return resto > 0 ? [...cabeca, { chave: "outros", total: resto }] : cabeca;
}
