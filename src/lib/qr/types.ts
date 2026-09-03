/**
 * Modelo de design do QR Code.
 *
 * É este objeto que vai serializado na coluna `design` de `qr_codes`, então
 * ele é deliberadamente simples: só dados, sem classes e sem nada da
 * biblioteca de renderização. A tradução para o formato do `qr-code-styling`
 * acontece em `options.ts` — assim, trocar de biblioteca um dia não obriga a
 * migrar o banco.
 */

/** Formato dos módulos (os "pixels" do código). */
export type DotStyle =
  | "square"
  | "rounded"
  | "extra-rounded"
  | "dots"
  | "classy"
  | "classy-rounded";

/** Formato da moldura dos três olhos. */
export type EyeFrameStyle = "square" | "extra-rounded" | "dot";

/** Formato do miolo dos três olhos. */
export type EyeBallStyle = "square" | "dot" | "rounded";

/** Correção de erro: quanto maior, mais dano o código tolera. */
export type ErrorCorrection = "L" | "M" | "Q" | "H";

export interface QrGradient {
  type: "linear" | "radial";
  /** Graus. Só usado no linear. */
  rotation: number;
  from: string;
  to: string;
}

/** Cor sólida ou gradiente. */
export type QrFill =
  | { kind: "solid"; color: string }
  | { kind: "gradient"; gradient: QrGradient };

export interface QrLogo {
  /** Data URL ou URL pública da imagem. */
  src: string;
  /** Fração da largura do QR ocupada pelo logo (0.1 a 0.4). */
  size: number;
  /** Respiro branco em volta do logo, em módulos. */
  margin: number;
  /** Apaga os módulos atrás do logo em vez de desenhar por cima. */
  hideBackgroundDots: boolean;
}

export interface QrFrame {
  /** Texto da chamada. Vazio desliga a moldura. */
  text: string;
  /** Cor da faixa; o texto sai em branco ou preto conforme o contraste. */
  color: string;
  position: "bottom" | "top";
}

export interface QrDesign {
  /** Lado do QR em pixels na exportação padrão. */
  size: number;
  /** Zona de silêncio, em módulos. Abaixo de 4 alguns leitores falham. */
  margin: number;
  dotStyle: DotStyle;
  eyeFrameStyle: EyeFrameStyle;
  eyeBallStyle: EyeBallStyle;
  /** Cor dos módulos. */
  foreground: QrFill;
  /** Cor do fundo. `transparent` é permitido, mas derruba a legibilidade. */
  background: string;
  /** Cor dos olhos. `null` herda do `foreground`. */
  eyeFrameColor: string | null;
  eyeBallColor: string | null;
  errorCorrection: ErrorCorrection;
  logo: QrLogo | null;
  frame: QrFrame | null;
}

export type ExportFormat = "png" | "svg" | "pdf";
