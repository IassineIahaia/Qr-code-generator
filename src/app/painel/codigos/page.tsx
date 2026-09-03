import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card, CardBody, buttonClasses } from "@/components/ui";
import { CopyButton } from "@/components/qr/copy-button";
import { ListFilters } from "@/components/qr/list-filters";
import { ListPagination } from "@/components/qr/list-pagination";
import { ListTable } from "@/components/qr/list-table";
import { env } from "@/lib/env";
import { PER_PAGE, estaFiltrando, parseListParams } from "@/lib/qr/list-params";
import { listQrCodes } from "@/lib/qr/queries";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Meus QR Codes" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CodigosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?redirectTo=/painel/codigos");

  const sp = await searchParams;
  const params = parseListParams(sp);
  const resultado = await listQrCodes(params);

  // Chegou aqui vindo da criação: o slug novo vira um aviso, não um filtro.
  const criado = typeof sp.criado === "string" ? sp.criado : null;

  const filtrando = estaFiltrando(params);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-headline-lg text-on-surface">
          Meus QR Codes
        </h1>
        <Link href="/painel/criar" className={buttonClasses("primary")}>
          Criar QR Code
        </Link>
      </header>

      {criado ? (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex flex-col gap-1">
              <span className="text-label text-tertiary">
                QR Code criado.
              </span>
              <span className="text-[13px] text-on-surface-variant">
                Endereço curto:{" "}
                <code className="font-mono text-data text-secondary">
                  {env.shortUrl()}/r/{criado}
                </code>
              </span>
            </span>
            <CopyButton
              value={`${env.shortUrl()}/r/${criado}`}
              label="Copiar o link do novo código"
            />
          </CardBody>
        </Card>
      ) : null}

      {/* `useSearchParams` obriga a fronteira de Suspense; sem ela a página
          inteira perderia a renderização estática do casco. */}
      <Suspense fallback={<div className="h-24" />}>
        <ListFilters total={resultado.total} />
      </Suspense>

      <ListTable
        {...resultado}
        baseUrl={env.shortUrl()}
        filtrando={filtrando}
      />

      <ListPagination
        page={resultado.page}
        totalPages={resultado.totalPages}
        total={resultado.total}
        perPage={PER_PAGE}
        params={sp}
      />
    </>
  );
}
