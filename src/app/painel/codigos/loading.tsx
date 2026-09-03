import {
  Skeleton,
  SkeletonPagina,
  SkeletonTabela,
} from "@/components/ui";

/** A listagem carregando — item 8.5. */
export default function CarregandoCodigos() {
  return (
    <SkeletonPagina rotulo="Carregando seus QR Codes">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-36 rounded-control" />
      </div>
      {/* A barra de filtros: busca larga e três seletores. */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 basis-64" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-44" />
      </div>
      <SkeletonTabela />
    </SkeletonPagina>
  );
}
