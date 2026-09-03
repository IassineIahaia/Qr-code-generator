import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Paginação por link, não por botão: cada página é um endereço de verdade,
 * então dá para abrir em nova aba, marcar como favorito e voltar pelo
 * histórico do navegador.
 */
export function ListPagination({
  page,
  totalPages,
  total,
  perPage,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  /** Os `searchParams` atuais, para preservar busca e filtros no link. */
  params: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  function href(destino: number) {
    const sp = new URLSearchParams();
    for (const [chave, valor] of Object.entries(params)) {
      const v = Array.isArray(valor) ? valor[0] : valor;
      if (v && chave !== "pagina") sp.set(chave, v);
    }
    if (destino > 1) sp.set("pagina", String(destino));
    const qs = sp.toString();
    return qs ? `?${qs}` : "?";
  }

  const primeiro = (page - 1) * perPage + 1;
  const ultimo = Math.min(page * perPage, total);

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-4"
    >
      <span className="text-[12px] text-on-surface-variant">
        {primeiro}–{ultimo} de {total}
      </span>

      <div className="flex items-center gap-2">
        <Pagina
          para={href(page - 1)}
          desabilitado={page <= 1}
          rotulo="Página anterior"
        >
          <ChevronLeft size={16} />
          Anterior
        </Pagina>

        <span className="px-1 font-mono text-[12px] text-on-surface-variant">
          {page} / {totalPages}
        </span>

        <Pagina
          para={href(page + 1)}
          desabilitado={page >= totalPages}
          rotulo="Próxima página"
        >
          Próxima
          <ChevronRight size={16} />
        </Pagina>
      </div>
    </nav>
  );
}

function Pagina({
  para,
  desabilitado,
  rotulo,
  children,
}: {
  para: string;
  desabilitado: boolean;
  rotulo: string;
  children: React.ReactNode;
}) {
  const classes = buttonClasses("secondary", "sm");

  // Um `<a>` desabilitado não existe em HTML: quando não há para onde ir, o
  // elemento vira um `<span>` fora da ordem de tabulação.
  if (desabilitado) {
    return (
      <span
        aria-disabled="true"
        className={cn(classes, "pointer-events-none opacity-40")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={para} aria-label={rotulo} className={classes}>
      {children}
    </Link>
  );
}
