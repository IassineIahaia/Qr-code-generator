"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Copia um texto e confirma por 2 segundos. Existe porque o link curto é a
 * coisa que mais se faz com um QR na listagem — colar num post, num e-mail,
 * num pedido de arte para o gráfico.
 */
export function CopyButton({
  value,
  label = "Copiar link",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timer = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(timer);
  }, [copiado]);

  return (
    <button
      type="button"
      title={label}
      aria-label={copiado ? "Copiado" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopiado(true);
        } catch {
          // Sem permissão de área de transferência (http, iframe restrito):
          // deixa o texto selecionado para a pessoa copiar à mão.
          setCopiado(false);
        }
      }}
      className={cn(
        "rounded p-1 transition-colors",
        copiado
          ? "text-tertiary"
          : "text-on-surface-variant hover:text-on-surface",
        className,
      )}
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
