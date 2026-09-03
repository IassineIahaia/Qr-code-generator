import { Laptop, Smartphone, Tablet, HelpCircle } from "lucide-react";
import {
  Chip,
  Table,
  TBody,
  TableWrap,
  Td,
  TdEmpty,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { rotuloPais } from "@/components/charts/quebra";
import type { LeituraRecente } from "@/lib/qr/analytics";
import { FUSO } from "@/lib/qr/status";

/**
 * As últimas leituras, uma por linha — item 7.4.
 *
 * **A tela do Stitch tinha uma coluna de IP; ela não existe aqui.** Não é
 * esquecimento: `scans` guarda `ip_hash`, nunca o endereço. Mostrar o hash
 * seria uma coluna de ruído, e guardar o IP cru só para poder exibi-lo
 * significaria trocar a privacidade de quem escaneia por decoração. O que o
 * dono realmente precisa saber — quando, de onde, em que aparelho — está
 * todo aqui.
 *
 * As tentativas bloqueadas aparecem junto com as bem-sucedidas, e essa é a
 * escolha central desta tabela: quando alguém pergunta "por que meu QR
 * parou de funcionar?", a resposta costuma estar nas linhas que *não* foram
 * entregues.
 */

const COLUNAS = 5;

export function ScansRecentes({ leituras }: { leituras: LeituraRecente[] }) {
  return (
    <TableWrap>
      <Table>
        <THead>
          <Tr static>
            <Th className="w-[150px]">Quando</Th>
            <Th className="w-[110px]">Desfecho</Th>
            <Th className="min-w-[160px]">Onde</Th>
            <Th className="min-w-[150px]">Aparelho</Th>
            <Th className="w-[120px]">Navegador</Th>
          </Tr>
        </THead>
        <TBody>
          {leituras.length === 0 ? (
            <TdEmpty colSpan={COLUNAS}>
              <p>Ninguém escaneou este código ainda.</p>
            </TdEmpty>
          ) : (
            leituras.map((l) => <Linha key={l.id} leitura={l} />)
          )}
        </TBody>
      </Table>
    </TableWrap>
  );
}

function Linha({ leitura }: { leitura: LeituraRecente }) {
  const local = [leitura.city, leitura.country ? rotuloPais(leitura.country) : null]
    .filter(Boolean)
    .join(", ");

  return (
    <Tr>
      <Td className="whitespace-nowrap">
        <time dateTime={leitura.created_at} className="text-on-surface">
          {quando(leitura.created_at)}
        </time>
      </Td>

      <Td>
        {leitura.outcome === "redirected" ? (
          <Chip tone="success">{leitura.is_unique ? "1ª leitura" : "Entregue"}</Chip>
        ) : leitura.outcome === "password_required" ? (
          <Chip tone="data">Senha</Chip>
        ) : (
          <Chip tone="danger">Bloqueada</Chip>
        )}
      </Td>

      <Td className="text-on-surface-variant">
        {local || <span className="text-on-surface-variant/60">não informado</span>}
      </Td>

      <Td className="text-on-surface-variant">
        <span className="flex items-center gap-2">
          <IconeDoAparelho tipo={leitura.device_type} />
          {leitura.os ?? "—"}
        </span>
      </Td>

      <Td className="text-on-surface-variant">{leitura.browser ?? "—"}</Td>
    </Tr>
  );
}

/**
 * O ícone do aparelho.
 *
 * É um componente, e não uma função que *devolve* o componente: escolher o
 * ícone e depois renderizá-lo como `<Icone />` cria um tipo novo a cada
 * render, e o React trata tipo novo como elemento novo — remonta em vez de
 * atualizar. Aqui o `switch` devolve o elemento já pronto.
 */
function IconeDoAparelho({ tipo }: { tipo: string | null }) {
  const props = { size: 14, className: "shrink-0", "aria-hidden": true };

  switch (tipo) {
    case "mobile":
      return <Smartphone {...props} />;
    case "tablet":
      return <Tablet {...props} />;
    case "desktop":
      return <Laptop {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
}

/**
 * "Hoje, 14:32" para o que é recente; data cheia para o resto.
 *
 * O corte é por dia do calendário em Brasília, não por "menos de 24 h": às
 * 9h da manhã, uma leitura das 23h de ontem é *ontem*, não "há 10 horas".
 */
function quando(iso: string): string {
  const data = new Date(iso);
  const hoje = diaEmBrasilia(new Date());
  const dia = diaEmBrasilia(data);

  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  }).format(data);

  if (dia === hoje) return `Hoje, ${hora}`;

  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  if (dia === diaEmBrasilia(ontem)) return `Ontem, ${hora}`;

  const curta = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: FUSO,
  }).format(data);

  return `${curta}, ${hora}`;
}

function diaEmBrasilia(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FUSO,
  }).format(data);
}
