/**
 * Modelo do *conteúdo* de um QR Code — o que ele carrega, não como ele
 * aparece. É este objeto que vai serializado na coluna `content` de
 * `qr_codes`; o desenho mora em `design` (veja `../types.ts`).
 *
 * A união é discriminada por `type`, que espelha o enum `qr_type` do banco.
 * Guardamos os campos separados (e não só a string final) porque o QR
 * dinâmico precisa reeditar o destino depois de impresso: sem os campos, um
 * `WIFI:T:WPA;S:...;` gravado no banco vira um beco sem saída.
 */

export interface UrlContent {
  type: "url";
  url: string;
}

export interface TextContent {
  type: "text";
  text: string;
}

/** Pix "copia e cola" (BR Code, padrão EMV do Banco Central). */
export interface PixContent {
  type: "pix";
  /** Chave Pix: CPF/CNPJ, e-mail, telefone ou chave aleatória. */
  key: string;
  /** Nome do recebedor, máx. 25 caracteres depois de normalizado. */
  merchantName: string;
  /** Cidade do recebedor, máx. 15 caracteres depois de normalizado. */
  merchantCity: string;
  /** Em reais. `null` deixa o pagador digitar o valor. */
  amount: number | null;
  /** Identificador da cobrança (txid). Vazio vira `***`. */
  txid: string;
  /** Mensagem que aparece no app do pagador. */
  description: string;
}

export interface WhatsAppContent {
  type: "whatsapp";
  /** Código do país, só dígitos (Brasil = `55`). */
  countryCode: string;
  /** DDD + número, só dígitos. */
  phone: string;
  /** Mensagem já preenchida na conversa. */
  message: string;
}

export type WifiEncryption = "WPA" | "WEP" | "nopass";

export interface WifiContent {
  type: "wifi";
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  /** Rede que não anuncia o SSID. */
  hidden: boolean;
}

export interface VCardContent {
  type: "vcard";
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phoneMobile: string;
  phoneWork: string;
  email: string;
  website: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  note: string;
}

export interface EmailContent {
  type: "email";
  to: string;
  subject: string;
  body: string;
}

export interface SmsContent {
  type: "sms";
  phone: string;
  message: string;
}

/** Todo conteúdo suportado hoje. */
export type QrContent =
  | UrlContent
  | TextContent
  | PixContent
  | WhatsAppContent
  | WifiContent
  | VCardContent
  | EmailContent
  | SmsContent;

/** Só os discriminantes — útil para `<Select>` e para checagens no banco. */
export type QrContentType = QrContent["type"];
