import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { QrEffectiveStatus, ScanOutcome } from "@/lib/supabase/types";
import { encodeContent } from "./content/encode";
import type { QrContent } from "./content/types";
import { escolherDestino, lerDeviceRules, lerGeoRules } from "./rules";
import type { ContextoVisita } from "./rules";
import { OUTCOME_POR_ESTADO, effectiveStatus } from "./status";

/**
 * O cérebro do `/r/[slug]` — item 6.1.
 *
 * Fica fora da página de propósito: a página cuida de HTTP (cookies,
 * cabeçalhos, resposta) e este arquivo cuida da decisão. Assim a mesma
 * decisão pode ser reexecutada pela action que confere a senha, sem
 * duplicar a regra de negócio nos dois lugares.
 *
 * Lê com a chave `service_role`. É inevitável: quem escaneia não tem sessão,
 * e o RLS de `qr_codes` só mostra a linha ao dono. O que sai daqui para a
 * resposta é filtrado à mão — nunca a linha inteira.
 */

/** As colunas de que a decisão depende. Nada de `user_id` ou `design`. */
const COLUNAS =
  "id, slug, name, is_dynamic, type, content, destination, status, active_from, expires_at, scan_limit, scan_count, password_hash, disabled_behavior, disabled_message, disabled_redirect_url, device_rules, geo_rules";

export interface QrDoRedirect {
  id: string;
  slug: string;
  name: string;
  is_dynamic: boolean;
  type: string;
  content: unknown;
  destination: string | null;
  status: "active" | "paused" | "archived";
  active_from: string | null;
  expires_at: string | null;
  scan_limit: number | null;
  scan_count: number;
  password_hash: string | null;
  disabled_behavior: "default" | "message" | "redirect";
  disabled_message: string | null;
  disabled_redirect_url: string | null;
  device_rules: unknown;
  geo_rules: unknown;
}

export async function buscarPorSlug(slug: string): Promise<QrDoRedirect | null> {
  // O formato é conferido antes de ir ao banco: um slug com 300 caracteres
  // vindo de um scanner de vulnerabilidade não merece uma ida ao Postgres.
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(slug)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select(COLUNAS)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as QrDoRedirect;
}

/** O que a página deve fazer com esta visita. */
export type Decisao =
  | { tipo: "seguir"; url: string; regra: "padrao" | "dispositivo" | "pais" }
  | { tipo: "senha" }
  | { tipo: "bloqueado"; estado: Exclude<QrEffectiveStatus, "active"> }
  /** Estático apontando para cá: o link curto existe, mas nunca foi o destino. */
  | { tipo: "sem-destino" };

export interface DecisaoContexto extends ContextoVisita {
  /** O visitante já provou que sabe a senha (cookie assinado válido)? */
  senhaLiberada: boolean;
}

/**
 * Decide, na ordem em que a decisão importa.
 *
 * O estado vem antes da senha: um código pausado não deve pedir senha —
 * pedir sugere que existe uma senha certa capaz de abrir aquilo, e não
 * existe. A senha vem antes das regras de dispositivo e país porque ela
 * protege o destino, e escolher *qual* destino só faz sentido depois de a
 * pessoa ter direito a algum.
 */
export function decidir(qr: QrDoRedirect, ctx: DecisaoContexto): Decisao {
  const estado = effectiveStatus(qr);
  if (estado !== "active") return { tipo: "bloqueado", estado };

  if (qr.password_hash && !ctx.senhaLiberada) return { tipo: "senha" };

  const padrao = destinoPadrao(qr);
  if (!padrao) return { tipo: "sem-destino" };

  const escolha = escolherDestino(
    padrao,
    lerDeviceRules(qr.device_rules as never),
    lerGeoRules(qr.geo_rules as never),
    ctx,
  );

  return { tipo: "seguir", url: escolha.url, regra: escolha.regra };
}

/**
 * Para onde o código leva quando nenhuma regra especial se aplica.
 *
 * `destination` é a coluna que o dono edita (item 4.5) e a resposta na
 * imensa maioria dos casos. O `encodeContent` é a rede de segurança para as
 * linhas antigas, criadas antes de a coluna ser preenchida: melhor
 * recalcular a partir do conteúdo do que devolver "sem destino" para um
 * código que funciona.
 */
function destinoPadrao(qr: QrDoRedirect): string | null {
  if (qr.destination) return qr.destination;
  try {
    return encodeContent(qr.content as QrContent) || null;
  } catch {
    return null;
  }
}

/** Como registrar esta decisão em `scans.outcome`. */
export function outcomeDe(decisao: Decisao): ScanOutcome {
  switch (decisao.tipo) {
    case "seguir":
      return "redirected";
    case "senha":
      return "password_required";
    case "bloqueado":
      return OUTCOME_POR_ESTADO[decisao.estado];
    case "sem-destino":
      // Não há categoria para "o dono configurou errado". Contar como
      // pausado é o mais honesto: para quem escaneou, o efeito é o mesmo.
      return "blocked_paused";
  }
}
