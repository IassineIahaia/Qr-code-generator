import { NextResponse, type NextRequest } from "next/server";
import { getQrCode } from "@/lib/qr/queries";
import { janelaDe, parsePeriodo } from "@/lib/qr/period";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { FUSO } from "@/lib/qr/status";
import type { ScanOutcome } from "@/lib/supabase/types";

/**
 * Exportação das leituras em CSV — item 7.6.
 *
 * É route handler porque a resposta é um arquivo, não uma tela. E é um `<a
 * href>` do lado do cliente, não um botão com `fetch`: assim o navegador
 * cuida do download, ctrl+clique abre em outra aba e "salvar como" funciona.
 *
 * O `id` do QR vai na URL e o RLS decide: pedir o CSV de um código alheio
 * devolve 404, o mesmo que pedir a tela dele.
 */

/** Teto de linhas. Acima disso o arquivo deixa de ser útil numa planilha. */
const MAXIMO = 50_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const qr = await getQrCode(id);
  if (!qr) return NextResponse.json({ erro: "Não encontrado." }, { status: 404 });

  const periodo = parsePeriodo(
    request.nextUrl.searchParams.get("periodo") ?? undefined,
  );
  const { de, ate } = janelaDe(periodo, qr.created_at);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scans")
    .select(
      "created_at, outcome, is_unique, device_type, os, browser, country, city, referrer",
    )
    .eq("qr_id", id)
    .gte("created_at", de)
    .lt("created_at", ate)
    .order("created_at", { ascending: false })
    .limit(MAXIMO);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const csv = montarCsv(data ?? []);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeDoArquivo(qr.slug, periodo)}"`,
      // Um CSV de leituras muda a cada leitura: cache aqui entregaria
      // números velhos com cara de novos.
      "Cache-Control": "no-store",
    },
  });
}

interface LinhaCsv {
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

const CABECALHO = [
  "data_hora_brasilia",
  "desfecho",
  "primeira_leitura",
  "aparelho",
  "sistema",
  "navegador",
  "pais",
  "cidade",
  "origem",
];

const DESFECHOS: Record<ScanOutcome, string> = {
  redirected: "entregue",
  blocked_paused: "bloqueada_pausado",
  blocked_expired: "bloqueada_expirado",
  blocked_scheduled: "bloqueada_agendado",
  blocked_limit: "bloqueada_limite",
  password_required: "parou_na_senha",
};

function montarCsv(linhas: LinhaCsv[]): string {
  const corpo = linhas.map((l) =>
    [
      dataParaPlanilha(l.created_at),
      DESFECHOS[l.outcome] ?? l.outcome,
      l.is_unique ? "sim" : "nao",
      l.device_type ?? "",
      l.os ?? "",
      l.browser ?? "",
      l.country ?? "",
      l.city ?? "",
      l.referrer ?? "",
    ]
      .map(escapar)
      .join(";"),
  );

  // O BOM e o `;` são para o Excel em português: sem o BOM ele lê UTF-8 como
  // Latin-1 e "São Paulo" vira "SÃ£o Paulo"; com vírgula como separador, ele
  // joga a linha inteira numa célula só, porque no pt-BR a vírgula é
  // separador decimal. LibreOffice e Google Sheets aceitam os dois.
  return "﻿" + [CABECALHO.join(";"), ...corpo].join("\r\n") + "\r\n";
}

/**
 * Aspas em volta e aspas dobradas dentro — a regra do RFC 4180.
 *
 * O `'` na frente de valores que começam com `=`, `+`, `-` ou `@` não é
 * capricho: sem ele, uma cidade ou um referrer que comece com `=` seria
 * interpretado pelo Excel como fórmula. É a injeção de fórmula em CSV, e o
 * dado aqui vem de fora (user-agent, referrer), então não é hipotético.
 */
function escapar(valor: string): string {
  const texto = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return `"${texto.replace(/"/g, '""')}"`;
}

/** `02/09/2026 14:32:07` — o formato que a planilha pt-BR reconhece. */
function dataParaPlanilha(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: FUSO,
  })
    .format(new Date(iso))
    .replace(",", "");
}

function nomeDoArquivo(slug: string, periodo: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `leituras-${slug}-${periodo}-${hoje}.csv`;
}
