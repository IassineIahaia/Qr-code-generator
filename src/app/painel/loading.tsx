import {
  SkeletonCabecalho,
  SkeletonCard,
  SkeletonKpis,
  SkeletonPagina,
} from "@/components/ui";

/**
 * O painel carregando — item 8.5.
 *
 * A forma imita a tela pronta: saudação, quatro KPIs, o gráfico grande com
 * o ranking ao lado, e as duas quebras embaixo. É o que impede o pulo de
 * layout quando os números chegam.
 *
 * Ele aparece só na parte de dentro: o `layout.tsx` já desenhou a sidebar e
 * a topbar, e elas não recarregam. Quem navega pelo menu vê a moldura firme
 * e só o miolo trocando — que é o ganho de ter um shell.
 */
export default function CarregandoPainel() {
  return (
    <SkeletonPagina rotulo="Carregando o painel">
      <SkeletonCabecalho />
      <SkeletonKpis />
      <div className="grid gap-stack-md xl:grid-cols-[2fr_1fr]">
        <SkeletonCard altura="h-64" />
        <SkeletonCard altura="h-64" />
      </div>
      <div className="grid gap-stack-md md:grid-cols-2">
        <SkeletonCard altura="h-40" />
        <SkeletonCard altura="h-40" />
      </div>
    </SkeletonPagina>
  );
}
