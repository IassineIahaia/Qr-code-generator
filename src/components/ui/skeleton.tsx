import { cn } from "@/lib/utils";

/**
 * O bloco cinza que ocupa o lugar do conteúdo enquanto ele não chega —
 * item 8.5.
 *
 * **Por que skeleton e não um spinner.** As telas do painel são leituras do
 * Supabase que levam de 200 ms a 2 s conforme a conexão. Um spinner no meio
 * da tela apaga a página inteira e não diz nada; o skeleton mantém a forma
 * do que vem, então o layout não pula quando os dados chegam e a pessoa já
 * sabe onde olhar.
 *
 * A animação é `pulse`, e ela some sozinha para quem pediu menos movimento —
 * o `prefers-reduced-motion` do `globals.css` zera a duração. Nesse caso o
 * bloco fica parado, o que continua sendo a informação certa: "aqui vem
 * alguma coisa".
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // `aria-hidden`: quem usa leitor de tela não ganha nada ouvindo doze
      // caixas vazias. O aviso de carregamento é dado uma vez só, pelo
      // `SkeletonPagina` abaixo.
      aria-hidden
      className={cn(
        "animate-pulse rounded-control bg-surface-highest/60",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A moldura de uma tela carregando.
 *
 * Anuncia uma vez, em texto, que a página está carregando — é o que um
 * leitor de tela precisa ouvir, e é tudo o que ele precisa ouvir.
 */
export function SkeletonPagina({
  children,
  rotulo = "Carregando",
}: {
  children: React.ReactNode;
  rotulo?: string;
}) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-stack-lg">
      <span className="sr-only">{rotulo}</span>
      {children}
    </div>
  );
}

/** Uma fileira de cartões de número — o topo de quase toda tela do painel. */
export function SkeletonKpis({ quantos = 4 }: { quantos?: number }) {
  return (
    <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: quantos }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-card border border-hairline bg-surface-container p-stack-md"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Um card com cabeçalho e corpo — gráfico, lista, o que for. */
export function SkeletonCard({
  altura = "h-64",
  className,
}: {
  altura?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-card border border-hairline bg-surface-container",
        className,
      )}
    >
      <div className="flex flex-col gap-2 border-b border-hairline p-stack-md">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
      <div className="p-stack-md">
        <Skeleton className={cn("w-full", altura)} />
      </div>
    </div>
  );
}

/** Linhas de tabela. */
export function SkeletonTabela({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-surface-container">
      <div className="border-b border-hairline p-stack-md">
        <Skeleton className="h-3 w-32" />
      </div>
      {Array.from({ length: linhas }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-hairline p-stack-md last:border-0"
        >
          <Skeleton className="size-9 shrink-0 rounded-control" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-48 max-w-full" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          <Skeleton className="hidden h-3 w-12 md:block" />
        </div>
      ))}
    </div>
  );
}

/** O cabeçalho de página: título e, às vezes, uma linha de apoio. */
export function SkeletonCabecalho({ comSubtitulo = true }: { comSubtitulo?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-64 max-w-full" />
      {comSubtitulo ? <Skeleton className="h-4 w-80 max-w-full" /> : null}
    </div>
  );
}
