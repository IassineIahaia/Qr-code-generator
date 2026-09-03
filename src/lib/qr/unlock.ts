"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { conferirSenha } from "./password";
import { freioDeSenha } from "./rate-limit";
import { buscarPorSlug } from "./redirect";
import { hashComSal, ipDaRequisicao } from "./scan";
import { criarPasse, nomeCookieSenha, VALIDADE_SENHA_S } from "./token";
import { effectiveStatus } from "./status";

/**
 * Conferência da senha do QR — item 5.5, lado de quem escaneia.
 *
 * Precisa ser Server Action, e não parte da página: escrever cookie é
 * privilégio de action, route handler e middleware. É aqui que o passe
 * assinado nasce.
 */

export interface EstadoDestrave {
  erro?: string;
}

export async function destravarQr(
  _anterior: EstadoDestrave,
  formData: FormData,
): Promise<EstadoDestrave> {
  const slug = String(formData.get("slug") ?? "");
  const senha = String(formData.get("senha") ?? "");

  const cabecalhos = await headers();
  const ip = ipDaRequisicao(cabecalhos);
  const ipHash = ip ? await hashComSal(ip) : "sem-ip";

  // Item 6.8: sem freio, uma senha de quatro dígitos cai em segundos.
  const freio = freioDeSenha(ipHash, slug);
  if (!freio.permitido) {
    return {
      erro: `Muitas tentativas. Espere ${Math.ceil(freio.esperarS / 60)} minuto(s) e tente de novo.`,
    };
  }

  const qr = await buscarPorSlug(slug);

  // "Não existe", "não tem senha" e "senha errada" respondem igual. Um erro
  // diferente para cada caso transformaria esta tela num oráculo: dá para
  // varrer slugs e descobrir quais existem sem nunca acertar uma senha.
  if (!qr || !qr.password_hash || !(await conferirSenha(senha, qr.password_hash))) {
    return { erro: "Senha incorreta." };
  }

  // A senha certa não vale nada num código pausado ou expirado. Conferir
  // aqui evita gravar um passe para algo que a página vai barrar de novo.
  if (effectiveStatus(qr) !== "active") redirect(`/r/${slug}`);

  const bolachas = await cookies();
  bolachas.set(nomeCookieSenha(slug), await criarPasse(slug), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/r/${slug}`,
    maxAge: VALIDADE_SENHA_S,
  });

  // Volta para a própria página: agora ela vê o passe e segue o redirect.
  // Mandar direto para o destino daqui pularia o registro da leitura e as
  // regras de dispositivo e país.
  redirect(`/r/${slug}`);
}
