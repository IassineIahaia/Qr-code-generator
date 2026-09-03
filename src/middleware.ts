import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Rotas abertas a quem não está logado. Tudo que não casar com esta lista
 * exige sessão — lista de permissão, não de bloqueio: se amanhã alguém criar
 * `/faturas`, ela nasce protegida em vez de nascer exposta por esquecimento.
 */
const ROTAS_PUBLICAS = [
  "/", // landing
  "/entrar",
  "/cadastrar",
  "/recuperar-senha",
  "/nova-senha", // chega-se por link do e-mail, com sessão de recuperação
  "/ui", // vitrine dos componentes
];

/**
 * Prefixos abertos: redirect público do QR, trocas de token do Supabase e as
 * páginas internas da vitrine. A barra final é proposital — sem ela, `/ui`
 * abriria também um eventual `/uifaturas`.
 */
const PREFIXOS_PUBLICOS = ["/r/", "/auth/", "/ui/"];

function ehPublica(pathname: string) {
  if (ROTAS_PUBLICAS.includes(pathname)) return true;
  return PREFIXOS_PUBLICOS.some((prefixo) => pathname.startsWith(prefixo));
}

/** Cookie que identifica o visitante para separar leitura total de única. */
const COOKIE_VISITANTE = "qrv";
const UM_ANO_S = 60 * 60 * 24 * 365;

/**
 * O redirect público sai antes de qualquer coisa — item 6.7.
 *
 * Duas razões. A primeira é custo: `/r/[slug]` é a rota mais quente do
 * produto e quem a acessa nunca está logado, então validar o JWT ali seria
 * uma ida ao Supabase por leitura, no caminho crítico, para não descobrir
 * nada. A segunda é que o cookie do visitante **só pode nascer aqui**: um
 * Server Component não tem permissão para escrever cookies, e é o middleware
 * quem consegue plantá-lo antes de a página contar a leitura.
 */
function tratarRedirectPublico(request: NextRequest) {
  if (request.cookies.get(COOKIE_VISITANTE)) return NextResponse.next();

  const id = crypto.randomUUID();

  // Os dois lados: `request.cookies.set` faz o valor existir já para a página
  // desta mesma requisição — sem isso, a primeira leitura de cada visitante
  // cairia no plano B (IP + user-agent) mesmo com o cookie a caminho.
  // `NextResponse.next({ request })` é o que repassa essa alteração adiante.
  request.cookies.set(COOKIE_VISITANTE, id);
  const resposta = NextResponse.next({ request });

  resposta.cookies.set(COOKIE_VISITANTE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UM_ANO_S,
  });

  return resposta;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/r/")) {
    return tratarRedirectPublico(request);
  }

  const { supabase, getResponse } = createMiddlewareClient(request);

  // Precisa ser getUser (não getSession): só ele valida o JWT no servidor.
  // getSession lê o cookie sem conferir a assinatura.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !ehPublica(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    // Guarda onde a pessoa queria chegar para devolvê-la ali após o login.
    url.searchParams.set("redirectTo", pathname + search);
    return NextResponse.redirect(url);
  }

  // Quem já está logado não tem o que fazer nas telas de entrada.
  if (user && (pathname === "/entrar" || pathname === "/cadastrar")) {
    const url = request.nextUrl.clone();
    url.pathname = "/painel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Devolve a resposta que o cliente do Supabase montou: ela carrega os
  // cookies de sessão renovados.
  return getResponse();
}

export const config = {
  matcher: [
    /*
     * Tudo, menos os estáticos do Next, o favicon e arquivos de imagem —
     * rodar o middleware neles só gastaria uma ida ao Supabase por asset.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
