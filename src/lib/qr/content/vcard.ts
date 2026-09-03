import type { VCardContent } from "./types";

/**
 * vCard 3.0 — a versão que iOS e Android leem sem plugin. A 4.0 é mais
 * limpa, mas ainda tropeça em leitores nativos, e um contato que não abre
 * não serve para nada.
 */

/** Escapa os separadores da gramática do vCard (RFC 6350 §3.4). */
function esc(valor: string): string {
  return valor
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Só entra no cartão a linha que tem conteúdo. */
function linha(nome: string, valor: string): string | null {
  const limpo = esc(valor);
  return limpo ? `${nome}:${limpo}` : null;
}

export function encodeVCard(c: VCardContent): string {
  const nomeCompleto = [c.firstName, c.lastName]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");

  const endereco = [c.street, c.city, c.state, c.zip, c.country];
  const temEndereco = endereco.some((p) => p.trim());

  const linhas: (string | null)[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    // N é estruturado: sobrenome;nome;meio;prefixo;sufixo.
    `N:${esc(c.lastName)};${esc(c.firstName)};;;`,
    linha("FN", nomeCompleto),
    linha("ORG", c.organization),
    linha("TITLE", c.title),
    c.phoneMobile.trim() ? `TEL;TYPE=CELL:${esc(c.phoneMobile)}` : null,
    c.phoneWork.trim() ? `TEL;TYPE=WORK,VOICE:${esc(c.phoneWork)}` : null,
    c.email.trim() ? `EMAIL;TYPE=INTERNET:${esc(c.email)}` : null,
    linha("URL", c.website),
    // ADR: caixa postal;complemento;rua;cidade;estado;CEP;país.
    temEndereco ? `ADR;TYPE=WORK:;;${endereco.map(esc).join(";")}` : null,
    linha("NOTE", c.note),
    "END:VCARD",
  ];

  // CRLF é o que a RFC pede; leitores que só aceitam \n tratam o \r como
  // espaço em branco, então este é o formato que agrada aos dois lados.
  return linhas.filter((l): l is string => l !== null).join("\r\n");
}
