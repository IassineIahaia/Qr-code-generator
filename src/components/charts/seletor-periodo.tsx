"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui";
import { PERIODOS, PERIODO_PADRAO, type PeriodoId } from "@/lib/qr/period";

/**
 * O seletor de período — item 7.5.
 *
 * Como os filtros da listagem, o estado mora na URL: um link para "os
 * últimos 90 dias deste QR" é compartilhável, sobrevive ao F5 e o botão
 * Voltar volta para a janela anterior em vez de sair da página.
 */
export function SeletorPeriodo({ atual }: { atual: PeriodoId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendente, iniciar] = useTransition();

  function trocar(valor: string) {
    const params = new URLSearchParams(searchParams);
    // O padrão não vai para a URL: `?periodo=30d` num link que já mostraria
    // 30 dias é ruído que a pessoa acaba copiando adiante.
    if (valor === PERIODO_PADRAO) params.delete("periodo");
    else params.set("periodo", valor);

    const qs = params.toString();
    iniciar(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  return (
    <Select
      aria-label="Período dos dados"
      value={atual}
      disabled={pendente}
      onChange={(e) => trocar(e.target.value)}
      className="h-8 w-auto py-0 text-[12px]"
    >
      {Object.entries(PERIODOS).map(([id, { label }]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </Select>
  );
}
