import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Cliente do middleware. Diferente do cliente de servidor, ele precisa
 * escrever os cookies renovados TANTO na requisição (para o resto do
 * pipeline enxergar a sessão nova) QUANTO na resposta (para o browser
 * guardar). Devolvemos a resposta junto para quem chamou reaproveitá-la.
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  return { supabase, getResponse: () => response };
}
