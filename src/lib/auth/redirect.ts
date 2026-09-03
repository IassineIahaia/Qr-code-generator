/**
 * Só aceita caminho interno. Sem isto, `?redirectTo=https://site-falso`
 * transformaria nosso login numa ponte de phishing (open redirect).
 */
export function destinoSeguro(destino: string | null | undefined) {
  if (!destino) return "/painel";
  if (!destino.startsWith("/") || destino.startsWith("//")) return "/painel";
  return destino;
}
