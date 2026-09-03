"use client";

import { Download, FileCode, FileImage, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { baixarBlob, exportQr, nomeArquivo } from "@/lib/qr/render";
import type { ExportFormat, QrDesign } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

const FORMATOS: {
  formato: ExportFormat;
  rotulo: string;
  icone: typeof Download;
  dica: string;
}[] = [
  {
    formato: "png",
    rotulo: "PNG",
    icone: FileImage,
    dica: "Para telas e redes sociais",
  },
  {
    formato: "svg",
    rotulo: "SVG",
    icone: FileCode,
    dica: "Vetor: amplia sem perder nitidez",
  },
  {
    formato: "pdf",
    rotulo: "PDF",
    icone: FileText,
    dica: "Para gráfica, 300 DPI",
  },
];

export interface ExportButtonsProps {
  data: string;
  design: QrDesign;
  /** Vira o nome do arquivo baixado. */
  nome: string;
  /** Multiplicador do tamanho no PNG e no PDF. */
  escala?: number;
  className?: string;
}

export function ExportButtons({
  data,
  design,
  nome,
  escala = 2,
  className,
}: ExportButtonsProps) {
  const [gerando, setGerando] = useState<ExportFormat | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function baixar(formato: ExportFormat) {
    setGerando(formato);
    setErro(null);
    try {
      const blob = await exportQr(data, design, formato, { escala });
      baixarBlob(blob, nomeArquivo(nome, formato));
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível gerar o arquivo.",
      );
    } finally {
      setGerando(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2">
        {FORMATOS.map(({ formato, rotulo, icone: Icone, dica }) => (
          <Button
            key={formato}
            variant={formato === "png" ? "primary" : "secondary"}
            icon={<Icone size={16} />}
            loading={gerando === formato}
            disabled={gerando !== null && gerando !== formato}
            onClick={() => baixar(formato)}
            title={dica}
          >
            {rotulo}
          </Button>
        ))}
      </div>
      {erro ? (
        <p role="alert" className="text-[12px] text-error">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
