import {
  Skeleton,
  SkeletonCabecalho,
  SkeletonCard,
  SkeletonKpis,
  SkeletonPagina,
} from "@/components/ui";

/**
 * O detalhe de um código carregando — item 8.5.
 *
 * Esta é a tela que mais espera: são três leituras em paralelo (histórico,
 * agregações e últimas leituras) além do próprio código. Por isso o
 * skeleton reproduz as duas colunas — sem ele, a coluna da direita entraria
 * depois e empurraria tudo.
 */
export default function CarregandoDetalhe() {
  return (
    <SkeletonPagina rotulo="Carregando o QR Code">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <SkeletonCabecalho comSubtitulo={false} />
      </div>

      <div className="grid gap-stack-md lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-stack-md">
          <SkeletonCard altura="h-40" />
          <SkeletonCard altura="h-24" />
          <SkeletonCard altura="h-56" />
        </div>
        <div className="flex flex-col gap-stack-md">
          <SkeletonCard altura="h-56" />
          <SkeletonCard altura="h-32" />
        </div>
      </div>

      <SkeletonKpis />
      <div className="grid gap-stack-md xl:grid-cols-[2fr_1fr]">
        <SkeletonCard altura="h-64" />
        <SkeletonCard altura="h-64" />
      </div>
    </SkeletonPagina>
  );
}
