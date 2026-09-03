/**
 * Slug curto — o pedaço final de `qrpro.link/r/ab3kx9`.
 *
 * É a única parte do QR que uma pessoa pode precisar digitar à mão, e é
 * imutável depois de impresso. Por isso o alfabeto exclui os caracteres que
 * se confundem na leitura (`0/O`, `1/l/I`) e o comprimento é curto.
 */

/** Sem `0`, `O`, `1`, `l` e `I`. Igual ao de `generate_qr_slug` no banco. */
const ALFABETO = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * 6 caracteres em 56 símbolos dão ~31 bits — 34 bilhões de combinações. Com
 * um milhão de códigos, a chance de colisão numa tentativa é de 1 em 34 mil,
 * e o índice único do banco resolve as que escaparem.
 */
export const SLUG_SIZE = 6;

/** O mesmo `check` da coluna `qr_codes.slug`. */
export const SLUG_PATTERN = /^[A-Za-z0-9_-]{3,40}$/;

/**
 * Nomes que não podem virar slug: são rotas do app ou palavras que passariam
 * a impressão de página oficial num link curto.
 */
const RESERVADOS = new Set([
  "api",
  "auth",
  "admin",
  "app",
  "conta",
  "cadastrar",
  "entrar",
  "sair",
  "painel",
  "login",
  "logout",
  "novo",
  "nova-senha",
  "recuperar-senha",
  "suporte",
  "ajuda",
  "sobre",
  "termos",
  "privacidade",
  "pagamento",
  "pix",
  "www",
  "ui",
  "static",
  "public",
  "assets",
]);

/** Sorteia um slug. Não consulta o banco: a unicidade é do índice único. */
export function generateSlug(size: number = SLUG_SIZE): string {
  const valores = new Uint32Array(size);
  // `crypto` existe no browser e no Node 19+; nada de `Math.random()` aqui,
  // porque um slug adivinhável deixa o link curto enumerável.
  crypto.getRandomValues(valores);

  let saida = "";
  for (let i = 0; i < size; i++) {
    saida += ALFABETO[valores[i] % ALFABETO.length];
  }
  return saida;
}

/**
 * Transforma um texto qualquer num slug aceitável: sem acento, sem espaço,
 * sem símbolo. Usado quando a pessoa digita o slug personalizado.
 */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type SlugProblem =
  | "curto"
  | "longo"
  | "invalido"
  | "reservado"
  | "ocupado";

export const SLUG_MESSAGES: Record<SlugProblem, string> = {
  curto: "Use pelo menos 3 caracteres.",
  longo: "No máximo 40 caracteres.",
  invalido: "Use apenas letras, números, hífen e underscore.",
  reservado: "Este endereço é reservado pelo sistema.",
  ocupado: "Este endereço já está em uso. Tente outro.",
};

/** Checagem de formato, sem tocar no banco. `null` = formato aceitável. */
export function checkSlugFormat(slug: string): SlugProblem | null {
  const valor = slug.trim();
  if (valor.length < 3) return "curto";
  if (valor.length > 40) return "longo";
  if (!SLUG_PATTERN.test(valor)) return "invalido";
  if (RESERVADOS.has(valor.toLowerCase())) return "reservado";
  return null;
}
