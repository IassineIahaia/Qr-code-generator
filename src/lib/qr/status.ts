import type {
  QrEffectiveStatus,
  QrStatus,
  ScanOutcome,
} from "@/lib/supabase/types";

/**
 * A máquina de estados do QR — item 5.2.
 *
 * O `status` da tabela é só a *intenção* do dono: ativo, pausado ou
 * arquivado. O estado real também depende do relógio e do contador de
 * leituras, e é ele que o redirect obedece.
 *
 * Esta função é o gêmeo em TypeScript de `public.qr_effective_status`
 * (`0002_functions.sql`). As duas existem porque cada lado precisa da
 * resposta num momento diferente: o Postgres para *filtrar* a listagem, o
 * Node para *decidir* o redirect. **A ordem dos testes tem que ser idêntica
 * nos dois** — se divergirem, a lista dirá "ativo" sobre um código que o
 * redirect está bloqueando.
 */

/** As colunas de que o estado depende. Nada além disto entra na decisão. */
export interface QrControl {
  status: QrStatus;
  active_from: string | null;
  expires_at: string | null;
  scan_limit: number | null;
  scan_count: number;
}

/**
 * Resolve o estado real.
 *
 * A precedência não é arbitrária. Pausar é um gesto manual e vence tudo:
 * quem apertou o botão espera que o código pare agora, sem ter que primeiro
 * limpar o agendamento. Expirado vem antes de agendado porque uma janela já
 * fechada é definitiva, enquanto "agendado" promete uma abertura futura —
 * mostrar "agendado" para algo que expirou seria mentir sobre o futuro.
 */
export function effectiveStatus(
  qr: QrControl,
  now: Date = new Date(),
): QrEffectiveStatus {
  if (qr.status === "archived") return "archived";
  if (qr.status === "paused") return "paused";

  const t = now.getTime();

  if (qr.expires_at && new Date(qr.expires_at).getTime() <= t) return "expired";
  if (qr.active_from && new Date(qr.active_from).getTime() > t) {
    return "scheduled";
  }
  if (qr.scan_limit !== null && qr.scan_count >= qr.scan_limit) {
    return "limit_reached";
  }

  return "active";
}

/** Só um estado deixa passar. */
export function podeRedirecionar(status: QrEffectiveStatus): boolean {
  return status === "active";
}

/**
 * Como cada bloqueio é registrado em `scans.outcome`.
 *
 * `archived` não tem `outcome` próprio no schema: para quem escaneia, um
 * código arquivado é indistinguível de um pausado, e inventar uma sexta
 * categoria só para o dono seria detalhe interno vazando na métrica.
 */
export const OUTCOME_POR_ESTADO: Record<QrEffectiveStatus, ScanOutcome> = {
  active: "redirected",
  paused: "blocked_paused",
  archived: "blocked_paused",
  scheduled: "blocked_scheduled",
  expired: "blocked_expired",
  limit_reached: "blocked_limit",
};

/** O evento gravado no histórico quando o dono muda a intenção. */
export const EVENTO_POR_STATUS = {
  active: "activated",
  paused: "paused",
  archived: "updated",
} as const satisfies Record<QrStatus, string>;

/**
 * O que a pessoa que escaneou vê. Texto voltado a ela, não ao dono: nada de
 * "limite de scans atingido" — quem está com o celular na mão não sabe o que
 * é isso nem tem como resolver.
 */
export interface RecadoPublico {
  titulo: string;
  detalhe: string;
}

export const RECADO_PUBLICO: Record<
  Exclude<QrEffectiveStatus, "active">,
  RecadoPublico
> = {
  paused: {
    titulo: "Este QR Code está pausado",
    detalhe:
      "Quem publicou o código o desativou por enquanto. Tente de novo mais tarde.",
  },
  archived: {
    titulo: "Este QR Code está pausado",
    detalhe:
      "Quem publicou o código o desativou por enquanto. Tente de novo mais tarde.",
  },
  scheduled: {
    titulo: "Este QR Code ainda não está no ar",
    detalhe: "Ele foi programado para começar a funcionar mais adiante.",
  },
  expired: {
    titulo: "Este QR Code expirou",
    detalhe: "O prazo de validade dele terminou e o destino saiu do ar.",
  },
  limit_reached: {
    titulo: "Este QR Code não está mais disponível",
    detalhe: "Ele atingiu o número de leituras previsto por quem o publicou.",
  },
};

/**
 * O que o *dono* vê no painel. Aqui, sim, o vocabulário é técnico e a data
 * aparece: ele é quem pode agir sobre o motivo.
 */
export function explicarParaDono(
  qr: QrControl,
  status: QrEffectiveStatus,
): string | null {
  switch (status) {
    case "active":
      return qr.expires_at
        ? `No ar. Expira em ${formatarData(qr.expires_at)}.`
        : null;
    case "paused":
      return "Você pausou este código. Quem escanear vê uma página de indisponível.";
    case "archived":
      return "Arquivado. Some da listagem padrão e não redireciona.";
    case "scheduled":
      return qr.active_from
        ? `Entra no ar em ${formatarData(qr.active_from)}.`
        : "Agendado.";
    case "expired":
      return qr.expires_at
        ? `Expirou em ${formatarData(qr.expires_at)}. Estenda ou remova a data para voltar ao ar.`
        : "Expirado.";
    case "limit_reached":
      return `Atingiu o limite de ${qr.scan_limit?.toLocaleString("pt-BR")} leituras. Aumente ou remova o limite para voltar ao ar.`;
  }
}

/** Data no fuso do produto — o mesmo em que os agendamentos são lidos. */
export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  }).format(new Date(iso));
}

/** Fuso de referência do produto (item 5.3). */
export const FUSO = "America/Sao_Paulo";
