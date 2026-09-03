/**
 * Gerador de PDF de uma página com uma imagem.
 *
 * Escrito à mão de propósito: as bibliotecas de PDF do ecossistema pesam
 * centenas de kB e aqui só precisamos de um caso — uma imagem numa página.
 * O PDF resultante é um arquivo válido pela especificação 1.4.
 *
 * A compressão usa `CompressionStream("deflate")`, que produz o formato
 * zlib (RFC 1950) — exatamente o que o filtro `FlateDecode` espera.
 */

const encoder = new TextEncoder();

function bytes(texto: string) {
  return encoder.encode(texto);
}

async function deflate(dados: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([dados as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * PDF não aceita PNG nem canal alfa: converte para RGB puro, achatando
 * qualquer transparência sobre a cor de fundo informada.
 */
function toRgb(
  imageData: ImageData,
  fundo: [number, number, number],
): Uint8Array {
  const { data, width, height } = imageData;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    const alpha = data[i + 3] / 255;
    rgb[j] = Math.round(data[i] * alpha + fundo[0] * (1 - alpha));
    rgb[j + 1] = Math.round(data[i + 1] * alpha + fundo[1] * (1 - alpha));
    rgb[j + 2] = Math.round(data[i + 2] * alpha + fundo[2] * (1 - alpha));
  }
  return rgb;
}

export interface PdfOptions {
  /** Resolução usada para converter pixels em pontos. 300 é padrão gráfico. */
  dpi?: number;
  /** Cor sob a transparência, em RGB 0–255. */
  background?: [number, number, number];
}

/** Monta um PDF de uma página contendo exatamente a imagem do canvas. */
export async function canvasToPdf(
  canvas: HTMLCanvasElement,
  { dpi = 300, background = [255, 255, 255] }: PdfOptions = {},
): Promise<Blob> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas sem contexto 2D.");

  const { width, height } = canvas;
  const rgb = toRgb(ctx.getImageData(0, 0, width, height), background);
  const comprimido = await deflate(rgb);

  // 1 ponto PDF = 1/72 de polegada.
  const larguraPt = (width / dpi) * 72;
  const alturaPt = (height / dpi) * 72;

  const partes: Uint8Array[] = [];
  const offsets: number[] = [];
  let posicao = 0;

  const escrever = (dados: Uint8Array | string) => {
    const buf = typeof dados === "string" ? bytes(dados) : dados;
    partes.push(buf);
    posicao += buf.length;
  };

  /** Marca onde cada objeto começa — a tabela xref precisa dos bytes exatos. */
  const abrirObjeto = (n: number) => {
    offsets[n] = posicao;
    escrever(`${n} 0 obj\n`);
  };

  const conteudo = `q ${larguraPt.toFixed(4)} 0 0 ${alturaPt.toFixed(4)} 0 0 cm /Im0 Do Q\n`;

  escrever("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  abrirObjeto(1);
  escrever("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  abrirObjeto(2);
  escrever("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  abrirObjeto(3);
  escrever(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${larguraPt.toFixed(4)} ${alturaPt.toFixed(4)}]` +
      ` /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  );

  abrirObjeto(4);
  escrever(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height}` +
      ` /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode` +
      ` /Length ${comprimido.length} >>\nstream\n`,
  );
  escrever(comprimido);
  escrever("\nendstream\nendobj\n");

  abrirObjeto(5);
  escrever(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}endstream\nendobj\n`);

  const inicioXref = posicao;
  const total = 6; // objetos 1..5 mais a entrada livre 0
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) {
    xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  escrever(xref);
  escrever(
    `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`,
  );

  return new Blob(partes as BlobPart[], { type: "application/pdf" });
}
