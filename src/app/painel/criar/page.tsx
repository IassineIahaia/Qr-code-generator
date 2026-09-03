import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateWizard } from "@/components/qr/create-wizard";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Criar QR Code" };

export default async function CriarQrPage() {
  // O middleware já barraria, mas a página não pode depender disso: um dia
  // o matcher muda e esta rota não pode virar pública por acidente.
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?redirectTo=/painel/criar");

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-headline-lg text-on-surface">
          Criar QR Code
        </h1>
        <p className="max-w-prose text-on-surface-variant">
          Três passos: o que ele carrega, como ele aparece e onde ele vive.
        </p>
      </header>

      {/* A base do link curto vem do servidor: `NEXT_PUBLIC_SHORT_URL` pode
          apontar para um domínio próprio, diferente do domínio do app. */}
      <CreateWizard baseUrl={env.shortUrl()} />
    </>
  );
}
