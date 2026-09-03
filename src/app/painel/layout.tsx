import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * O layout do painel — item 8.3.
 *
 * A sessão é conferida **aqui**, uma vez, em vez de no topo de cada página.
 * As páginas mantêm o `redirect` delas mesmo assim: são duas checagens
 * baratas e independentes, e a que sobra é a que salva o dia em que alguém
 * mover um arquivo para fora deste layout.
 *
 * O perfil também é lido uma vez só. Antes cada tela buscava o seu para
 * desenhar o mesmo avatar no canto — três telas, três idas ao banco pela
 * mesma linha.
 */
export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?redirectTo=/painel");

  const supabase = await createClient();
  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell
      usuario={{
        nome: perfil?.full_name ?? user.user_metadata?.full_name ?? null,
        email: perfil?.email ?? user.email ?? null,
        avatarUrl: perfil?.avatar_url,
      }}
    >
      {children}
    </AppShell>
  );
}
