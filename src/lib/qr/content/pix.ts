import type { PixContent } from "./types";

/**
 * BR Code — o "Pix copia e cola".
 *
 * Formato EMV® QRCPS-MPM adotado pelo Banco Central: uma sequência de campos
 * `ID (2) + tamanho (2) + valor`, ordenados por ID, terminando no CRC16. O
 * manual de referência é o "Manual de Padrões para Iniciação do Pix" (BCB).
 *
 * Dois detalhes derrubam a maioria das implementações caseiras:
 *  1. o tamanho é contado em caracteres e sempre com dois dígitos (`05`);
 *  2. o CRC é calculado sobre a string *já contendo* `6304` no final.
 */

/** Um campo do payload: `IDTTvalor`. */
function campo(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

/**
 * CRC16/CCITT-FALSE — polinômio `0x1021`, valor inicial `0xFFFF`, sem
 * reflexão e sem XOR final. É o exigido pela especificação.
 */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Deixa o texto no subconjunto que os apps de banco aceitam sem sustos:
 * sem acento, sem caractere de controle, cortado no limite do campo.
 */
function normalizar(texto: string, limite: number): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limite);
}

/** O txid aceita só letras, números e alguns sinais; vazio vira `***`. */
function normalizarTxid(texto: string): string {
  const limpo = normalizar(texto, 25).replace(/[^A-Za-z0-9]/g, "");
  return limpo || "***";
}

/** Valor sempre com ponto e duas casas: `10.00`, nunca `10,00`. */
function formatarValor(valor: number): string {
  return valor.toFixed(2);
}

export function encodePix(content: PixContent): string {
  const chave = content.key.trim();

  // Conta 26: quem recebe. O GUI identifica o arranjo como sendo o Pix.
  const contaPartes = [campo("00", "br.gov.bcb.pix"), campo("01", chave)];
  const descricao = normalizar(content.description, 72);
  if (descricao) contaPartes.push(campo("02", descricao));

  const partes: string[] = [
    campo("00", "01"), // Payload Format Indicator
    campo("26", contaPartes.join("")), // Merchant Account Information
    campo("52", "0000"), // Merchant Category Code: não informado
    campo("53", "986"), // Moeda: BRL
  ];

  // Valor é opcional: sem ele, o pagador digita quanto quiser.
  if (content.amount != null && content.amount > 0) {
    partes.push(campo("54", formatarValor(content.amount)));
  }

  partes.push(
    campo("58", "BR"),
    campo("59", normalizar(content.merchantName, 25) || "NAO INFORMADO"),
    campo("60", normalizar(content.merchantCity, 15) || "SAO PAULO"),
    campo("62", campo("05", normalizarTxid(content.txid))),
  );

  const semCrc = `${partes.join("")}6304`;
  return semCrc + crc16(semCrc);
}
