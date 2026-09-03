import { z } from "zod";
import { qrContentSchema } from "./content/schemas";
import { SLUG_PATTERN } from "./slug";

/**
 * Validação do QR inteiro — o que a Server Action recebe antes de gravar.
 *
 * O `design` chega do browser como JSON solto e vai direto para uma coluna
 * `jsonb`, então ele é validado campo a campo aqui. Sem isso, qualquer coisa
 * que o cliente mandasse entraria no banco e voltaria depois para o
 * renderizador.
 */

const cor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida.")
  .or(z.literal("transparent"));

const gradienteSchema = z.object({
  type: z.enum(["linear", "radial"]),
  rotation: z.number().min(-360).max(360),
  from: cor,
  to: cor,
});

const preenchimentoSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("solid"), color: cor }),
  z.object({ kind: z.literal("gradient"), gradient: gradienteSchema }),
]);

const logoSchema = z.object({
  // Aceita data URL (upload embutido) ou https. `http:` fica de fora porque
  // viraria conteúdo misto na exportação.
  src: z
    .string()
    .max(2_000_000, "Logo grande demais. Use uma imagem menor que 1,5 MB.")
    .refine(
      (v) => v.startsWith("data:image/") || v.startsWith("https://"),
      "A imagem precisa ser um arquivo enviado ou um endereço https.",
    ),
  size: z.number().min(0.1).max(0.45),
  margin: z.number().min(0).max(20),
  hideBackgroundDots: z.boolean(),
});

const molduraSchema = z.object({
  text: z.string().max(60, "A chamada da moldura tem no máximo 60 caracteres."),
  color: cor,
  position: z.enum(["bottom", "top"]),
});

export const designSchema = z.object({
  size: z.number().int().min(128).max(4096),
  margin: z.number().int().min(0).max(20),
  dotStyle: z.enum([
    "square",
    "rounded",
    "extra-rounded",
    "dots",
    "classy",
    "classy-rounded",
  ]),
  eyeFrameStyle: z.enum(["square", "extra-rounded", "dot"]),
  eyeBallStyle: z.enum(["square", "dot", "rounded"]),
  foreground: preenchimentoSchema,
  background: cor,
  eyeFrameColor: cor.nullable(),
  eyeBallColor: cor.nullable(),
  errorCorrection: z.enum(["L", "M", "Q", "H"]),
  logo: logoSchema.nullable(),
  frame: molduraSchema.nullable(),
});

const nome = z
  .string()
  .trim()
  .min(1, "Dê um nome ao seu QR Code.")
  .max(120, "Nome muito longo.");

/** Slug personalizado. Vazio significa "sorteie um". */
const slugOpcional = z
  .string()
  .trim()
  .max(40, "No máximo 40 caracteres.")
  .refine(
    (v) => v === "" || SLUG_PATTERN.test(v),
    "Use de 3 a 40 caracteres: letras, números, hífen e underscore.",
  )
  .default("");

const tags = z
  .array(z.string().trim().min(1).max(30))
  .max(10, "No máximo 10 etiquetas.")
  .default([]);

export const createQrSchema = z.object({
  name: nome,
  content: qrContentSchema,
  design: designSchema,
  /** Estático grava o conteúdo no próprio código; dinâmico grava o link curto. */
  isDynamic: z.boolean().default(false),
  slug: slugOpcional,
  folderId: z.uuid("Pasta inválida.").nullable().default(null),
  tags,
});

export type CreateQrInput = z.input<typeof createQrSchema>;
export type CreateQrParsed = z.infer<typeof createQrSchema>;

/** Edição: nome, pasta e etiquetas. Conteúdo e design têm caminhos próprios. */
export const updateQrMetaSchema = z.object({
  id: z.uuid(),
  name: nome,
  folderId: z.uuid("Pasta inválida.").nullable().default(null),
  tags,
});

/**
 * Troca do destino de um QR dinâmico — o item 4.5, a promessa central do
 * produto. O slug não entra: ele já está impresso, e mudá-lo transformaria
 * a edição numa forma silenciosa de invalidar todo material publicado.
 */
export const updateDestinationSchema = z.object({
  id: z.uuid(),
  content: qrContentSchema,
});

/** Troca só do design. O código continua o mesmo; muda a aparência. */
export const updateDesignSchema = z.object({
  id: z.uuid(),
  design: designSchema,
});

/* ------------------------------------------------------------------ */
/*  Controle — Fase 5                                                  */
/* ------------------------------------------------------------------ */

/** Ligar, pausar ou arquivar. É só a intenção do dono: o estado real sai
 *  de `effectiveStatus`, que também consulta o relógio e o contador. */
export const setStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["active", "paused", "archived"]),
});

/**
 * Um destino de regra. Aceita "site.com" e completa o `https://`, mas
 * recusa qualquer esquema que não seja http(s) — um `javascript:` gravado
 * aqui viraria XSS na hora do redirect.
 */
const destinoRegra = z
  .string()
  .trim()
  .max(2000, "Endereço longo demais.")
  .refine((v) => {
    if (!v) return true;
    const comEsquema = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
    try {
      const u = new URL(comEsquema);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use um endereço http ou https válido.");

/**
 * Um instante vindo do formulário, já em ISO.
 *
 * A conversão de horário de parede ("10/09/2026 14:30", sempre lido como
 * Brasília) para instante acontece no formulário, em `datetime.ts`: é lá que
 * mora o `<input type="datetime-local">`, e é ele quem sabe que aquele texto
 * não tem fuso. O que chega aqui já é um instante sem ambiguidade.
 */
const instanteOpcional = z
  .string()
  .trim()
  .nullable()
  .default(null)
  .refine(
    (v) => v === null || v === "" || !Number.isNaN(Date.parse(v)),
    "Data inválida.",
  )
  .transform((v) => (v ? v : null));

/**
 * As regras de controle — itens 5.3 a 5.6, num formulário só.
 *
 * Elas viajam juntas porque o dono as pensa juntas ("fica no ar até o fim
 * da promoção, no máximo 500 leituras, e só para quem tem a senha"), e
 * porque validar a janela exige ver as duas pontas ao mesmo tempo.
 */
export const updateRulesSchema = z
  .object({
    id: z.uuid(),
    activeFrom: instanteOpcional,
    expiresAt: instanteOpcional,
    scanLimit: z
      .number()
      .int("Use um número inteiro.")
      .min(1, "O limite tem que ser pelo menos 1.")
      .max(10_000_000, "Limite alto demais.")
      .nullable()
      .default(null),

    /**
     * `null` = não mexer na senha (o formulário não reenvia a senha a cada
     * salvamento), `""` = remover, texto = definir. Três significados num
     * campo só porque o formulário tem exatamente esses três gestos.
     */
    password: z
      .string()
      .max(72, "No máximo 72 caracteres.")
      .nullable()
      .default(null)
      .refine(
        (v) => v === null || v === "" || v.length >= 4,
        "A senha precisa de pelo menos 4 caracteres.",
      ),

    /** O que quem escaneia vê quando o código está fora do ar — item 6.6. */
    disabledBehavior: z.enum(["default", "message", "redirect"]).default("default"),
    disabledMessage: z
      .string()
      .trim()
      .max(280, "No máximo 280 caracteres.")
      .default(""),
    disabledRedirectUrl: destinoRegra.default(""),

    deviceRules: z
      .object({
        ios: destinoRegra.default(""),
        android: destinoRegra.default(""),
        desktop: destinoRegra.default(""),
      })
      .default({ ios: "", android: "", desktop: "" }),

    geoRules: z
      .array(
        z.object({
          country: z
            .string()
            .trim()
            .toUpperCase()
            .regex(/^[A-Z]{2}$/, "Use o código de 2 letras do país (BR, PT, US)."),
          url: destinoRegra,
        }),
      )
      .max(20, "No máximo 20 países.")
      .default([]),
  })
  .refine(
    (v) =>
      !v.activeFrom ||
      !v.expiresAt ||
      Date.parse(v.expiresAt) > Date.parse(v.activeFrom),
    { path: ["expiresAt"], message: "A expiração tem que vir depois da ativação." },
  )
  .refine((v) => v.disabledBehavior !== "message" || v.disabledMessage.length > 0, {
    path: ["disabledMessage"],
    message: "Escreva o recado que vai aparecer.",
  })
  .refine(
    (v) => v.disabledBehavior !== "redirect" || v.disabledRedirectUrl.length > 0,
    {
      path: ["disabledRedirectUrl"],
      message: "Informe para onde mandar quem escanear.",
    },
  );

export type UpdateRulesInput = z.input<typeof updateRulesSchema>;
export type UpdateRulesParsed = z.infer<typeof updateRulesSchema>;
