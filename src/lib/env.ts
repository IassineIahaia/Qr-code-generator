/**
 * Leitura das variáveis de ambiente com erro legível quando falta alguma.
 * As `NEXT_PUBLIC_*` são embutidas no bundle, então precisam ser lidas
 * literalmente — nada de `process.env[nome]` dinâmico.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Copie .env.example para .env.local e preencha.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: () =>
    required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () =>
    required(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  supabaseServiceRoleKey: () =>
    required(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
  /** Base dos links curtos, sem barra no final. */
  shortUrl: () =>
    (process.env.NEXT_PUBLIC_SHORT_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    ),
  scanIpSalt: () => process.env.SCAN_IP_SALT ?? "sal-de-desenvolvimento",
  /**
   * Chave dos cookies assinados — o "já digitei a senha deste QR".
   * Sem `APP_SECRET` definido, cai na chave service_role, que já é um segredo
   * de servidor e nunca chega ao browser. O fallback existe para o ambiente
   * local não exigir mais uma variável; em produção, defina a sua.
   */
  appSecret: () =>
    process.env.APP_SECRET ??
    required(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "APP_SECRET (ou SUPABASE_SERVICE_ROLE_KEY)",
    ),
};
