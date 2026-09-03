import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Cliente com a chave service_role: ignora o RLS.
 *
 * Use apenas onde não existe usuário logado e o acesso é inevitável —
 * na prática, só no redirect público `/r/[slug]`, que precisa ler o QR de
 * qualquer dono e gravar a leitura. Nunca importe isto de código do browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl(),
    env.supabaseServiceRoleKey(),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
