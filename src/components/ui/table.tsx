import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/** Moldura da tabela: borda, raio e rolagem horizontal própria. */
export function TableWrap({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-hairline bg-surface",
        className,
      )}
      {...props}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn(
        "w-full min-w-[900px] border-collapse text-left text-[13px]",
        className,
      )}
      {...props}
    />
  );
}

export function THead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-hairline bg-surface-low/50", className)}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Coluna ordenável: indica a direção atual. */
  sort?: "asc" | "desc" | false;
}

export function Th({ className, sort, children, ...props }: ThProps) {
  return (
    <th
      scope="col"
      aria-sort={
        sort === "asc"
          ? "ascending"
          : sort === "desc"
            ? "descending"
            : sort === false
              ? "none"
              : undefined
      }
      className={cn(
        "px-4 py-3 text-[12px] font-medium tracking-wider text-on-surface-variant uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Realce discreto quando a linha está selecionada. */
  selected?: boolean;
  /** Desliga o hover (linhas de rodapé, estados vazios). */
  static?: boolean;
}

export function Tr({
  className,
  selected,
  static: isStatic,
  ...props
}: TrProps) {
  return (
    <tr
      data-selected={selected || undefined}
      className={cn(
        "group border-b border-hairline last:border-0",
        !isStatic && "transition-colors duration-200 hover:bg-elevated",
        selected && "bg-elevated/60",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}

/** Célula que ocupa a tabela inteira — estado vazio ou carregando. */
export function TdEmpty({
  colSpan,
  className,
  children,
}: {
  colSpan: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          "px-4 py-16 text-center text-on-surface-variant",
          className,
        )}
      >
        {children}
      </td>
    </tr>
  );
}
