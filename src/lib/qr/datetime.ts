import { FUSO } from "./status";

/**
 * Conversão entre o que a pessoa digita e o instante que vai para o banco
 * — item 5.3.
 *
 * O `<input type="datetime-local">` devolve um horário de parede sem fuso
 * ("10/09/2026 às 14:30") e o browser o interpreta no fuso da máquina. Isso
 * quebraria a promessa do produto: o dono de uma loja em São Paulo que
 * agenda "14:30" enquanto viaja para Lisboa veria o código entrar no ar às
 * 10:30 da manhã brasileira.
 *
 * Então fixamos o fuso: **o que se digita é sempre horário de Brasília**,
 * onde quer que o browser esteja. Estas funções fazem a ida e a volta.
 */

/** Extrai o horário de parede de um instante, num fuso qualquer. */
function partesNoFuso(instante: Date, fuso: string) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instante);

  const pega = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? "0");

  return {
    ano: pega("year"),
    mes: pega("month"),
    dia: pega("day"),
    hora: pega("hour"),
    minuto: pega("minute"),
    segundo: pega("second"),
  };
}

/**
 * Quanto o fuso está adiantado em relação ao UTC, naquele instante.
 * Negativo no Brasil (−3 h). Calculado, não fixado: se o horário de verão
 * voltar, o número muda sozinho.
 */
function deslocamentoMs(instante: Date, fuso: string): number {
  const p = partesNoFuso(instante, fuso);
  const comoSeFosseUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return comoSeFosseUtc - instante.getTime();
}

/**
 * `"2026-09-10T14:30"` (horário de Brasília) → ISO em UTC.
 *
 * Devolve `null` para entrada vazia ou malformada — o campo é opcional, e um
 * `Invalid Date` indo para o banco seria pior que um `null`.
 */
export function deHorarioBrasilia(parede: string): string | null {
  const limpo = parede.trim();
  if (!limpo) return null;

  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(limpo);
  if (!m) return null;

  const [, ano, mes, dia, hora, minuto, segundo] = m;
  const comoUtc = Date.UTC(
    Number(ano),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo ?? "0"),
  );
  if (!Number.isFinite(comoUtc)) return null;

  // Primeiro chute: subtrai o deslocamento medido no próprio instante-UTC.
  // A segunda passada corrige o caso de a data cair perto de uma virada de
  // horário de verão, quando o deslocamento do chute difere do real.
  let t = comoUtc - deslocamentoMs(new Date(comoUtc), FUSO);
  t = comoUtc - deslocamentoMs(new Date(t), FUSO);

  return new Date(t).toISOString();
}

/** ISO em UTC → `"2026-09-10T14:30"` para preencher o `datetime-local`. */
export function paraHorarioBrasilia(iso: string | null): string {
  if (!iso) return "";
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return "";

  const p = partesNoFuso(instante, FUSO);
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${p.ano}-${dois(p.mes)}-${dois(p.dia)}T${dois(p.hora)}:${dois(p.minuto)}`;
}

/** Agora, no formato do `datetime-local` — serve de `min` nos campos. */
export function agoraBrasilia(): string {
  return paraHorarioBrasilia(new Date().toISOString());
}
