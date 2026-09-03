import type { QrContent, QrContentType } from "./types";

/**
 * Catálogo dos tipos de conteúdo: rótulo, explicação e valor inicial.
 *
 * A interface do passo 1 da criação (item 4.2) se monta a partir daqui, então
 * acrescentar um tipo novo é acrescentar uma entrada nesta lista — mais o
 * codificador em `encode.ts` e o schema em `schemas.ts`.
 */

export interface QrTypeMeta {
  type: QrContentType;
  label: string;
  /** Uma linha, no tom de quem explica para um lojista. */
  description: string;
  /** Nome do ícone em `lucide-react`. */
  icon: string;
  /** Pode virar QR dinâmico (destino editável depois de impresso). */
  dynamic: boolean;
  /** Valor inicial do formulário. */
  empty: () => QrContent;
}

export const QR_TYPES: QrTypeMeta[] = [
  {
    type: "url",
    label: "Link",
    description: "Abre um site, um formulário ou qualquer endereço na web.",
    icon: "Link",
    dynamic: true,
    empty: () => ({ type: "url", url: "" }),
  },
  {
    type: "pix",
    label: "Pix",
    description: "Cobrança Pix copia e cola, com ou sem valor definido.",
    icon: "QrCode",
    dynamic: false,
    empty: () => ({
      type: "pix",
      key: "",
      merchantName: "",
      merchantCity: "",
      amount: null,
      txid: "",
      description: "",
    }),
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    description: "Abre uma conversa com a mensagem já digitada.",
    icon: "MessageCircle",
    dynamic: true,
    empty: () => ({
      type: "whatsapp",
      countryCode: "55",
      phone: "",
      message: "",
    }),
  },
  {
    type: "wifi",
    label: "Wi-Fi",
    description: "Conecta o celular à rede sem ninguém digitar a senha.",
    icon: "Wifi",
    dynamic: false,
    empty: () => ({
      type: "wifi",
      ssid: "",
      password: "",
      encryption: "WPA",
      hidden: false,
    }),
  },
  {
    type: "vcard",
    label: "Cartão de contato",
    description: "Salva seus dados na agenda de quem escaneia.",
    icon: "ContactRound",
    dynamic: false,
    empty: () => ({
      type: "vcard",
      firstName: "",
      lastName: "",
      organization: "",
      title: "",
      phoneMobile: "",
      phoneWork: "",
      email: "",
      website: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      note: "",
    }),
  },
  {
    type: "email",
    label: "E-mail",
    description: "Abre o app de e-mail com destinatário e assunto prontos.",
    icon: "Mail",
    dynamic: false,
    empty: () => ({ type: "email", to: "", subject: "", body: "" }),
  },
  {
    type: "sms",
    label: "SMS",
    description: "Abre uma mensagem de texto já endereçada.",
    icon: "MessageSquare",
    dynamic: false,
    empty: () => ({ type: "sms", phone: "", message: "" }),
  },
  {
    type: "text",
    label: "Texto",
    description: "Mostra um texto puro na tela do leitor.",
    icon: "Type",
    dynamic: false,
    empty: () => ({ type: "text", text: "" }),
  },
];

const POR_TIPO = new Map(QR_TYPES.map((m) => [m.type, m]));

export function metaFor(type: QrContentType): QrTypeMeta {
  const meta = POR_TIPO.get(type);
  if (!meta) throw new Error(`Tipo de QR desconhecido: ${type}`);
  return meta;
}

export function emptyContent(type: QrContentType): QrContent {
  return metaFor(type).empty();
}

/**
 * Nome sugerido para o QR, a partir do que ele carrega. Serve como valor
 * inicial do campo "nome" na criação — quem quiser troca.
 */
export function suggestName(content: QrContent): string {
  switch (content.type) {
    case "url": {
      const bruto = content.url.trim();
      if (!bruto) return "Novo link";
      try {
        const url = new URL(
          /^[a-z][a-z0-9+.-]*:/i.test(bruto) ? bruto : `https://${bruto}`,
        );
        return url.hostname.replace(/^www\./, "");
      } catch {
        return "Novo link";
      }
    }
    case "pix":
      return content.merchantName.trim() || "Cobrança Pix";
    case "whatsapp":
      return content.phone.trim()
        ? `WhatsApp ${content.phone.trim()}`
        : "WhatsApp";
    case "wifi":
      return content.ssid.trim() || "Rede Wi-Fi";
    case "vcard":
      return (
        [content.firstName, content.lastName]
          .map((p) => p.trim())
          .filter(Boolean)
          .join(" ") ||
        content.organization.trim() ||
        "Cartão de contato"
      );
    case "email":
      return content.to.trim() || "E-mail";
    case "sms":
      return content.phone.trim() ? `SMS ${content.phone.trim()}` : "SMS";
    case "text":
      return content.text.trim().slice(0, 40) || "Texto";
  }
}

/**
 * Resumo do conteúdo em uma linha, para a coluna "Destino" da listagem.
 *
 * Diferente de `suggestName`: aqui queremos mostrar *para onde o código
 * leva*, não como chamá-lo. Um QR dinâmico usa a coluna `destination` do
 * banco; esta função cobre os estáticos, que não têm destino nenhum.
 */
export function summarizeContent(content: QrContent): string {
  switch (content.type) {
    case "url":
      return content.url.trim() || "—";
    case "pix": {
      const valor =
        content.amount != null
          ? content.amount.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : "valor livre";
      return `${content.key.trim() || "sem chave"} · ${valor}`;
    }
    case "whatsapp":
      return `+${content.countryCode.replace(/\D/g, "")} ${content.phone.trim()}`;
    case "wifi":
      return `Rede ${content.ssid.trim() || "—"}`;
    case "vcard":
      return (
        [content.firstName, content.lastName]
          .map((p) => p.trim())
          .filter(Boolean)
          .join(" ") ||
        content.organization.trim() ||
        "Contato"
      );
    case "email":
      return content.to.trim() || "—";
    case "sms":
      return content.phone.trim() || "—";
    case "text":
      return content.text.trim().slice(0, 60) || "—";
  }
}
