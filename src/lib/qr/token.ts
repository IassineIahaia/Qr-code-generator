import "server-only";

import { env } from "@/lib/env";

/**
 * Cookie assinado do "já provei que sei a senha deste QR".
 *
 * Um cookie sem assinatura seria só um bilhete que o próprio visitante
 * escreve: bastaria criar `qrp_meucodigo=1` no console para pular a senha.
 * Aqui o valor é um HMAC feito com um segredo que nunca sai do servidor.
 *
 * O slug entra na mensagem assinada de propósito — sem isso, o token de um
 * QR público serviria para abrir o QR protegido do vizinho.
 */

const codificador = new TextEncoder();

/** Validade do passe. Curta: é uma sessão de leitura, não um login. */
export const VALIDADE_SENHA_S = 60 * 60 * 12;

let chaveCache: Promise<CryptoKey> | null = null;

function chave(): Promise<CryptoKey> {
  chaveCache ??= crypto.subtle.importKey(
    "raw",
    codificador.encode(env.appSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return chaveCache;
}

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function assinar(mensagem: string): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await chave(), codificador.encode(mensagem));
  return base64url(new Uint8Array(mac));
}

/** Nome do cookie. Um por QR: abrir um não abre os outros. */
export function nomeCookieSenha(slug: string): string {
  return `qrp_${slug}`;
}

/** Cria o passe: `<expiraEm>.<assinatura>`. */
export async function criarPasse(slug: string): Promise<string> {
  const expira = Math.floor(Date.now() / 1000) + VALIDADE_SENHA_S;
  return `${expira}.${await assinar(`${slug}.${expira}`)}`;
}

/** O passe é nosso e ainda vale? */
export async function passeValido(
  slug: string,
  valor: string | undefined,
): Promise<boolean> {
  if (!valor) return false;

  const corte = valor.indexOf(".");
  if (corte < 1) return false;

  const expira = Number(valor.slice(0, corte));
  if (!Number.isInteger(expira) || expira <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  // Recalcula e compara com o que veio. Como as duas strings têm o mesmo
  // tamanho e são base64, o `===` aqui não abre nada que o próprio tempo de
  // rede não esconda — mas mantemos a comparação byte a byte por hábito.
  const esperado = await assinar(`${slug}.${expira}`);
  const recebido = valor.slice(corte + 1);
  if (esperado.length !== recebido.length) return false;

  let diff = 0;
  for (let i = 0; i < esperado.length; i++) {
    diff |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  }
  return diff === 0;
}
