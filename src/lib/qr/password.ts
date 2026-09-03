/**
 * Senha do QR Code — item 5.5.
 *
 * PBKDF2-SHA256 pela Web Crypto, sem dependência nova: `crypto.subtle` é o
 * mesmo objeto no Node 18+, no runtime de edge e no browser, então o mesmo
 * arquivo serve para gravar (Server Action) e conferir (redirect).
 *
 * Não é bcrypt/argon2, e a diferença importa menos aqui do que pareceria:
 * esta senha protege o *destino de um link*, não uma conta. Ainda assim,
 * guardamos derivado com sal — quem obtivesse o banco não teria as senhas.
 */

const ITERACOES = 120_000;
const TAMANHO_SAL = 16;
const TAMANHO_CHAVE = 32; // bytes

const codificador = new TextEncoder();

function paraBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function deBase64(texto: string): Uint8Array {
  const bin = atob(texto);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function derivar(
  senha: string,
  sal: Uint8Array,
  iteracoes: number,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    codificador.encode(senha),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // `BufferSource` aceita a view direto; o `slice` evita carregar um
      // buffer maior por engano quando o sal vem de dentro de outro array.
      salt: sal.slice(),
      iterations: iteracoes,
      hash: "SHA-256",
    },
    material,
    TAMANHO_CHAVE * 8,
  );

  return new Uint8Array(bits);
}

/**
 * Gera a string que vai para `qr_codes.password_hash`.
 * Formato: `pbkdf2$sha256$<iterações>$<sal>$<derivado>`, tudo em base64 —
 * o número de iterações fica gravado junto para que subir esse custo amanhã
 * não invalide as senhas de hoje.
 */
export async function hashSenha(senha: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(TAMANHO_SAL));
  const derivado = await derivar(senha, sal, ITERACOES);
  return `pbkdf2$sha256$${ITERACOES}$${paraBase64(sal)}$${paraBase64(derivado)}`;
}

/** Compara sem vazar o ponto onde a diferença apareceu. */
function iguaisEmTempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** A senha digitada bate com o que está gravado? */
export async function conferirSenha(
  senha: string,
  gravado: string | null,
): Promise<boolean> {
  if (!gravado) return false;

  const partes = gravado.split("$");
  if (partes.length !== 5 || partes[0] !== "pbkdf2" || partes[1] !== "sha256") {
    return false;
  }

  const iteracoes = Number(partes[2]);
  if (!Number.isInteger(iteracoes) || iteracoes < 1000 || iteracoes > 5_000_000) {
    return false;
  }

  try {
    const sal = deBase64(partes[3]);
    const esperado = deBase64(partes[4]);
    const obtido = await derivar(senha, sal, iteracoes);
    return iguaisEmTempoConstante(obtido, esperado);
  } catch {
    // Base64 quebrado em `password_hash` é dado corrompido, não senha errada
    // — mas a resposta para quem está na porta é a mesma.
    return false;
  }
}
