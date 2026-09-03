import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { destinoSeguro } from "@/lib/auth/redirect";

/**
 * Ponto de chegada de todo link enviado por e-mail (confirmação de cadastro,
 * redefinição de senha) e do retorno do OAuth.
 *
 * O Supabase manda um de dois formatos, dependendo do fluxo:
 *  - `token_hash` + `type` → verifyOtp
 *  - `code` (PKCE) → exchangeCodeForSession
 * Tratamos os dois para não depender da configuração do projeto.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = destinoSeguro(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Link expirado, já usado ou adulterado: a tela de login explica o caso.
  return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
}
