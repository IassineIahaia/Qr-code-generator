"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVEGACAO, estaAtivo, type ItemDeNavegacao } from "./nav";

/**
 * A coluna da esquerda — item 8.3.
 *
 * Client component pelo `usePathname`: o item aceso precisa mudar quando a
 * navegação acontece no cliente, e um Server Component só saberia disso
 * recarregando a página.
 *
 * No celular ela não existe como coluna; vira gaveta, controlada pelo
 * `AppShell`. Por isso `onNavegar`: quem abriu a gaveta precisa fechá-la
 * quando o link é clicado, senão a pessoa troca de tela e continua olhando
 * para o menu.
 */
export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-stack-md p-stack-md">
      <Link
        href="/painel"
        onClick={onNavegar}
        className="mb-2 flex items-center gap-3 rounded-control px-3 py-4 transition-opacity hover:opacity-80"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-brand-gradient">
          <QrCode size={18} className="text-white" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-display text-body-lg font-bold text-on-surface">
            QR Generator Pro
          </span>
          <span className="text-caption text-on-surface-variant">
            Controle de ponta a ponta
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAVEGACAO.map((item) => (
          <ItemNav
            key={item.href}
            item={item}
            ativo={estaAtivo(item, pathname)}
            onNavegar={onNavegar}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-hairline pt-4">
        <Link
          href="/painel/criar"
          onClick={onNavegar}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-4 py-2 text-label font-medium text-white shadow-brand transition-all hover:brightness-110"
        >
          <Plus size={16} aria-hidden />
          Criar QR Code
        </Link>
      </div>
    </div>
  );
}

function ItemNav({
  item,
  ativo,
  onNavegar,
}: {
  item: ItemDeNavegacao;
  ativo: boolean;
  onNavegar?: () => void;
}) {
  const Icone = item.icon;

  const conteudo = (
    <>
      <Icone size={20} className="shrink-0" aria-hidden />
      <span className="truncate text-label">{item.label}</span>
    </>
  );

  // Um item que ainda não existe é `<span>`, não `<a>`: sem href não há o
  // que o teclado ou o leitor de tela possam ativar, e é essa a verdade.
  if (item.emBreve) {
    return (
      <span
        aria-disabled
        title={`Em breve — fase ${item.emBreve}`}
        className="flex cursor-default items-center gap-3 rounded-control px-3 py-2 text-on-surface-variant/40"
      >
        {conteudo}
        <span className="ml-auto shrink-0 rounded-full border border-hairline px-1.5 py-0.5 text-[10px] text-on-surface-variant/50">
          em breve
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavegar}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-control px-3 py-2 transition-colors duration-200",
        ativo
          ? "bg-surface-highest font-semibold text-primary"
          : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
      )}
    >
      {conteudo}
    </Link>
  );
}
