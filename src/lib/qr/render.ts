import type QRCodeStyling from "qr-code-styling";
import { drawFrame, frameMetrics, wrapSvgWithFrame } from "./frame";
import { toQrOptions } from "./options";
import { canvasToPdf } from "./pdf";
import type { ExportFormat, QrDesign } from "./types";

/**
 * Camada de renderização. Só roda no browser: o `qr-code-styling` depende de
 * canvas e DOM, então a importação é dinâmica e sempre dentro de um efeito
 * ou de um handler — nunca no topo de um módulo que o servidor possa avaliar.
 */

/** Importa a biblioteca sob demanda e devolve o construtor. */
export async function loadQrLib(): Promise<typeof QRCodeStyling> {
  const mod = await import("qr-code-styling");
  return mod.default;
}

export async function createQrCode(data: string, design: QrDesign) {
  const Lib = await loadQrLib();
  return new Lib(toQrOptions(data, design));
}

/** O QR sozinho, sem moldura, como PNG. */
async function rawPng(qr: QRCodeStyling): Promise<Blob> {
  const blob = await qr.getRawData("png");
  if (!blob) throw new Error("Não foi possível gerar o PNG.");
  // No browser vem Blob; a assinatura inclui Buffer por causa do Node.
  return blob as Blob;
}

/** O QR sozinho, sem moldura, como texto SVG. */
async function rawSvg(data: string, design: QrDesign): Promise<string> {
  const Lib = await loadQrLib();
  const qr = new Lib(toQrOptions(data, design, { type: "svg" }));
  const blob = await qr.getRawData("svg");
  if (!blob) throw new Error("Não foi possível gerar o SVG.");
  return await (blob as Blob).text();
}

function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar a imagem do QR."));
    img.src = url;
  });
}

/**
 * Compõe o QR (mais a moldura, se houver) num canvas.
 * É o passo comum do PNG e do PDF.
 */
export async function renderToCanvas(
  data: string,
  design: QrDesign,
  escala = 1,
): Promise<HTMLCanvasElement> {
  const qr = await createQrCode(data, {
    ...design,
    size: Math.round(design.size * escala),
  });
  const png = await rawPng(qr);
  const url = URL.createObjectURL(png);

  try {
    const img = await carregarImagem(url);
    const size = Math.round(design.size * escala);
    const canvas = document.createElement("canvas");

    if (!design.frame || !design.frame.text.trim()) {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas sem contexto 2D.");
      ctx.drawImage(img, 0, 0, size, size);
      return canvas;
    }

    const m = frameMetrics(size, design.frame);
    canvas.width = m.width;
    canvas.height = m.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas sem contexto 2D.");

    drawFrame(ctx, design.frame, m, design.background);
    ctx.drawImage(img, m.qrX, m.qrY, size, size);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasParaBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Falha ao gerar o PNG.")),
      "image/png",
    );
  });
}

export interface ExportOptions {
  /** Multiplica o tamanho do design. Use 2 ou 4 para impressão. */
  escala?: number;
  /** Resolução do PDF, em DPI. */
  dpi?: number;
}

/** Gera o arquivo final no formato pedido. */
export async function exportQr(
  data: string,
  design: QrDesign,
  formato: ExportFormat,
  { escala = 1, dpi = 300 }: ExportOptions = {},
): Promise<Blob> {
  if (formato === "svg") {
    // SVG é vetor: escala não faz diferença, e a moldura entra na marcação.
    const svg = await rawSvg(data, design);
    const final =
      design.frame && design.frame.text.trim()
        ? wrapSvgWithFrame(svg, design.size, design.frame, design.background)
        : svg;
    return new Blob([final], { type: "image/svg+xml" });
  }

  const canvas = await renderToCanvas(data, design, escala);

  if (formato === "png") return canvasParaBlob(canvas);
  return canvasToPdf(canvas, { dpi });
}

/** Dispara o download no browser. */
export function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoga no próximo tick: revogar antes do clique processar cancela o download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nome de arquivo seguro a partir do nome dado pela pessoa. */
export function nomeArquivo(nome: string, formato: ExportFormat) {
  const base =
    nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // tira os acentos separados pelo NFD
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "qrcode";
  return `${base}.${formato}`;
}
