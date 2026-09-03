"use client";

import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import type {
  ReadabilityLevel,
  ReadabilityReport,
} from "@/lib/qr/readability";
import { cn } from "@/lib/utils";

const CORES: Record<ReadabilityLevel, { barra: string; texto: string }> = {
  excelente: { barra: "bg-tertiary", texto: "text-tertiary" },
  boa: { barra: "bg-secondary", texto: "text-secondary" },
  arriscada: { barra: "bg-warning", texto: "text-warning" },
  ruim: { barra: "bg-error", texto: "text-error" },
};

export interface ReadabilityMeterProps {
  report: ReadabilityReport;
  className?: string;
}

/**
 * Medidor de escaneabilidade. Mostra a nota, mas o que importa é a lista de
 * problemas: número sozinho não diz a ninguém o que corrigir.
 */
export function ReadabilityMeter({ report, className }: ReadabilityMeterProps) {
  const cor = CORES[report.level];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-caption uppercase tracking-wider text-on-surface-variant">
          Escaneabilidade
        </span>
        <span className={cn("text-label font-medium", cor.texto)}>
          {report.label}
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high"
        role="meter"
        aria-valuenow={report.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Escaneabilidade: ${report.label}, ${report.score} de 100`}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", cor.barra)}
          style={{ width: `${report.score}%` }}
        />
      </div>

      <p className="text-[12px] text-on-surface-variant">
        Contraste do símbolo:{" "}
        <span className="font-mono">
          {Math.round(report.symbolContrast * 100)}%
        </span>{" "}
        — grau <span className="font-mono">{report.contrastGrade}</span> pela
        ISO/IEC 15415.
      </p>

      {report.issues.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {report.issues.map((issue, i) => {
            const Icon = issue.severity === "erro" ? CircleAlert : AlertTriangle;
            return (
              <li
                key={i}
                className={cn(
                  "flex gap-2 rounded-control border px-3 py-2 text-[12px]",
                  issue.severity === "erro"
                    ? "border-error/30 bg-error-container/15 text-error"
                    : "border-warning/25 bg-warning/10 text-warning",
                )}
              >
                <Icon size={14} className="mt-0.5 shrink-0" aria-hidden />
                <span className="flex flex-col gap-0.5">
                  <span>{issue.message}</span>
                  <span className="text-on-surface-variant">{issue.fix}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-[12px] text-tertiary">
          <Info size={14} aria-hidden />
          Nenhum problema detectado. Pode imprimir.
        </p>
      )}
    </div>
  );
}
