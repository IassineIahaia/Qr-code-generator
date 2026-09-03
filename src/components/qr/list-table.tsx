import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
  buttonClasses,
} from "@/components/ui";
import { CopyButton } from "./copy-button";
import { StatusToggle } from "./status-toggle";
import { metaFor, summarizeContent } from "@/lib/qr/content";
import type { QrContent } from "@/lib/qr/content";
import type { ListResult, QrListRow } from "@/lib/qr/queries";

/**
 * A tabela da listagem. Server Component: nada aqui precisa de estado, e
 * renderizar 20 linhas no servidor é mais barato que hidratar 20 linhas no
 * browser.
 *
 * A única ilha de interatividade é o `StatusToggle` da coluna "Estado"
 * (item 5.1) — pausar da própria lista, sem abrir o código.
 */

const COLUNAS = 6;

export interface ListTableProps extends ListResult {
  /** Base dos links curtos, ex.: `https://qrpro.link`. */
  baseUrl: string;
  /** `true` quando há busca ou filtro ativo — muda o texto do estado vazio. */
  filtrando: boolean;
}

export function ListTable({
  rows,
  baseUrl,
  contaVazia,
  filtrando,
}: ListTableProps) {
  return (
    <TableWrap>
      <Table>
        <THead>
          <Tr static>
            <Th className="min-w-[220px]">Nome e link curto</Th>
            <Th className="w-[130px]">Tipo</Th>
            <Th className="min-w-[200px]">Destino</Th>
            <Th className="w-[110px] text-right">Leituras</Th>
            <Th className="w-[150px]">Última leitura</Th>
            <Th className="w-[190px]">Estado</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.length === 0 ? (
            <TdEmpty colSpan={COLUNAS}>
              {contaVazia ? (
                <div className="flex flex-col items-center gap-3">
                  <p>Você ainda não criou nenhum QR Code.</p>
                  <Link
                    href="/painel/criar"
                    className={buttonClasses("primary", "sm")}
                  >
                    Criar o primeiro
                  </Link>
                </div>
              ) : filtrando ? (
                <p>Nenhum código bate com esse filtro.</p>
              ) : (
                <p>Nada nesta página.</p>
              )}
            </TdEmpty>
          ) : (
            rows.map((row) => <Linha key={row.id} row={row} baseUrl={baseUrl} />)
          )}
        </TBody>
      </Table>
    </TableWrap>
  );
}

function Linha({ row, baseUrl }: { row: QrListRow; baseUrl: string }) {
  const meta = metaFor(row.type as Parameters<typeof metaFor>[0]);
  const linkCurto = `${baseUrl}/r/${row.slug}`;

  // Dinâmico: o destino é a coluna do banco, que pode mudar. Estático: o
  // conteúdo é o destino, e sai do JSON gravado.
  const destino = row.is_dynamic
    ? (row.destination ?? "—")
    : summarizeContent(row.content as unknown as QrContent);

  return (
    <Tr>
      <Td>
        <div className="flex flex-col gap-1">
          <Link
            href={`/painel/codigos/${row.id}`}
            className="font-medium text-on-surface transition-colors hover:text-primary"
          >
            {row.name}
          </Link>
          {row.is_dynamic ? (
            <span className="flex items-center gap-1">
              <code className="font-mono text-[12px] text-secondary">
                /r/{row.slug}
              </code>
              <CopyButton value={linkCurto} />
            </span>
          ) : (
            <span className="text-[12px] text-on-surface-variant">
              Estático — conteúdo gravado no código
            </span>
          )}
          {row.tags.length ? (
            <span className="flex flex-wrap gap-1 pt-0.5">
              {row.tags.slice(0, 3).map((t) => (
                <Chip key={t} className="px-1.5 py-0 text-[11px]">
                  {t}
                </Chip>
              ))}
              {row.tags.length > 3 ? (
                <span className="text-[11px] text-on-surface-variant">
                  +{row.tags.length - 3}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      </Td>

      <Td>
        <Chip tone={row.is_dynamic ? "brand" : "neutral"}>{meta.label}</Chip>
      </Td>

      <Td className="max-w-[280px]">
        <span className="flex items-center gap-1.5">
          <span
            className="truncate text-on-surface-variant"
            title={destino}
          >
            {destino}
          </span>
          {row.is_dynamic && row.destination ? (
            <a
              href={row.destination}
              target="_blank"
              rel="noreferrer noopener"
              title="Abrir destino em nova aba"
              className="shrink-0 text-on-surface-variant transition-colors hover:text-primary"
            >
              <ExternalLink size={13} />
            </a>
          ) : null}
        </span>
      </Td>

      <Td className="text-right">
        <span className="font-mono text-data text-on-surface">
          {row.scan_count.toLocaleString("pt-BR")}
        </span>
        <span className="block text-[11px] text-on-surface-variant">
          {row.unique_scan_count.toLocaleString("pt-BR")} únicas
        </span>
      </Td>

      <Td className="text-on-surface-variant">
        {row.last_scan_at ? (
          <time dateTime={row.last_scan_at}>{formatarData(row.last_scan_at)}</time>
        ) : (
          <span className="text-on-surface-variant/60">nunca</span>
        )}
      </Td>

      <Td>
        {/* Item 5.1: o switch é a intenção, o selo é o estado real. Num QR
            estático não há switch — não existe redirect nosso para pausar. */}
        <StatusToggle
          id={row.id}
          intencao={row.status}
          efetivo={row.qr_effective_status}
          desabilitado={!row.is_dynamic}
          comSelo
        />
      </Td>
    </Tr>
  );
}

/** Data curta no fuso do produto, estável entre servidor e cliente. */
function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
