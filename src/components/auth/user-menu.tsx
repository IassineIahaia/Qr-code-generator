"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export interface UserMenuProps {
  name: string | null;
  email: string | null;
  avatarUrl?: string | null;
}

/** Avatar + menu com acesso à conta e ao logout. */
export function UserMenu({ name, email, avatarUrl }: UserMenuProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou no Esc — sem isso o menu fica preso aberto.
  useEffect(() => {
    if (!aberto) return;

    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setAberto(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [aberto]);

  const rotulo = name || email || "Conta";
  const iniciais = (name || email || "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        // O avatar é só imagem e as iniciais são decorativas: sem isto o
        // leitor de tela anuncia "botão" e mais nada.
        aria-label={`Conta de ${rotulo}`}
        className={cn(
          "flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 transition-colors",
          "hover:border-hairline hover:bg-surface-high",
          aberto && "border-hairline bg-surface-high",
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar externo, sem domínio fixo para o next/image
          <img
            src={avatarUrl}
            alt=""
            className="size-8 rounded-full border border-hairline object-cover"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-highest text-[12px] font-medium text-on-surface">
            {iniciais}
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            "text-on-surface-variant transition-transform",
            aberto && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {aberto ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-card border border-hairline bg-elevated shadow-float"
        >
          <div className="flex flex-col gap-0.5 border-b border-hairline px-3 py-3">
            <span className="truncate text-label text-on-surface">{rotulo}</span>
            {email && email !== rotulo ? (
              <span className="truncate font-mono text-[11px] text-on-surface-variant">
                {email}
              </span>
            ) : null}
          </div>

          {/* Um item só, e não "Minha conta" + "Configurações" como antes:
              os dois apontavam para rotas que não existiam (dois 404 vivos),
              e não há duas telas a separar — perfil, senha e sessão moram
              todos na mesma. */}
          <div className="flex flex-col p-1">
            <Link
              href="/painel/configuracoes"
              role="menuitem"
              onClick={() => setAberto(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-label text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface"
            >
              <Settings size={16} aria-hidden />
              Configurações da conta
            </Link>
          </div>

          <form action={signOut} className="border-t border-hairline p-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-label text-on-surface-variant transition-colors hover:bg-error-container/20 hover:text-error"
            >
              <LogOut size={16} aria-hidden />
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
