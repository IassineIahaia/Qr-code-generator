"use client";

import { Menu, Search } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";

/**
 * A barra de cima — item 8.3.
 *
 * O campo de busca é um **botão**, não um `<input>`. No desenho do Stitch
 * ele parece um campo, e a tentação é fazer um de verdade; mas o que ele
 * abre é a paleta, com teclado próprio e resultados de duas naturezas. Um
 * input que perde o foco para outro input no instante seguinte é um truque
 * que quebra em leitor de tela e no celular (o teclado virtual sobe duas
 * vezes). Aqui ele se anuncia pelo que é.
 *
 * **O que não está aqui:** o sino de notificações e a grade de aplicativos
 * do desenho. Notificação é a fase 9.5 e não existe ainda — um sino que
 * nunca toca ensina a ignorá-lo, e um com bolinha vermelha falsa é pior.
 */
export function Topbar({
  onAbrirBusca,
  onAbrirMenu,
  usuario,
}: {
  onAbrirBusca: () => void;
  onAbrirMenu: () => void;
  usuario: { nome: string | null; email: string | null; avatarUrl?: string | null };
}) {
  return (
    <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-margin-mobile md:px-gutter">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
          className="rounded-control p-2 text-on-surface-variant transition-colors hover:text-on-surface lg:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>

        <button
          type="button"
          onClick={onAbrirBusca}
          className="group flex h-9 w-full max-w-xs items-center gap-2.5 rounded-control border border-hairline bg-base px-3 text-left transition-colors hover:border-hairline-strong"
        >
          <Search
            size={16}
            className="shrink-0 text-on-surface-variant transition-colors group-hover:text-primary"
            aria-hidden
          />
          <span className="flex-1 truncate text-body text-on-surface-variant/60">
            Buscar QR Codes...
          </span>
          {/* `hidden sm:flex`: no celular não há ⌘K para anunciar. */}
          <span className="hidden shrink-0 gap-1 sm:flex">
            <Tecla>⌘</Tecla>
            <Tecla>K</Tecla>
          </span>
        </button>
      </div>

      <UserMenu
        name={usuario.nome}
        email={usuario.email}
        avatarUrl={usuario.avatarUrl}
      />
    </header>
  );
}

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-hairline bg-surface-variant px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant">
      {children}
    </kbd>
  );
}
