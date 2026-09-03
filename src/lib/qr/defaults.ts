import { designSchema } from "./schemas";
import type { ErrorCorrection, QrDesign } from "./types";

/** Marca do produto, repetida aqui para o QR não depender do CSS. */
export const BRAND_FROM = "#FF4D00";
export const BRAND_TO = "#FF8A00";

/**
 * Padrão deliberadamente conservador: preto sobre branco, módulos quadrados,
 * ECC médio. É o que qualquer leitor lê sem esforço. Toda personalização
 * parte daqui e só piora a legibilidade — por isso o medidor existe.
 */
export const DEFAULT_DESIGN: QrDesign = {
  size: 512,
  margin: 4,
  dotStyle: "square",
  eyeFrameStyle: "square",
  eyeBallStyle: "square",
  foreground: { kind: "solid", color: "#000000" },
  background: "#FFFFFF",
  eyeFrameColor: null,
  eyeBallColor: null,
  errorCorrection: "M",
  logo: null,
  frame: null,
};

export interface QrPreset {
  id: string;
  name: string;
  description: string;
  design: QrDesign;
}

/** Pontos de partida prontos, para quem não quer mexer em cada controle. */
export const PRESETS: QrPreset[] = [
  {
    id: "classico",
    name: "Clássico",
    description: "Preto e branco, quadrado. O mais confiável de todos.",
    design: DEFAULT_DESIGN,
  },
  {
    id: "marca",
    name: "Marca",
    description: "Gradiente laranja do produto, cantos arredondados.",
    design: {
      ...DEFAULT_DESIGN,
      dotStyle: "rounded",
      eyeFrameStyle: "extra-rounded",
      eyeBallStyle: "dot",
      foreground: {
        kind: "gradient",
        gradient: {
          type: "linear",
          rotation: 45,
          from: BRAND_FROM,
          to: BRAND_TO,
        },
      },
      errorCorrection: "Q",
    },
  },
  {
    id: "noturno",
    name: "Noturno",
    description: "Claro sobre escuro. Confira o leitor antes de imprimir.",
    design: {
      ...DEFAULT_DESIGN,
      dotStyle: "extra-rounded",
      eyeFrameStyle: "extra-rounded",
      eyeBallStyle: "dot",
      foreground: { kind: "solid", color: "#D1E5F6" },
      background: "#011521",
      errorCorrection: "Q",
    },
  },
  {
    id: "impressao",
    name: "Impressão",
    description: "ECC alto e margem folgada, para papel e adesivo.",
    design: {
      ...DEFAULT_DESIGN,
      size: 1024,
      margin: 6,
      errorCorrection: "H",
      frame: { text: "ESCANEIE-ME", color: "#000000", position: "bottom" },
    },
  },
];

/** Quanto de dano cada nível tolera — usado no medidor e na interface. */
export const ECC_RECOVERY: Record<ErrorCorrection, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

export const ECC_LABELS: Record<ErrorCorrection, string> = {
  L: "Baixa (7%)",
  M: "Média (15%)",
  Q: "Alta (25%)",
  H: "Máxima (30%)",
};

/**
 * Lê um `design` vindo do banco, tapando o que faltar com o padrão.
 *
 * Existe porque a coluna `design` é `jsonb not null default '{}'` — ou
 * seja, **o banco permite um design vazio**, e uma linha criada por fora do
 * assistente (um seed, um `insert` manual, uma migração futura) chega aqui
 * como `{}`. Sem esta função, o primeiro código nessas condições derruba a
 * página de detalhe inteira em `design.foreground.kind` — a tela some por
 * causa de um campo de aparência que nem precisava existir.
 *
 * A mesclagem é campo a campo, e não "válido ou joga fora": um design a que
 * falte só a moldura deve manter as cores que a pessoa escolheu. Depois da
 * mescla o schema confere o resultado; se ainda assim não fechar, o padrão
 * conservador (preto no branco) é a resposta segura.
 */
export function lerDesign(bruto: unknown): QrDesign {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) {
    return DEFAULT_DESIGN;
  }

  const candidato = { ...DEFAULT_DESIGN, ...(bruto as Partial<QrDesign>) };
  const conferido = designSchema.safeParse(candidato);

  return conferido.success ? (conferido.data as QrDesign) : DEFAULT_DESIGN;
}
