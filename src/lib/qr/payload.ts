import { encodeContent } from "./content/encode";
import type { QrContent } from "./content/types";

/**
 * A string que o QR carrega de fato — o elo entre o conteúdo e o motor.
 *
 * Estático: a codificação do conteúdo, gravada para sempre no desenho.
 * Dinâmico: o link curto, que passa pelo `/r/[slug]` (Fase 6) e por isso
 * pode trocar de destino depois de impresso.
 *
 * Roda nos dois lados: o preview chama no browser, a exportação chama no
 * servidor. Por isso a base do link vem por parâmetro, e não de `env`.
 */
export function qrPayload(
  content: QrContent,
  isDynamic: boolean,
  slug: string,
  baseUrl: string,
): string {
  if (!isDynamic) return encodeContent(content);
  return `${baseUrl.replace(/\/+$/, "")}/r/${slug}`;
}
