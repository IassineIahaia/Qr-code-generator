import "server-only";

import { UAParser } from "ua-parser-js";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScanOutcome } from "@/lib/supabase/types";
import { plataformaDe, type Plataforma } from "./rules";

/**
 * Registro das leituras — itens 6.2 e 6.3.
 *
 * Grava com a chave `service_role`: quem escaneia não está logado, e o RLS
 * de `scans` não tem política de insert nenhuma justamente para que a única
 * porta de escrita seja esta função, no servidor.
 *
 * O IP nunca é gravado cru. Ele vira um hash com sal — dá para contar
 * visitantes distintos e barrar abuso sem guardar o endereço de ninguém.
 */

/** O que dá para saber sobre a visita a partir da requisição. */
export interface Visita {
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
  /** ISO-2, quando a borda informa (`x-vercel-ip-country` e afins). */
  pais: string | null;
  cidade: string | null;
  /** Cookie `qrv`, posto pelo middleware. Ausente em quem bloqueia cookies. */
  visitanteId: string | null;
}

export interface LeituraInterpretada {
  deviceType: string;
  os: string | null;
  browser: string | null;
  plataforma: Plataforma | null;
  ehRobo: boolean;
}

const codificador = new TextEncoder();

async function sha256Hex(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", codificador.encode(texto));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hash com sal. Sem o sal do ambiente, o hash de um IP seria reversível
 *  por força bruta: são só 4 bilhões de possibilidades. */
export function hashComSal(valor: string): Promise<string> {
  return sha256Hex(`${env.scanIpSalt()}|${valor}`);
}

/**
 * Robôs conhecidos — item 6.8, primeira metade.
 *
 * Um link colado no WhatsApp, no Slack ou no X é visitado pelo robô que
 * monta a pré-visualização, muitas vezes *antes* de qualquer humano. Contar
 * essas visitas inflaria a métrica logo no lançamento da campanha, que é
 * exatamente quando o dono está olhando o número.
 */
const ROBOS =
  /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegram|slackbot|discordbot|twitterbot|linkedinbot|embedly|preview|pingdom|uptime|headless|lighthouse|curl|wget|python-requests|axios|go-http|monitor/i;

export function interpretarUserAgent(ua: string | null): LeituraInterpretada {
  if (!ua) {
    return {
      deviceType: "outro",
      os: null,
      browser: null,
      plataforma: null,
      ehRobo: false,
    };
  }

  const r = new UAParser(ua).getResult();
  // `device.type` vem vazio no desktop: o parser só o preenche quando
  // reconhece um aparelho. Vazio, aqui, quer dizer computador.
  const deviceType = r.device.type ?? "desktop";
  const os = r.os.name ?? null;

  return {
    deviceType,
    os,
    browser: r.browser.name ?? null,
    plataforma: plataformaDe(os, deviceType),
    ehRobo: ROBOS.test(ua),
  };
}

/** Lê o IP do cliente atrás dos proxies da hospedagem. */
export function ipDaRequisicao(headers: Headers): string | null {
  const encaminhado = headers.get("x-forwarded-for");
  // A lista vem "cliente, proxy1, proxy2": o primeiro é quem originou.
  if (encaminhado) {
    const primeiro = encaminhado.split(",")[0]?.trim();
    if (primeiro) return primeiro;
  }
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? null;
}

/** País e cidade que a borda anexa. Nomes diferentes por hospedagem. */
export function geoDaRequisicao(headers: Headers): {
  pais: string | null;
  cidade: string | null;
} {
  const pais =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code");

  const cidadeBruta =
    headers.get("x-vercel-ip-city") ?? headers.get("cf-ipcity");

  return {
    pais: pais && /^[A-Za-z]{2}$/.test(pais) ? pais.toUpperCase() : null,
    // A Vercel manda a cidade percent-encoded ("S%C3%A3o%20Paulo").
    cidade: cidadeBruta ? seguroDecodificar(cidadeBruta) : null,
  };
}

function seguroDecodificar(valor: string): string {
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}

/** Só o host do referrer: a URL inteira carregaria dados de quem indicou. */
function origemDoReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).host || null;
  } catch {
    return null;
  }
}

export interface RegistroDeLeitura {
  qrId: string;
  outcome: ScanOutcome;
  visita: Visita;
  leitura: LeituraInterpretada;
}

/**
 * Grava a leitura. Nunca lança: um erro aqui não pode derrubar o redirect
 * — a pessoa que escaneou não tem nada a ver com o nosso banco fora do ar,
 * e chegar ao destino importa mais que a estatística.
 */
export async function registrarLeitura({
  qrId,
  outcome,
  visita,
  leitura,
}: RegistroDeLeitura): Promise<void> {
  try {
    const supabase = createAdminClient();

    const ipHash = visita.ip ? await hashComSal(visita.ip) : null;

    /**
     * Item 6.3 — leitura única.
     *
     * A identidade do visitante é o cookie `qrv` quando ele existe. Sem
     * cookie (navegação anônima, bloqueador), caímos no par IP+UA: pior,
     * porque uma rede corporativa inteira vira "um visitante", mas melhor
     * que contar toda releitura como nova pessoa. O hash inclui o `qrId`
     * para que o mesmo visitante em dois códigos diferentes conte como único
     * nos dois — e para que a coluna não permita cruzar por onde alguém
     * andou.
     */
    const identidade =
      visita.visitanteId ?? `${ipHash ?? "sem-ip"}|${visita.userAgent ?? ""}`;
    const visitorHash = await hashComSal(`${qrId}|${identidade}`);

    // "Único" é sempre a primeira leitura *bem-sucedida* daquele visitante:
    // tentativas bloqueadas não gastam a primeira visita dele.
    let ehUnico = false;
    if (outcome === "redirected") {
      const { count } = await supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("qr_id", qrId)
        .eq("visitor_hash", visitorHash)
        .eq("outcome", "redirected");

      ehUnico = (count ?? 0) === 0;
    }

    await supabase.from("scans").insert({
      qr_id: qrId,
      outcome,
      is_unique: ehUnico,
      visitor_hash: visitorHash,
      ip_hash: ipHash,
      device_type: leitura.deviceType,
      os: leitura.os,
      browser: leitura.browser,
      country: visita.pais,
      city: visita.cidade,
      referrer: origemDoReferrer(visita.referrer),
      // O user-agent inteiro fica para o dono conseguir investigar um pico
      // estranho. É dado de aparelho, não de pessoa.
      user_agent: visita.userAgent?.slice(0, 400) ?? null,
    });
  } catch (erro) {
    console.error("[scan] não consegui registrar a leitura:", erro);
  }
}
