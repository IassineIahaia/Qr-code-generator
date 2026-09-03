"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "./types";

/** Cliente para componentes do browser. Usa a chave pública (anon) + RLS. */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl(), env.supabaseAnonKey());
}
