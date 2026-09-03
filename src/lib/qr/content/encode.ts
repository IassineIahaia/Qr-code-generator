import { encodePix } from "./pix";
import { encodeVCard } from "./vcard";
import type {
  EmailContent,
  QrContent,
  SmsContent,
  UrlContent,
  WhatsAppContent,
  WifiContent,
} from "./types";

/**
 * Traduz o conteúdo estruturado para a string que vai dentro do QR.
 *
 * Cada formato aqui é uma convenção de leitor, não um padrão único: o que
 * manda é o que iOS e Android realmente abrem. Onde há divergência, a escolha
 * está comentada.
 */

/**
 * Completa o esquema quando a pessoa digita só `site.com.br`.
 *
 * Só mexemos quando não há esquema nenhum. Se veio `mailto:`, `tel:` ou
 * qualquer outro, respeitamos — quem digitou sabia o que queria.
 */
export function normalizeUrl(url: string): string {
  const limpo = url.trim();
  if (!limpo) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(limpo) ? limpo : `https://${limpo}`;
}

/** Deixa só os dígitos: espaços, parênteses, hífens e `+` saem. */
export function onlyDigits(valor: string): string {
  return valor.replace(/\D/g, "");
}

function encodeUrl(c: UrlContent): string {
  return normalizeUrl(c.url);
}

/**
 * `wa.me` em vez de `whatsapp://`: o link universal funciona no desktop, no
 * navegador e mesmo em quem ainda não tem o app instalado.
 */
function encodeWhatsApp(c: WhatsAppContent): string {
  const numero = onlyDigits(c.countryCode) + onlyDigits(c.phone);
  const base = `https://wa.me/${numero}`;
  const texto = c.message.trim();
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/**
 * Escapa `\`, `;`, `,`, `:` e `"` — os separadores da gramática do payload
 * de Wi-Fi. Sem isso, uma senha com `;` corta o campo no meio.
 */
function escapeWifi(valor: string): string {
  return valor.replace(/([\\;,:"])/g, "\\$1");
}

function encodeWifi(c: WifiContent): string {
  const partes = [`T:${c.encryption}`, `S:${escapeWifi(c.ssid)}`];
  // Rede aberta não leva senha; mandar `P:;` confunde alguns Android.
  if (c.encryption !== "nopass") {
    partes.push(`P:${escapeWifi(c.password)}`);
  }
  if (c.hidden) partes.push("H:true");
  // O `;;` final faz parte do formato, não é engano.
  return `WIFI:${partes.join(";")};;`;
}

function encodeEmail(c: EmailContent): string {
  const params = new URLSearchParams();
  if (c.subject.trim()) params.set("subject", c.subject.trim());
  if (c.body.trim()) params.set("body", c.body.trim());
  const query = params.toString();
  // URLSearchParams codifica espaço como `+`, que o mailto: mostra literal.
  const sufixo = query ? `?${query.replace(/\+/g, "%20")}` : "";
  return `mailto:${c.to.trim()}${sufixo}`;
}

/**
 * `SMSTO:` em vez de `sms:` — é a forma que iOS e Android leem igual. O
 * esquema `sms:` separa o corpo com `?body=` no iOS e `&body=` em parte dos
 * Android, e escolher um quebra o outro.
 */
function encodeSms(c: SmsContent): string {
  const numero = c.phone.trim();
  const texto = c.message.trim();
  return texto ? `SMSTO:${numero}:${texto}` : `SMSTO:${numero}:`;
}

/** Ponto único de tradução: conteúdo estruturado → string do QR. */
export function encodeContent(content: QrContent): string {
  switch (content.type) {
    case "url":
      return encodeUrl(content);
    case "text":
      return content.text;
    case "pix":
      return encodePix(content);
    case "whatsapp":
      return encodeWhatsApp(content);
    case "wifi":
      return encodeWifi(content);
    case "vcard":
      return encodeVCard(content);
    case "email":
      return encodeEmail(content);
    case "sms":
      return encodeSms(content);
  }
}

/**
 * O que o QR dinâmico redireciona.
 *
 * Só faz sentido para conteúdo que é um endereço navegável: uma rede Wi-Fi
 * ou um vCard não têm destino para trocar depois de impresso. Devolver
 * `null` é o sinal de que aquele tipo só existe em versão estática.
 */
export function destinationOf(content: QrContent): string | null {
  switch (content.type) {
    case "url":
      return normalizeUrl(content.url);
    case "whatsapp":
      return encodeWhatsApp(content);
    default:
      return null;
  }
}

/** Tipos que aceitam virar QR dinâmico (com slug curto e analytics). */
export function supportsDynamic(type: QrContent["type"]): boolean {
  return type === "url" || type === "whatsapp";
}
