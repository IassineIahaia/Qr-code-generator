"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AmbientOrbs } from "@/components/ui";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * A moldura do painel — item 8.3.
 *
 * Vive no `layout.tsx` do `/painel`, então sobrevive à navegação entre as
 * telas: a sidebar não repinta ao trocar de página, e a paleta aberta não
 * some no meio de um `router.push`.
 *
 * **Por que é client component.** Três coisas aqui têm estado que não cabe
 * no servidor: a gaveta do celular, a paleta e o item aceso da navegação.
 * O conteúdo continua sendo Server Component — ele entra por `children`,
 * renderizado no servidor e passado pronto. Ser client aqui não arrasta as
 * páginas junto.
 */
export function AppShell({
  children,
  usuario,
}: {
  children: React.ReactNode;
  usuario: { nome: string | null; email: string | null; avatarUrl?: string | null };
}) {
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const pathname = usePathname();

  // ⌘K no Mac, Ctrl+K no resto. A barra `/` também abre, como em quase todo
  // app de teclado — mas só quando ninguém está digitando em outro campo,
  // senão escrever "https://" numa URL abriria a paleta duas vezes.
  useEffect(() => {
    function onKeyDown(evento: KeyboardEvent) {
      const digitando =
        evento.target instanceof HTMLElement &&
        (evento.target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(evento.target.tagName));

      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        setPaletaAberta((a) => !a);
        return;
      }
      if (evento.key === "/" && !digitando && !paletaAberta) {
        evento.preventDefault();
        setPaletaAberta(true);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [paletaAberta]);

  // Trocar de tela fecha a gaveta. Clicar num link dela já fecha pelo
  // `onNavegar`; o que sobra é o botão Voltar do navegador, que trocaria a
  // tela por baixo do menu aberto. É ajuste de estado durante o render (o
  // padrão do React para "derivar de uma prop que mudou"), e não um efeito:
  // fechar não é sincronizar nada com o mundo de fora.
  const [pathAnterior, setPathAnterior] = useState(pathname);
  if (pathAnterior !== pathname) {
    setPathAnterior(pathname);
    setGavetaAberta(false);
  }

  return (
    <div className="min-h-screen">
      <AmbientOrbs />

      {/* ---------- coluna fixa, do laptop para cima ---------- */}
      <aside className="fixed top-0 left-0 z-50 hidden h-screen w-sidebar border-r border-hairline bg-surface lg:block">
        <Sidebar />
      </aside>

      {/* ---------- gaveta do celular ---------- */}
      {gavetaAberta ? (
        <div className="fixed inset-0 z-60 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setGavetaAberta(false)}
            aria-hidden
          />
          <aside
            role="dialog"
            aria-modal
            aria-label="Menu"
            className="relative h-full w-sidebar max-w-[85vw] border-r border-hairline bg-surface"
          >
            <button
              type="button"
              onClick={() => setGavetaAberta(false)}
              aria-label="Fechar menu"
              className="absolute top-4 right-3 z-10 rounded-control p-2 text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <X size={18} aria-hidden />
            </button>
            <Sidebar onNavegar={() => setGavetaAberta(false)} />
          </aside>
        </div>
      ) : null}

      {/* ---------- conteúdo ---------- */}
      <div className="relative z-10 lg:ml-sidebar">
        <Topbar
          usuario={usuario}
          onAbrirBusca={() => setPaletaAberta(true)}
          onAbrirMenu={() => setGavetaAberta(true)}
        />
        <main className="mx-auto flex max-w-app flex-col gap-stack-lg px-margin-mobile py-stack-lg md:px-gutter">
          {children}
        </main>
      </div>

      {/* Montada só enquanto aberta: é o que garante que ela sempre abra
          limpa, sem nenhum código para "resetar". */}
      {paletaAberta ? (
        <CommandPalette onFechar={() => setPaletaAberta(false)} />
      ) : null}
    </div>
  );
}
