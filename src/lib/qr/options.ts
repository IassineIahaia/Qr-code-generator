import type { Gradient, Options } from "qr-code-styling";
import type { EyeBallStyle, QrDesign, QrFill } from "./types";

/**
 * Traduz o nosso `QrDesign` para as opções do `qr-code-styling`.
 * Fica isolado de propósito: é a única função que conhece o formato da
 * biblioteca, então trocá-la um dia mexe só aqui.
 */

function toGradient(fill: QrFill): Gradient | undefined {
  if (fill.kind !== "gradient") return undefined;
  const { type, rotation, from, to } = fill.gradient;
  return {
    type,
    // A biblioteca espera radianos; a interface trabalha em graus.
    rotation: (rotation * Math.PI) / 180,
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  };
}

function toColor(fill: QrFill): string | undefined {
  return fill.kind === "solid" ? fill.color : undefined;
}

/**
 * O miolo do olho aceita menos formatos que os módulos. "rounded" não existe
 * lá, e o vizinho visual mais próximo é "dot".
 */
function toCornerDotType(style: EyeBallStyle) {
  return style === "rounded" ? "dot" : style;
}

export function toQrOptions(
  data: string,
  design: QrDesign,
  overrides?: Partial<Options>,
): Options {
  const gradiente = toGradient(design.foreground);
  const cor = toColor(design.foreground);

  return {
    type: "canvas",
    width: design.size,
    height: design.size,
    margin: design.margin * (design.size / 33), // margem em módulos → px
    data,
    qrOptions: {
      errorCorrectionLevel: design.errorCorrection,
    },
    // Sem logo, as chaves são OMITIDAS em vez de virarem `undefined`: a
    // biblioteca faz `{...padrao, ...opcoes}` e lê `imageOptions.hideBackgroundDots`
    // sem checar, então um `undefined` explícito apaga o padrão e quebra.
    ...(design.logo
      ? {
          image: design.logo.src,
          imageOptions: {
            imageSize: design.logo.size,
            margin: design.logo.margin,
            hideBackgroundDots: design.logo.hideBackgroundDots,
            crossOrigin: "anonymous",
          },
        }
      : {}),
    dotsOptions: {
      type: design.dotStyle,
      color: cor,
      gradient: gradiente,
    },
    cornersSquareOptions: {
      type: design.eyeFrameStyle,
      // Cor própria do olho tem prioridade; sem ela, herda o gradiente.
      color: design.eyeFrameColor ?? cor,
      gradient: design.eyeFrameColor ? undefined : gradiente,
    },
    cornersDotOptions: {
      type: toCornerDotType(design.eyeBallStyle),
      color: design.eyeBallColor ?? cor,
      gradient: design.eyeBallColor ? undefined : gradiente,
    },
    backgroundOptions: {
      color: design.background,
    },
    ...overrides,
  };
}
