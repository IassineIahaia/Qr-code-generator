"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Plus, Search, X } from "lucide-react";
import { StatusPill } from "@/components/ui";
import { buscarCodigos } from "@/lib/qr/actions";
import type { QrEncontrado } from "@/lib/qr/queries";
import { cn } from "@/lib/utils";
import { NAVEGACAO } from "./nav";

/**
 * A paleta ⌘K — item 8.3.
 *
 * Duas listas numa só: os **comandos** (ir para uma tela, criar um código),
 * que existem sempre, e os **códigos** que casam com o que se digitou, que
 * chegam do servidor. A ordem é essa porque o teclado percorre de cima para
 * baixo, e "ir para Meus QR Codes" é o que se quer nove em cada dez vezes
 * que a paleta abre sem termo nenhum.
 *
 * **O componente só existe enquanto está aberto** — quem o monta é o
 * `AppShell`, condicionalmente. É o que dispensa qualquer código para
 * "limpar ao abrir": o estado nasce vazio porque o componente nasce junto.
 *
 * A busca sai a partir de 2 caracteres e com 180 ms de espera. Não é um
 * número mágico: é o tempo em que quem digita rápido termina uma palavra,
 * e sem ele cada tecla vira uma ida ao Postgres.
 */

const MINIMO = 2;
const ESPERA_MS = 180;

/** Uma linha da paleta, já achatada — comando ou código, tanto faz. */
interface Linha {
  chave: string;
  rotulo: string;
  detalhe?: string;
  href: string;
  status?: QrEncontrado["qr_effective_status"];
  icone?: React.ReactNode;
}

export function CommandPalette({ onFechar }: { onFechar: () => void }) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [indice, setIndice] = useState(0);
  /**
   * O resultado carrega **o termo que o gerou**. É o que faz "buscando" ser
   * derivado em vez de mais um `useState`: se o termo digitado não é o do
   * resultado em mãos, a busca está em voo. Um booleano separado seria uma
   * segunda verdade sobre a mesma coisa, e as duas sairiam de sincronia no
   * primeiro caso de borda.
   */
  const [resultado, setResultado] = useState<{ termo: string; itens: QrEncontrado[] }>({
    termo: "",
    itens: [],
  });

  const alvo = termo.trim();
  const buscando = alvo.length >= MINIMO && resultado.termo !== alvo;

  useEffect(() => {
    const busca = termo.trim();
    if (busca.length < MINIMO || busca === resultado.termo) return;

    // `cancelado` evita o clássico: duas buscas em voo, a lenta chega
    // depois da rápida e a tela mostra o resultado do termo antigo.
    let cancelado = false;
    const timer = setTimeout(async () => {
      const itens = await buscarCodigos(busca);
      if (!cancelado) setResultado({ termo: busca, itens });
    }, ESPERA_MS);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termo, resultado.termo]);

  const filtro = alvo.toLowerCase();

  const comandos: Linha[] = [
    {
      chave: "criar",
      rotulo: "Criar QR Code",
      detalhe: "conteúdo, design e regras",
      href: "/painel/criar",
      icone: <Plus size={16} aria-hidden />,
    },
    ...NAVEGACAO.filter((item) => !item.emBreve).map((item) => ({
      chave: item.href,
      rotulo: `Ir para ${item.label}`,
      href: item.href,
      icone: <item.icon size={16} aria-hidden />,
    })),
  ].filter((linha) => !filtro || linha.rotulo.toLowerCase().includes(filtro));

  // Só os resultados do termo atual. Os do anterior somem no instante em que
  // a pessoa digita mais uma letra — mostrar resposta velha para pergunta
  // nova é pior do que mostrar nada.
  const encontrados: Linha[] =
    resultado.termo === alvo
      ? resultado.itens.map((qr) => ({
          chave: qr.id,
          rotulo: qr.name,
          detalhe: `/${qr.slug}`,
          href: `/painel/codigos/${qr.id}`,
          status: qr.qr_effective_status,
        }))
      : [];

  const linhas = [...comandos, ...encontrados];
  const selecionada = linhas[Math.min(indice, linhas.length - 1)];

  function ir(linha: Linha | undefined) {
    if (!linha) return;
    onFechar();
    router.push(linha.href);
  }

  function onKeyDown(evento: React.KeyboardEvent) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      onFechar();
      return;
    }
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndice((i) => (linhas.length ? (i + 1) % linhas.length : 0));
      return;
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndice((i) =>
        linhas.length ? (i - 1 + linhas.length) % linhas.length : 0,
      );
      return;
    }
    if (evento.key === "Enter") {
      evento.preventDefault();
      // Sem nada selecionado, o Enter leva à busca completa: o termo vira
      // filtro da listagem, que sabe paginar e ordenar.
      if (selecionada) ir(selecionada);
      else if (alvo) {
        onFechar();
        router.push(`/painel/codigos?q=${encodeURIComponent(alvo)}`);
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center p-4 pt-[12vh]"
      role="presentation"
      onMouseDown={onFechar}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" aria-hidden />

      <div
        role="dialog"
        aria-modal
        aria-label="Buscar e navegar"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="relative w-full max-w-xl overflow-hidden rounded-modal border border-hairline bg-elevated shadow-float"
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4">
          <Search
            size={18}
            className="shrink-0 text-on-surface-variant"
            aria-hidden
          />
          <input
            autoFocus
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setIndice(0);
            }}
            placeholder="Buscar QR Codes ou ir para..."
            aria-label="Buscar QR Codes ou ir para uma tela"
            className="h-14 flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/50"
          />
          {buscando ? (
            <span className="text-caption text-on-surface-variant">buscando…</span>
          ) : null}
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-control p-1 text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {linhas.length === 0 ? (
            <p className="px-3 py-6 text-center text-label text-on-surface-variant">
              {buscando
                ? "Procurando…"
                : "Nada com esse nome. Enter busca na lista completa."}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {linhas.map((linha, i) => (
                <li key={linha.chave}>
                  <button
                    type="button"
                    onMouseEnter={() => setIndice(i)}
                    onClick={() => ir(linha)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors",
                      i === indice
                        ? "bg-surface-highest text-on-surface"
                        : "text-on-surface-variant hover:bg-surface-high",
                    )}
                  >
                    {linha.icone ? (
                      <span className="shrink-0 text-on-surface-variant">
                        {linha.icone}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label text-on-surface">
                        {linha.rotulo}
                      </span>
                      {linha.detalhe ? (
                        <span className="block truncate font-mono text-[11px] text-on-surface-variant">
                          {linha.detalhe}
                        </span>
                      ) : null}
                    </span>
                    {linha.status ? (
                      <StatusPill status={linha.status} size="sm" glyph="dot" />
                    ) : null}
                    {i === indice ? (
                      <CornerDownLeft
                        size={14}
                        className="shrink-0 text-on-surface-variant"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-hairline px-4 py-2 text-[11px] text-on-surface-variant">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>esc fechar</span>
        </div>
      </div>
    </div>
  );
}
