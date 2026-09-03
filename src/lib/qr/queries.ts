import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Json,
  QrCode,
  QrEffectiveStatus,
  QrEventAction,
  QrStatus,
  QrType,
} from "@/lib/supabase/types";
import { LIST_SORTS, PER_PAGE, estaFiltrando, type ListParams } from "./list-params";

/**
 * Leitura da lista de QR Codes. Tudo roda no servidor, sob o RLS: a consulta
 * não filtra por `user_id` porque a política `códigos do dono` já faz isso —
 * e uma cláusula a mais aqui daria a falsa impressão de que ela é o que
 * protege os dados.
 *
 * O filtro por estado usa `qr_effective_status`, a função de `0002_functions`
 * que o PostgREST expõe como coluna computada. É o único jeito honesto de
 * filtrar por "expirado" ou "limite atingido": esses estados não existem em
 * nenhuma coluna, dependem do relógio e do contador.
 */

/** Uma linha da tabela. Só as colunas que a lista mostra. */
export interface QrListRow {
  id: string;
  name: string;
  slug: string;
  type: QrType;
  is_dynamic: boolean;
  destination: string | null;
  content: Json;
  scan_count: number;
  unique_scan_count: number;
  last_scan_at: string | null;
  tags: string[];
  created_at: string;
  /** A intenção gravada — o que o switch da linha mostra. */
  status: QrStatus;
  qr_effective_status: QrEffectiveStatus;
}

export interface ListResult {
  rows: QrListRow[];
  total: number;
  page: number;
  totalPages: number;
  /**
   * `true` quando a conta ainda não tem nenhum QR — estado vazio de verdade,
   * diferente de "a busca não achou nada". São duas telas diferentes: uma
   * convida a criar o primeiro, a outra sugere afrouxar o filtro.
   */
  contaVazia: boolean;
}

const COLUNAS =
  "id, name, slug, type, is_dynamic, destination, content, scan_count, unique_scan_count, last_scan_at, tags, created_at, status, qr_effective_status";

/**
 * `,` `.` `(` `)` e `*` são gramática do PostgREST dentro de um `or(...)`.
 * Deixá-los passar não abre brecha de dados — o RLS não depende disto — mas
 * quebra a consulta, então saem antes de montar o filtro.
 */
function limparBusca(q: string): string {
  return q.replace(/[,.()*\\:"]/g, " ").trim();
}

/**
 * O PostgREST recusa um offset além do fim da lista em vez de devolver
 * vazio. Acontece com `?pagina=9` num link antigo ou quando um filtro
 * encolhe o resultado — não é falha, é uma página que não existe mais.
 */
const RANGE_NOT_SATISFIABLE = "PGRST103";

export async function listQrCodes(params: ListParams): Promise<ListResult> {
  const supabase = await createClient();

  const de = (params.page - 1) * PER_PAGE;
  const ate = de + PER_PAGE - 1;
  const ordem = LIST_SORTS[params.sort];
  const busca = limparBusca(params.q);
  const filtrando = estaFiltrando(params);

  /** Monta a consulta filtrada e ordenada. Só falta escolher a faixa. */
  function consulta() {
    let q = supabase.from("qr_codes").select(COLUNAS, { count: "exact" });

    if (busca) {
      // Nome, destino e link curto: os três jeitos de procurar um QR.
      q = q.or(
        `name.ilike.%${busca}%,destination.ilike.%${busca}%,slug.ilike.%${busca}%`,
      );
    }
    if (params.type !== "todos") q = q.eq("type", params.type);
    if (params.status !== "todos") {
      q = q.eq("qr_effective_status", params.status);
    }

    // `nullsFirst: false` importa em "leitura mais recente": quem nunca foi
    // escaneado tem `last_scan_at` nulo e deve ficar no fim, não no topo.
    return q.order(ordem.column, {
      ascending: ordem.ascending,
      nullsFirst: false,
    });
  }

  let resposta = await consulta().range(de, ate);
  let pagina = params.page;

  if (resposta.error?.code === RANGE_NOT_SATISFIABLE) {
    // Em vez de uma tela de erro por um número na URL, devolvemos a primeira
    // página — que é para onde a pessoa ia acabar indo de qualquer forma.
    resposta = await consulta().range(0, PER_PAGE - 1);
    pagina = 1;
  }

  if (resposta.error) {
    throw new Error(`Não consegui ler seus QR Codes: ${resposta.error.message}`);
  }

  const total = resposta.count ?? 0;
  const rows = (resposta.data ?? []) as unknown as QrListRow[];

  // Só vale a pena perguntar "a conta está vazia?" quando o filtro não achou
  // nada — sem filtro, o próprio `total` já responde.
  let contaVazia = total === 0 && !filtrando;
  if (total === 0 && filtrando) {
    const { count: totalGeral } = await supabase
      .from("qr_codes")
      .select("id", { count: "exact", head: true });
    contaVazia = (totalGeral ?? 0) === 0;
  }

  return {
    rows,
    total,
    page: pagina,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    contaVazia,
  };
}

/** A linha inteira, para a tela de detalhe. */
export type QrDetail = QrCode & { qr_effective_status: QrEffectiveStatus };

/** Um QR pelo id. `null` quando não existe ou não é seu (o RLS decide). */
export async function getQrCode(id: string): Promise<QrDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .select("*, qr_effective_status")
    .eq("id", id)
    .maybeSingle();

  // `22P02` é id malformado: alguém digitou na URL algo que não é UUID.
  // Para quem olha a tela, é a mesma coisa que não existir.
  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Não consegui ler este QR Code: ${error.message}`);
  }

  return (data as QrDetail | null) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Histórico — item 5.8                                               */
/* ------------------------------------------------------------------ */

export interface QrEventoResumo {
  id: number;
  action: QrEventAction;
  meta: Json;
  created_at: string;
  /** Nome de quem fez. `null` quando foi o sistema (expiração automática). */
  autor: string | null;
}

/**
 * As últimas mudanças de um código.
 *
 * O RLS de `qr_events` já limita ao dono, então esta consulta não repete o
 * filtro. O `profiles` entra por join para o histórico dizer *quem* — hoje
 * é sempre a mesma pessoa, mas o item 9.2 (equipe) transforma essa coluna
 * na razão de o histórico existir.
 */
export async function listQrEvents(
  qrId: string,
  limite = 20,
): Promise<QrEventoResumo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_events")
    .select("id, action, meta, created_at, profiles(full_name, email)")
    .eq("qr_id", qrId)
    .order("created_at", { ascending: false })
    .limit(limite);

  // O histórico é um diário: se ele falhar, a tela do código continua útil.
  // Melhor uma seção vazia do que um erro que derruba a página inteira.
  if (error || !data) return [];

  type Linha = {
    id: number;
    action: QrEventAction;
    meta: Json;
    created_at: string;
    profiles: { full_name: string | null; email: string | null } | null;
  };

  return (data as unknown as Linha[]).map((linha) => ({
    id: linha.id,
    action: linha.action,
    meta: linha.meta,
    created_at: linha.created_at,
    autor: linha.profiles?.full_name ?? linha.profiles?.email ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/*  Resumo da conta — item 7.2                                         */
/* ------------------------------------------------------------------ */

export interface ResumoDosCodigos {
  total: number;
  ativos: number;
  /** Expirados e com limite atingido: os que pararam sem ninguém mandar. */
  precisamDeAtencao: number;
}

/**
 * Quantos códigos a conta tem, e em que pé estão.
 *
 * Três contagens `head: true` em paralelo em vez de trazer as linhas e
 * contar aqui — o painel precisa de três números, não de mil registros. O
 * filtro é sobre `qr_effective_status`, a coluna computada: "ativo" aqui
 * significa que uma leitura agora seria entregue, não que a coluna `status`
 * diz `active`. Um código com data marcada para semana que vem conta como
 * agendado, e é isso que o dono vê na listagem.
 */
export async function resumoDosCodigos(): Promise<ResumoDosCodigos> {
  const supabase = await createClient();
  const contar = () => supabase.from("qr_codes").select("id", { count: "exact", head: true });

  const [todos, ativos, parados] = await Promise.all([
    contar(),
    contar().eq("qr_effective_status", "active"),
    contar().in("qr_effective_status", ["expired", "limit_reached"]),
  ]);

  return {
    total: todos.count ?? 0,
    ativos: ativos.count ?? 0,
    precisamDeAtencao: parados.count ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Busca rápida da paleta ⌘K — item 8.3                               */
/* ------------------------------------------------------------------ */

export interface QrEncontrado {
  id: string;
  name: string;
  slug: string;
  type: QrType;
  qr_effective_status: QrEffectiveStatus;
}

/**
 * Os códigos que casam com o termo, para a paleta de comandos.
 *
 * Deliberadamente magra perto de `listQrCodes`: sem contagem, sem
 * paginação, sem `content` nem `design`, teto de 6 linhas. A paleta dispara
 * a cada tecla — o que ela precisa é de uma resposta em um piscar, e o
 * caminho para a lista completa está a um Enter de distância.
 */
export async function searchQrCodes(termo: string): Promise<QrEncontrado[]> {
  const busca = limparBusca(termo);
  if (busca.length < 2) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .select("id, name, slug, type, qr_effective_status")
    .or(`name.ilike.%${busca}%,destination.ilike.%${busca}%,slug.ilike.%${busca}%`)
    .order("last_scan_at", { ascending: false, nullsFirst: false })
    .limit(6);

  // A paleta não mostra erro: uma busca que falhou é uma busca sem
  // resultado, e a pessoa segue digitando.
  if (error || !data) return [];
  return data as unknown as QrEncontrado[];
}
