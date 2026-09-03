/**
 * A paleta dos gráficos.
 *
 * Não é a paleta da interface, e a diferença tem motivo. Os tokens do tema
 * (`--color-primary`, `--color-secondary`…) foram escolhidos para *texto*
 * sobre fundo escuro, então são claros demais para servirem de marca de
 * dado: postos lado a lado num gráfico, `#FFB59E` e `#FFC86B` ficam a ΔE 8.7
 * um do outro — indistinguíveis mesmo para quem enxerga todas as cores.
 *
 * Estes seis passos foram derivados dos mesmos matizes da marca e depois
 * *medidos*, não escolhidos no olho. Todos passam, sobre as três superfícies
 * de card do tema (`#06283F`, `#0d222e`, `#00121F`):
 *
 *   • faixa de luminosidade OKLCH dentro de 0,48–0,67 (modo escuro)
 *   • croma acima de 0,10 (abaixo disso um matiz lê como cinza)
 *   • separação sob daltonismo protan/deutan: pior par adjacente ΔE 8,2
 *   • separação com visão normal: pior par adjacente ΔE 15,6
 *   • contraste ≥ 3:1 contra a superfície
 *
 * **A ordem é fixa e nunca é ciclada.** Verde e ciano ficam separados na
 * sequência de propósito: encostados, caíam para ΔE 11 e sumiam um no outro.
 * Uma sétima categoria não ganha cor nova — vira "outros" (veja `comCauda`
 * em `lib/qr/analytics.ts`).
 *
 * Para revalidar depois de mexer: a skill `dataviz` traz o
 * `scripts/validate_palette.js`.
 */
export const CORES_CATEGORICAS = [
  "#F4561A", // laranja da marca
  "#00A3BC", // ciano
  "#BC871F", // âmbar
  "#00A06F", // verde
  "#9E6DE6", // violeta
  "#CC5C8B", // rosa
] as const;

/** A cor da fatia `i`. Passar do fim é erro de quem chamou, não motivo para
 *  gerar um matiz novo — daí o módulo devolver a última em vez de inventar. */
export function corDaFatia(i: number): string {
  return CORES_CATEGORICAS[Math.min(i, CORES_CATEGORICAS.length - 1)];
}

/**
 * Cor única das séries temporais. Leituras e leituras únicas não são
 * categorias rivais: uma está *dentro* da outra. Por isso são o mesmo matiz
 * em dois papéis — área preenchida e linha — em vez de duas cores que
 * sugeririam grandezas independentes.
 */
export const COR_LEITURAS = "#F4561A";
export const COR_UNICAS = "#00A3BC";

/**
 * Cores de estado, reservadas. Nunca entram num gráfico categórico como
 * "série 4": elas significam *bom* e *ruim*, e emprestá-las a uma categoria
 * qualquer faria a tela dizer que "Android" é um problema.
 */
export const COR_ENTREGUE = "#00A06F";
export const COR_BLOQUEADO = "#BC871F";

/** Cinza recessivo da grade e dos eixos. */
export const COR_GRADE = "rgba(255,255,255,0.08)";
export const COR_EIXO = "#8fa6b8";
