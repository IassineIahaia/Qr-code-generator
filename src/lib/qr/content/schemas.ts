import { z } from "zod";
import { onlyDigits } from "./encode";

/**
 * Validação do conteúdo, compartilhada pelo formulário e pela Server Action
 * que grava em `qr_codes.content` — mesmo motivo de `src/lib/auth/schemas.ts`:
 * uma regra só, nos dois lados.
 *
 * O rigor aqui é proposital. Um QR errado só aparece depois de impresso.
 */

const textoOpcional = (max: number) => z.string().trim().max(max).default("");

export const urlContentSchema = z.object({
  type: z.literal("url"),
  url: z
    .string()
    .trim()
    .min(1, "Informe o endereço.")
    .max(2000, "Endereço muito longo.")
    // Validamos o formato depois de completar o `https://`, porque quase
    // ninguém digita o esquema à mão.
    .refine(
      (v) => {
        const completo = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
        try {
          new URL(completo);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Endereço inválido." },
    ),
});

export const textContentSchema = z.object({
  type: z.literal("text"),
  // Acima disso o QR fica denso demais para ler de longe; o medidor de
  // legibilidade avisa antes, mas este é o teto rígido.
  text: z
    .string()
    .min(1, "Escreva alguma coisa.")
    .max(1200, "Texto longo demais para um QR legível."),
});

/**
 * Chave Pix: CPF, CNPJ, telefone, e-mail ou chave aleatória (UUID). Aceitamos
 * o que o Banco Central aceita e deixamos o banco do recebedor dar a palavra
 * final — recusar uma chave válida é pior do que deixar passar uma errada.
 */
const chavePix = z
  .string()
  .trim()
  .min(1, "Informe a chave Pix.")
  .max(77, "Chave Pix muito longa.")
  .refine((v) => {
    const digitos = onlyDigits(v);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))
      return true; // chave aleatória
    if (v.includes("@")) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); // e-mail
    if (v.startsWith("+")) return digitos.length >= 12 && digitos.length <= 14;
    return digitos.length === 11 || digitos.length === 14; // CPF ou CNPJ
  }, "Chave Pix inválida. Use CPF, CNPJ, telefone com +55, e-mail ou chave aleatória.");

export const pixContentSchema = z.object({
  type: z.literal("pix"),
  key: chavePix,
  merchantName: z
    .string()
    .trim()
    .min(1, "Informe o nome de quem recebe.")
    .max(25, "O padrão Pix limita o nome a 25 caracteres."),
  merchantCity: z
    .string()
    .trim()
    .min(1, "Informe a cidade.")
    .max(15, "O padrão Pix limita a cidade a 15 caracteres."),
  amount: z
    .number()
    .positive("O valor precisa ser maior que zero.")
    .max(99999999.99, "Valor acima do limite do padrão Pix.")
    .nullable()
    .default(null),
  txid: textoOpcional(25),
  description: textoOpcional(72),
});

export const whatsappContentSchema = z.object({
  type: z.literal("whatsapp"),
  countryCode: z
    .string()
    .trim()
    .min(1, "Informe o código do país.")
    .refine((v) => {
      const d = onlyDigits(v);
      return d.length >= 1 && d.length <= 4;
    }, "Código do país inválido."),
  phone: z
    .string()
    .trim()
    .min(1, "Informe o número.")
    .refine((v) => {
      const d = onlyDigits(v);
      return d.length >= 6 && d.length <= 13;
    }, "Número inválido. Inclua o DDD, sem o código do país."),
  message: textoOpcional(1000),
});

export const wifiContentSchema = z
  .object({
    type: z.literal("wifi"),
    ssid: z
      .string()
      .trim()
      .min(1, "Informe o nome da rede.")
      .max(32, "O nome da rede tem no máximo 32 caracteres."),
    password: z.string().max(63, "Senha muito longa.").default(""),
    encryption: z.enum(["WPA", "WEP", "nopass"]).default("WPA"),
    hidden: z.boolean().default(false),
  })
  .refine((v) => v.encryption === "nopass" || v.password.length > 0, {
    message: "Informe a senha ou marque a rede como aberta.",
    path: ["password"],
  });

export const vcardContentSchema = z
  .object({
    type: z.literal("vcard"),
    firstName: textoOpcional(40),
    lastName: textoOpcional(40),
    organization: textoOpcional(80),
    title: textoOpcional(60),
    phoneMobile: textoOpcional(25),
    phoneWork: textoOpcional(25),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
        message: "E-mail inválido.",
      })
      .default(""),
    website: textoOpcional(200),
    street: textoOpcional(100),
    city: textoOpcional(60),
    state: textoOpcional(40),
    zip: textoOpcional(20),
    country: textoOpcional(60),
    note: textoOpcional(300),
  })
  // Um cartão sem nome e sem contato nenhum não é cartão.
  .refine(
    (v) =>
      [v.firstName, v.lastName, v.organization].some(Boolean) &&
      [v.phoneMobile, v.phoneWork, v.email].some(Boolean),
    {
      message: "Informe ao menos um nome e uma forma de contato.",
      path: ["firstName"],
    },
  );

export const emailContentSchema = z.object({
  type: z.literal("email"),
  to: z
    .string()
    .trim()
    .min(1, "Informe o destinatário.")
    .email("E-mail inválido."),
  subject: textoOpcional(200),
  body: textoOpcional(1000),
});

export const smsContentSchema = z.object({
  type: z.literal("sms"),
  phone: z
    .string()
    .trim()
    .min(1, "Informe o número.")
    .refine((v) => onlyDigits(v).length >= 6, "Número inválido."),
  message: textoOpcional(500),
});

/** Um schema só, discriminado por `type` — o espelho de `QrContent`. */
export const qrContentSchema = z.discriminatedUnion("type", [
  urlContentSchema,
  textContentSchema,
  pixContentSchema,
  whatsappContentSchema,
  wifiContentSchema,
  vcardContentSchema,
  emailContentSchema,
  smsContentSchema,
]);

export type QrContentInput = z.infer<typeof qrContentSchema>;

/** Erros por campo: `{ merchantCity: "Informe a cidade." }`. */
export type ContentErrors = Partial<Record<string, string>>;

export type ContentValidation =
  | { ok: true; data: QrContentInput }
  | { ok: false; errors: ContentErrors };

/**
 * Valida sem lançar. Guardamos só a primeira mensagem de cada campo: a tela
 * mostra uma linha por campo, e listar três de uma vez só assusta.
 */
export function validateContent(content: unknown): ContentValidation {
  const result = qrContentSchema.safeParse(content);
  if (result.success) return { ok: true, data: result.data };

  const errors: ContentErrors = {};
  for (const issue of result.error.issues) {
    const campo = issue.path.join(".") || "type";
    if (!errors[campo]) errors[campo] = issue.message;
  }
  return { ok: false, errors };
}
