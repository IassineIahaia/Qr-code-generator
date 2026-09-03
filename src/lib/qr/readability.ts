import { ECC_RECOVERY } from "./defaults";
import type { QrDesign } from "./types";

/**
 * Medidor de escaneabilidade.
 *
 * Um QR bonito que não lê não serve para nada, e o erro só aparece depois de
 * mil adesivos impressos. Este módulo transforma as escolhas de design em um
 * aviso antes da impressão.
 *
 * As regras vêm do que de fato quebra leitura em campo:
 *  - contraste insuficiente entre módulo e fundo (a câmera binariza a imagem);
 *  - inversão (claro sobre escuro), que parte dos leitores não tenta;
 *  - zona de silêncio menor que 4 módulos, exigida pela ISO/IEC 18004;
 *  - logo grande demais para a correção de erro escolhida;
 *  - módulo pequeno demais no tamanho impresso.
 */

export type ReadabilityLevel = "excelente" | "boa" | "arriscada" | "ruim";

export interface ReadabilityIssue {
  /** `erro` derruba a nota; `aviso` só alerta. */
  severity: "erro" | "aviso";
  message: string;
  /** O que fazer para resolver. */
  fix: string;
}

export interface ReadabilityReport {
  /** 0 a 100. */
  score: number;
  level: ReadabilityLevel;
  label: string;
  /** Contraste do símbolo, 0 a 1 (ISO/IEC 15415). */
  symbolContrast: number;
  /** Grau A–F correspondente. */
  contrastGrade: "A" | "B" | "C" | "D" | "F";
  issues: ReadabilityIssue[];
}

/** Converte `#rgb` ou `#rrggbb` em canais 0–255. */
function parseHex(hex: string): [number, number, number] | null {
  const limpo = hex.trim().replace("#", "");
  const cheio =
    limpo.length === 3
      ? limpo
          .split("")
          .map((c) => c + c)
          .join("")
      : limpo;
  if (!/^[0-9a-fA-F]{6}$/.test(cheio)) return null;
  return [
    parseInt(cheio.slice(0, 2), 16),
    parseInt(cheio.slice(2, 4), 16),
    parseInt(cheio.slice(4, 6), 16),
  ];
}

/** Luminância relativa (WCAG 2.x). */
export function luminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((canal) => {
    const s = canal / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Razão de contraste WCAG: 1 (nenhum) a 21 (preto/branco).
 * Serve para escolher a cor do texto da moldura — não para julgar o QR.
 */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return 1;
  const claro = Math.max(la, lb);
  const escuro = Math.min(la, lb);
  return (claro + 0.05) / (escuro + 0.05);
}

/**
 * Contraste do símbolo, `(Lmax - Lmin) / Lmax`, como na ISO/IEC 15415.
 *
 * É esta a conta que importa para um QR, e não a WCAG: o leitor não "lê" as
 * cores, ele binariza a imagem num limiar. Laranja sobre branco dá 2,8:1 em
 * WCAG — reprovado para texto — mas 73% de contraste de símbolo, que é grau
 * A para código. Usar WCAG aqui reprovaria cores de marca que funcionam.
 */
export function symbolContrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return 0;
  const claro = Math.max(la, lb);
  const escuro = Math.min(la, lb);
  if (claro <= 0) return 0;
  return (claro - escuro) / claro;
}

/** Grau da ISO/IEC 15415 para um contraste de símbolo. */
export function grauContraste(contraste: number): "A" | "B" | "C" | "D" | "F" {
  if (contraste >= 0.7) return "A";
  if (contraste >= 0.55) return "B";
  if (contraste >= 0.4) return "C";
  if (contraste >= 0.2) return "D";
  return "F";
}

/** Cor representativa do primeiro plano (meio do gradiente, se houver). */
function corPrincipal(design: QrDesign): string {
  if (design.foreground.kind === "solid") return design.foreground.color;
  const { from, to } = design.foreground.gradient;
  const a = parseHex(from);
  const b = parseHex(to);
  if (!a || !b) return from;
  const media = a.map((canal, i) => Math.round((canal + b[i]) / 2));
  return `#${media.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export interface ReadabilityInput {
  design: QrDesign;
  /** Conteúdo a codificar: quanto maior, mais módulos e menor cada um. */
  data: string;
  /** Largura na impressão, em milímetros. Opcional. */
  printWidthMm?: number;
}

/**
 * Estimativa do número de módulos por lado a partir do tamanho do conteúdo.
 * Não é exata — a contagem real depende do modo de codificação —, mas erra
 * para o lado seguro, que é o que interessa num aviso.
 */
export function estimarModulos(data: string, ecc: QrDesign["errorCorrection"]) {
  const bytes = new TextEncoder().encode(data).length;
  // Capacidade aproximada em bytes por versão, no modo Byte.
  const fator = { L: 1, M: 0.79, Q: 0.56, H: 0.43 }[ecc];
  const capacidadePorVersao = (v: number) => {
    const modulos = 17 + 4 * v;
    return Math.floor(((modulos - 16) ** 2 / 8) * 0.82 * fator);
  };
  for (let versao = 1; versao <= 40; versao++) {
    if (capacidadePorVersao(versao) >= bytes) return 17 + 4 * versao;
  }
  return 177; // versão 40, o máximo
}

export function avaliarLegibilidade({
  design,
  data,
  printWidthMm,
}: ReadabilityInput): ReadabilityReport {
  const issues: ReadabilityIssue[] = [];
  let score = 100;

  const frente = corPrincipal(design);
  const fundo = design.background;
  const contraste = symbolContrast(frente, fundo);
  const grau = grauContraste(contraste);
  const pct = Math.round(contraste * 100);

  // --- Contraste do símbolo (ISO/IEC 15415) ---
  if (grau === "F") {
    score -= 50;
    issues.push({
      severity: "erro",
      message: `Contraste de símbolo de ${pct}% (grau F). O leitor não separa módulo de fundo.`,
      fix: "Escureça os módulos ou clareie o fundo. Mire em 70% ou mais.",
    });
  } else if (grau === "D") {
    score -= 30;
    issues.push({
      severity: "erro",
      message: `Contraste de símbolo de ${pct}% (grau D), no limite do que a norma aceita.`,
      fix: "Aumente a diferença de luminosidade entre as duas cores.",
    });
  } else if (grau === "C") {
    score -= 12;
    issues.push({
      severity: "aviso",
      message: `Contraste de símbolo de ${pct}% (grau C). Passa, mas sem folga.`,
      fix: "Câmera ruim ou impressão desbotada podem derrubar a leitura.",
    });
  }

  // --- Inversão ---
  const lumFrente = luminance(frente);
  const lumFundo = luminance(fundo);
  if (lumFrente !== null && lumFundo !== null && lumFrente > lumFundo) {
    score -= 15;
    issues.push({
      severity: "aviso",
      message: "Módulos claros sobre fundo escuro.",
      fix: "Funciona na maioria dos celulares novos, mas leitores antigos e alguns apps de banco não invertem. Teste antes de imprimir.",
    });
  }

  // --- Zona de silêncio ---
  if (design.margin < 4) {
    score -= 20;
    issues.push({
      severity: "erro",
      message: `Margem de ${design.margin} módulos, abaixo do mínimo da norma.`,
      fix: "Use pelo menos 4 módulos de margem branca.",
    });
  }

  // --- Logo x correção de erro ---
  if (design.logo) {
    const areaCoberta = design.logo.size ** 2;
    const tolerancia = ECC_RECOVERY[design.errorCorrection];
    if (areaCoberta > tolerancia) {
      score -= 30;
      issues.push({
        severity: "erro",
        message: `O logo cobre cerca de ${Math.round(areaCoberta * 100)}% do código, acima dos ${Math.round(tolerancia * 100)}% que o nível ${design.errorCorrection} recupera.`,
        fix: "Diminua o logo ou suba a correção de erro para H.",
      });
    } else if (areaCoberta > tolerancia * 0.7) {
      score -= 10;
      issues.push({
        severity: "aviso",
        message: "O logo consome quase toda a margem de recuperação.",
        fix: "Sobra pouco para sujeira e dobras no papel. Considere um logo menor.",
      });
    }
  }

  // --- Estilos que comem área do módulo ---
  if (design.dotStyle === "dots" || design.dotStyle === "classy") {
    score -= 8;
    issues.push({
      severity: "aviso",
      message: "Módulos redondos ou recortados deixam falhas entre eles.",
      fix: "Em impressão pequena, prefira quadrado ou arredondado.",
    });
  }

  // --- Tamanho físico do módulo ---
  const modulos = estimarModulos(data, design.errorCorrection);
  if (printWidthMm) {
    const moduloMm = printWidthMm / (modulos + design.margin * 2);
    if (moduloMm < 0.4) {
      score -= 30;
      issues.push({
        severity: "erro",
        message: `Cada módulo ficaria com ${moduloMm.toFixed(2)} mm impresso.`,
        fix: "Abaixo de 0,4 mm a impressão borra. Aumente o QR ou encurte o conteúdo.",
      });
    } else if (moduloMm < 0.6) {
      score -= 12;
      issues.push({
        severity: "aviso",
        message: `Módulo de ${moduloMm.toFixed(2)} mm exige impressão de boa qualidade.`,
        fix: "Aumente o QR para folgar, ou use um link mais curto.",
      });
    }
  }

  // --- Conteúdo longo demais ---
  if (modulos > 100) {
    score -= 10;
    issues.push({
      severity: "aviso",
      message: `O conteúdo gera um código denso (~${modulos} módulos por lado).`,
      fix: "Um link curto dinâmico deixa o código muito mais simples de ler.",
    });
  }

  score = Math.max(0, Math.min(100, score));

  const level: ReadabilityLevel =
    score >= 85
      ? "excelente"
      : score >= 65
        ? "boa"
        : score >= 40
          ? "arriscada"
          : "ruim";

  const label = {
    excelente: "Excelente",
    boa: "Boa",
    arriscada: "Arriscada",
    ruim: "Ruim",
  }[level];

  return {
    score,
    level,
    label,
    symbolContrast: contraste,
    contrastGrade: grau,
    issues,
  };
}
