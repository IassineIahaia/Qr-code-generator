"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Chip, Input, Select } from "@/components/ui";
import { QR_TYPES } from "@/lib/qr/content";
import { ESTADOS, LIST_SORTS } from "@/lib/qr/list-params";
import { QR_STATUS_STYLES } from "@/components/ui/status-pill";
import type { QrEffectiveStatus } from "@/lib/supabase/types";

/**
 * Busca, filtros e ordenação da listagem.
 *
 * O estado mora na URL, não no componente: assim a lista filtrada é
 * compartilhável, sobrevive ao F5 e o botão Voltar do navegador funciona
 * como a pessoa espera. A página é um Server Component e relê tudo a cada
 * mudança de `searchParams`.
 */

export function ListFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendente, iniciar] = useTransition();

  const q = searchParams.get("q") ?? "";
  const tipo = searchParams.get("tipo") ?? "todos";
  const estado = searchParams.get("estado") ?? "todos";
  const ordem = searchParams.get("ordem") ?? "recentes";

  // A caixa de busca precisa responder a cada tecla, mas a URL só muda
  // depois que a pessoa para de digitar.
  const [rascunho, setRascunho] = useState(q);

  // Quando a URL muda por fora — botão Voltar, "×" num chip, "Limpar tudo" —
  // o rascunho tem que acompanhar. Ajuste durante a renderização, que é o
  // padrão do React para isto: um efeito aqui renderizaria duas vezes.
  const [qAnterior, setQAnterior] = useState(q);
  if (q !== qAnterior) {
    setQAnterior(q);
    setRascunho(q);
  }

  function aplicar(mudancas: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (!valor || valor === "todos") params.delete(chave);
      else params.set(chave, valor);
    }
    // Qualquer filtro novo volta para a primeira página: manter `pagina=4`
    // depois de buscar costuma cair numa lista vazia.
    params.delete("pagina");
    const qs = params.toString();
    iniciar(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  useEffect(() => {
    if (rascunho === q) return;
    const timer = setTimeout(() => aplicar({ q: rascunho }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rascunho]);

  const filtros = [
    tipo !== "todos"
      ? {
          chave: "tipo",
          rotulo: QR_TYPES.find((t) => t.type === tipo)?.label ?? tipo,
        }
      : null,
    estado !== "todos"
      ? {
          chave: "estado",
          rotulo:
            QR_STATUS_STYLES[estado as QrEffectiveStatus]?.label ?? estado,
        }
      : null,
    q ? { chave: "q", rotulo: `"${q}"` } : null,
  ].filter((f): f is { chave: string; rotulo: string } => f !== null);

  return (
    <div className="flex flex-col gap-3" data-pendente={pendente || undefined}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            placeholder="Buscar por nome, destino ou link curto"
            aria-label="Buscar QR Codes"
            icon={<Search size={16} />}
            trailing={
              rascunho ? (
                <button
                  type="button"
                  onClick={() => setRascunho("")}
                  aria-label="Limpar busca"
                  className="rounded-full p-0.5 text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  <X size={14} />
                </button>
              ) : null
            }
          />
        </div>

        <Select
          value={tipo}
          onChange={(e) => aplicar({ tipo: e.target.value })}
          aria-label="Filtrar por tipo"
          className="sm:w-44"
        >
          <option value="todos">Todos os tipos</option>
          {QR_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </Select>

        <Select
          value={estado}
          onChange={(e) => aplicar({ estado: e.target.value })}
          aria-label="Filtrar por estado"
          className="sm:w-44"
        >
          <option value="todos">Todos os estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {QR_STATUS_STYLES[s].label}
            </option>
          ))}
        </Select>

        <Select
          value={ordem}
          onChange={(e) => aplicar({ ordem: e.target.value })}
          aria-label="Ordenar"
          className="sm:w-48"
        >
          {Object.entries(LIST_SORTS).map(([chave, s]) => (
            <option key={chave} value={chave}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[12px] text-on-surface-variant"
          aria-live="polite"
        >
          {total} {total === 1 ? "código" : "códigos"}
          {filtros.length ? " nesse filtro" : ""}
        </span>
        {filtros.map((f) => (
          <Chip
            key={f.chave}
            tone="brand"
            onRemove={() => aplicar({ [f.chave]: "" })}
            removeLabel={`Remover filtro ${f.rotulo}`}
          >
            {f.rotulo}
          </Chip>
        ))}
        {filtros.length > 1 ? (
          <button
            type="button"
            onClick={() => aplicar({ q: "", tipo: "", estado: "" })}
            className="text-[12px] text-primary underline-offset-4 hover:underline"
          >
            Limpar tudo
          </button>
        ) : null}
      </div>
    </div>
  );
}
