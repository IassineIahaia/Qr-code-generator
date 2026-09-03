import type { Json } from "@/lib/supabase/types";
import { normalizeUrl } from "./content/encode";

/**
 * Redirecionamento por dispositivo e por país — item 5.6.
 *
 * O caso que justifica isto é o QR de app: um único adesivo na vitrine que
 * leva o iPhone à App Store e o Android à Play Store. O segundo caso é o
 * site com versões por país.
 *
 * As duas tabelas moram em `qr_codes.device_rules` e `qr_codes.geo_rules`,
 * colunas `jsonb`. Como qualquer JSON pode estar lá (inclusive de uma versão
 * anterior do produto), tudo que sai delas passa por uma leitura defensiva.
 */

export type Plataforma = "ios" | "android" | "desktop";

export type DeviceRules = Partial<Record<Plataforma, string>>;

/** País ISO-2 em maiúsculas → destino. */
export type GeoRules = Record<string, string>;

export const PLATAFORMAS: { chave: Plataforma; label: string; exemplo: string }[] = [
  { chave: "ios", label: "iPhone e iPad", exemplo: "https://apps.apple.com/app/..." },
  { chave: "android", label: "Android", exemplo: "https://play.google.com/store/apps/..." },
  { chave: "desktop", label: "Computador", exemplo: "https://seusite.com/baixar" },
];

/** Só aceitamos http(s): um `javascript:` numa coluna jsonb viraria XSS. */
export function destinoSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const bruto = valor.trim();
  if (!bruto) return null;

  const normalizado = normalizeUrl(bruto);
  try {
    const url = new URL(normalizado);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function lerDeviceRules(bruto: Json | null | undefined): DeviceRules {
  const regras: DeviceRules = {};
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return regras;

  for (const { chave } of PLATAFORMAS) {
    const destino = destinoSeguro((bruto as Record<string, unknown>)[chave]);
    if (destino) regras[chave] = destino;
  }
  return regras;
}

export function lerGeoRules(bruto: Json | null | undefined): GeoRules {
  const regras: GeoRules = {};
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return regras;

  for (const [pais, valor] of Object.entries(bruto as Record<string, unknown>)) {
    const iso = pais.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(iso)) continue;
    const destino = destinoSeguro(valor);
    if (destino) regras[iso] = destino;
  }
  return regras;
}

/** Do que o redirect precisa saber sobre quem escaneou. */
export interface ContextoVisita {
  plataforma: Plataforma | null;
  /** ISO-2 em maiúsculas, quando a borda souber dizer. */
  pais: string | null;
}

export interface DestinoEscolhido {
  url: string;
  /** Qual regra ganhou — vai para `scans` e para o histórico do dono. */
  regra: "padrao" | "dispositivo" | "pais";
}

/**
 * Escolhe para onde mandar.
 *
 * **Dispositivo vence país.** A regra de dispositivo costuma ser a que não
 * tem substituto — mandar um iPhone para a Play Store não é uma versão pior
 * do destino, é um link que não abre. Já a regra de país é quase sempre uma
 * localização, e servir a versão errada de um site ainda leva a algo
 * utilizável.
 */
export function escolherDestino(
  destinoPadrao: string,
  deviceRules: DeviceRules,
  geoRules: GeoRules,
  ctx: ContextoVisita,
): DestinoEscolhido {
  if (ctx.plataforma) {
    const porDispositivo = deviceRules[ctx.plataforma];
    if (porDispositivo) return { url: porDispositivo, regra: "dispositivo" };
  }

  if (ctx.pais) {
    const porPais = geoRules[ctx.pais];
    if (porPais) return { url: porPais, regra: "pais" };
  }

  return { url: destinoPadrao, regra: "padrao" };
}

/**
 * Traduz o sistema operacional lido do user-agent para a plataforma que as
 * regras conhecem. Tablet Android e iPad entram junto com os telefones: o
 * que importa para a regra é qual loja de apps atende aquele aparelho.
 */
export function plataformaDe(
  os: string | null,
  deviceType: string | null,
): Plataforma | null {
  const sistema = (os ?? "").toLowerCase();
  if (sistema.includes("ios") || sistema.includes("ipados") || sistema.includes("mac os")) {
    // Um Mac não abre a App Store do iPhone: só o iOS/iPadOS vira `ios`.
    if (sistema.includes("mac os")) return "desktop";
    return "ios";
  }
  if (sistema.includes("android")) return "android";
  if (!sistema) return null;

  return deviceType === "mobile" || deviceType === "tablet" ? null : "desktop";
}
