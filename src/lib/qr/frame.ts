import { luminance } from "./readability";
import type { QrFrame } from "./types";

/**
 * Moldura com chamada ("ESCANEIE-ME").
 *
 * O `qr-code-styling` não faz molduras, então compomos por fora: o QR vira
 * uma imagem e nós desenhamos a faixa em volta. As medidas ficam todas aqui
 * para o PNG, o SVG e o PDF saírem idênticos.
 */

export interface FrameMetrics {
  width: number;
  height: number;
  /** Onde o QR entra dentro da composição. */
  qrX: number;
  qrY: number;
  bandX: number;
  bandY: number;
  bandWidth: number;
  bandHeight: number;
  fontSize: number;
  radius: number;
  textColor: string;
}

/** Texto branco ou preto, o que contrastar mais com a faixa. */
export function textoSobre(cor: string): string {
  const lum = luminance(cor);
  if (lum === null) return "#FFFFFF";
  return lum > 0.45 ? "#000000" : "#FFFFFF";
}

export function frameMetrics(size: number, frame: QrFrame): FrameMetrics {
  const bandHeight = Math.round(size * 0.18);
  const padding = Math.round(size * 0.04);
  const width = size + padding * 2;
  const height = size + padding * 2 + bandHeight;
  const emCima = frame.position === "top";

  return {
    width,
    height,
    qrX: padding,
    qrY: emCima ? bandHeight + padding : padding,
    bandX: 0,
    bandY: emCima ? 0 : height - bandHeight,
    bandWidth: width,
    bandHeight,
    fontSize: Math.round(bandHeight * 0.42),
    radius: Math.round(size * 0.03),
    textColor: textoSobre(frame.color),
  };
}

/** Desenha a faixa e o texto num canvas já dimensionado pelo `frameMetrics`. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: QrFrame,
  m: FrameMetrics,
  fundoDoQr: string,
) {
  // Fundo da composição: mesmo do QR, para a margem não virar um degrau.
  ctx.fillStyle = fundoDoQr;
  ctx.fillRect(0, 0, m.width, m.height);

  ctx.fillStyle = frame.color;
  ctx.fillRect(m.bandX, m.bandY, m.bandWidth, m.bandHeight);

  ctx.fillStyle = m.textColor;
  ctx.font = `600 ${m.fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    frame.text.toUpperCase(),
    m.width / 2,
    m.bandY + m.bandHeight / 2,
    m.bandWidth * 0.9,
  );
}

/** Escapa texto para interpolar dentro de um SVG sem quebrar a marcação. */
export function escapeXml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Envolve o SVG do QR numa composição com a faixa. */
export function wrapSvgWithFrame(
  svgDoQr: string,
  size: number,
  frame: QrFrame,
  fundoDoQr: string,
): string {
  const m = frameMetrics(size, frame);

  // O SVG da biblioteca vira um <svg> aninhado, posicionado pelo x/y.
  const interno = svgDoQr
    .replace(/^[\s\S]*?<svg/, "<svg")
    .replace(/<svg/, `<svg x="${m.qrX}" y="${m.qrY}"`);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}" viewBox="0 0 ${m.width} ${m.height}">`,
    `<rect width="${m.width}" height="${m.height}" fill="${fundoDoQr}"/>`,
    interno,
    `<rect x="${m.bandX}" y="${m.bandY}" width="${m.bandWidth}" height="${m.bandHeight}" fill="${frame.color}"/>`,
    `<text x="${m.width / 2}" y="${m.bandY + m.bandHeight / 2}" fill="${m.textColor}"`,
    ` font-family="Inter, system-ui, sans-serif" font-size="${m.fontSize}" font-weight="600"`,
    ` text-anchor="middle" dominant-baseline="central">${escapeXml(frame.text.toUpperCase())}</text>`,
    `</svg>`,
  ].join("");
}
