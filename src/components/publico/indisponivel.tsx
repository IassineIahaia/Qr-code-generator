import { QrCode, ScanLine } from "lucide-react";
import { AmbientOrbs } from "@/components/ui";

/**
 * A tela que quem escaneou vê quando o código não abre — itens 6.4 a 6.6.
 *
 * Ela fala com um estranho, no meio da rua, olhando o celular. Por isso não
 * há jargão nem número: nada de "limite de scans atingido" ou "status
 * paused". Ela diz o que aconteceu e some — sem menu, sem botão de tentar
 * de novo (não adiantaria) e sem convite para criar uma conta, que seria
 * transformar a frustração de alguém em anúncio.
 *
 * Baseada em `Design/p_gina_p_blica_indispon_vel/`.
 */

export interface IndisponivelProps {
  titulo: string;
  detalhe: string;
  /** Recado que o dono escreveu para esta situação (item 6.6). */
  recadoDoDono?: string | null;
}

export function Indisponivel({
  titulo,
  detalhe,
  recadoDoDono,
}: IndisponivelProps) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-base px-margin-mobile">
      <AmbientOrbs />

      <main className="relative z-10 flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-stack-lg py-stack-lg text-center">
        <span className="relative flex size-24 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
          <ScanLine size={44} strokeWidth={1} className="text-on-surface-variant" aria-hidden />
        </span>

        <div className="flex flex-col items-center gap-stack-sm">
          <h1 className="max-w-[300px] font-display text-headline text-on-surface">
            {titulo}
          </h1>
          <p className="max-w-[320px] text-body text-on-surface-variant">
            {detalhe}
          </p>
        </div>

        {recadoDoDono ? (
          <p className="max-w-[340px] rounded-card border border-hairline bg-surface-container/60 px-4 py-3 text-body text-on-surface backdrop-blur-md">
            {recadoDoDono}
          </p>
        ) : null}

        <span className="h-px w-16 bg-outline-variant/30" aria-hidden />
      </main>

      <footer className="relative z-10 flex w-full flex-col items-center gap-2 border-t border-outline-variant/30 py-stack-lg">
        <span className="flex items-center gap-2 text-on-surface-variant opacity-80">
          <QrCode size={16} aria-hidden />
          <span className="text-caption">Protegido por QR Generator Pro</span>
        </span>
      </footer>
    </div>
  );
}
