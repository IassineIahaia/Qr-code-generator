import { Skeleton, SkeletonCabecalho, SkeletonCard, SkeletonPagina } from "@/components/ui";

/** O assistente de criação carregando — item 8.5. */
export default function CarregandoCriar() {
  return (
    <SkeletonPagina rotulo="Carregando o assistente">
      <SkeletonCabecalho />
      {/* Os três passos do topo do assistente. */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="grid gap-stack-md lg:grid-cols-[1fr_340px]">
        <SkeletonCard altura="h-72" />
        <SkeletonCard altura="h-64" />
      </div>
    </SkeletonPagina>
  );
}
