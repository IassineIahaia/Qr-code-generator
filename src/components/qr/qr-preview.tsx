"use client";

import type QRCodeStyling from "qr-code-styling";
import { useEffect, useRef, useState } from "react";
import { frameMetrics, textoSobre } from "@/lib/qr/frame";
import { toQrOptions } from "@/lib/qr/options";
import { loadQrLib } from "@/lib/qr/render";
import type { QrDesign } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

/** Segura um valor até ele parar de mudar por `delay` ms. */
export function useDebounced<T>(valor: T, delay = 250): T {
  const [atrasado, setAtrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), delay);
    return () => clearTimeout(id);
  }, [valor, delay]);

  return atrasado;
}

export interface QrPreviewProps {
  data: string;
  design: QrDesign;
  /** Lado do QR na tela, em px. Independe do `design.size` da exportação. */
  displaySize?: number;
  /** Atraso do debounce. */
  delay?: number;
  className?: string;
}

/**
 * Preview ao vivo.
 *
 * A instância do `qr-code-styling` é criada uma vez e depois só recebe
 * `update()`: recriar a cada tecla pisca a tela e é caro. O debounce evita
 * redesenhar a cada caractere digitado.
 *
 * A moldura aqui é feita com DOM, não com canvas — as proporções vêm do
 * mesmo `frameMetrics` que a exportação usa, então o que se vê é o que sai.
 */
export function QrPreview({
  data,
  design,
  displaySize = 280,
  delay = 250,
  className,
}: QrPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanciaRef = useRef<QRCodeStyling | null>(null);
  const [pronto, setPronto] = useState(false);

  const dataDebounced = useDebounced(data, delay);
  const designDebounced = useDebounced(design, delay);

  const temMoldura = Boolean(designDebounced.frame?.text.trim());
  const m = designDebounced.frame
    ? frameMetrics(displaySize, designDebounced.frame)
    : null;

  useEffect(() => {
    let cancelado = false;

    async function desenhar() {
      const container = containerRef.current;
      if (!container) return;

      const options = toQrOptions(dataDebounced || " ", {
        ...designDebounced,
        size: displaySize,
        // A moldura é desenhada em volta pelo DOM, não pela biblioteca.
        frame: null,
      });

      if (!instanciaRef.current) {
        const Lib = await loadQrLib();
        if (cancelado) return;
        instanciaRef.current = new Lib(options);
        // Em modo estrito o efeito roda duas vezes: limpa antes de anexar
        // para não empilhar dois canvas.
        container.replaceChildren();
        instanciaRef.current.append(container);
      } else {
        instanciaRef.current.update(options);
      }

      if (!cancelado) setPronto(true);
    }

    desenhar();
    return () => {
      cancelado = true;
    };
  }, [dataDebounced, designDebounced, displaySize]);

  const qrBox = (
    <div
      ref={containerRef}
      aria-hidden
      className={cn(
        "[&>canvas]:block [&>canvas]:h-auto [&>canvas]:w-full",
        "[&>svg]:block [&>svg]:h-auto [&>svg]:w-full",
        !pronto && "animate-pulse bg-surface-high",
      )}
      style={{ width: displaySize, height: displaySize }}
    />
  );

  if (!temMoldura || !m || !designDebounced.frame) {
    return (
      <div
        className={cn("overflow-hidden rounded-card", className)}
        style={{ background: designDebounced.background }}
        role="img"
        aria-label={`Pré-visualização do QR Code para ${data || "conteúdo vazio"}`}
      >
        {qrBox}
      </div>
    );
  }

  const frame = designDebounced.frame;

  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-card", className)}
      style={{
        background: designDebounced.background,
        width: m.width,
        paddingLeft: m.qrX,
        paddingRight: m.qrX,
      }}
      role="img"
      aria-label={`Pré-visualização do QR Code para ${data || "conteúdo vazio"}, com a chamada ${frame.text}`}
    >
      <div
        className={cn(
          "-mx-[var(--pad)] flex items-center justify-center",
          frame.position === "top" ? "order-first" : "order-last",
        )}
        style={
          {
            "--pad": `${m.qrX}px`,
            background: frame.color,
            color: textoSobre(frame.color),
            height: m.bandHeight,
            fontSize: m.fontSize,
            fontWeight: 600,
            letterSpacing: "0.04em",
          } as React.CSSProperties
        }
      >
        {frame.text.toUpperCase()}
      </div>
      <div style={{ paddingTop: m.qrX, paddingBottom: m.qrX }}>{qrBox}</div>
    </div>
  );
}
