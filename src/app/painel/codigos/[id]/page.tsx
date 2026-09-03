import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QrAnalyticsSection } from "@/components/qr/qr-analytics";
import { QrDetail } from "@/components/qr/qr-detail";
import { QrHistory } from "@/components/qr/qr-history";
import { getQrAnalytics, listRecentScans } from "@/lib/qr/analytics";
import { env } from "@/lib/env";
import type { QrContent } from "@/lib/qr/content";
import { lerDesign } from "@/lib/qr/defaults";
import { janelaDe, parsePeriodo } from "@/lib/qr/period";
import { getQrCode, listQrEvents } from "@/lib/qr/queries";
import { lerDeviceRules, lerGeoRules } from "@/lib/qr/rules";
import { explicarParaDono } from "@/lib/qr/status";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "QR Code" };

export default async function QrDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?redirectTo=/painel/codigos/${id}`);

  // O RLS devolve `null` tanto para "não existe" quanto para "não é seu", e é
  // exatamente o que queremos: um 404 não revela que o código existe.
  const qr = await getQrCode(id);
  if (!qr) notFound();

  const periodo = parsePeriodo((await searchParams).periodo);
  const { de, ate } = janelaDe(periodo, qr.created_at);

  // Três leituras independentes: em paralelo, não em fila. São ~3 idas ao
  // Supabase, e enfileirá-las triplicaria o tempo até a tela aparecer.
  const [eventos, analytics, leituras] = await Promise.all([
    listQrEvents(qr.id),
    getQrAnalytics(qr.id, de, ate),
    listRecentScans(qr.id),
  ]);

  return (
    <>
      <header className="flex flex-col gap-2">
        <Link
          href="/painel/codigos"
          className="w-fit font-mono text-caption tracking-[0.14em] text-primary uppercase transition-opacity hover:opacity-70"
        >
          ← Meus QR Codes
        </Link>
        <h1 className="font-display text-headline-lg text-on-surface">
          {qr.name}
        </h1>
      </header>

      <QrDetail
        id={qr.id}
        slug={qr.slug}
        nome={qr.name}
        isDynamic={qr.is_dynamic}
        intencao={qr.status}
        status={qr.qr_effective_status}
        explicacao={explicarParaDono(qr, qr.qr_effective_status)}
        content={qr.content as unknown as QrContent}
        design={lerDesign(qr.design)}
        tags={qr.tags}
        scanCount={qr.scan_count}
        uniqueScanCount={qr.unique_scan_count}
        lastScanAt={qr.last_scan_at}
        createdAt={qr.created_at}
        baseUrl={env.shortUrl()}
        regras={{
          activeFrom: qr.active_from,
          expiresAt: qr.expires_at,
          scanLimit: qr.scan_limit,
          // Só o fato, nunca o derivado: `password_hash` não sai do
          // servidor. O formulário precisa saber que existe senha, não
          // qual é — e ele também não teria como saber, porque nem nós
          // temos.
          temSenha: !!qr.password_hash,
          disabledBehavior: qr.disabled_behavior,
          disabledMessage: qr.disabled_message,
          disabledRedirectUrl: qr.disabled_redirect_url,
          deviceRules: lerDeviceRules(qr.device_rules),
          geoRules: lerGeoRules(qr.geo_rules),
        }}
        historico={<QrHistory eventos={eventos} />}
      />

      {/* Fica fora do `QrDetail` de propósito: aquele é client component
          (cada bloco editável tem estado), e a analytics é leitura pura.
          Mantê-la como Server Component irmão evita mandar as agregações
          para o browser como props de um componente que já é grande. */}
      <QrAnalyticsSection
        qrId={qr.id}
        dados={analytics}
        leituras={leituras}
        periodo={periodo}
      />
    </>
  );
}
