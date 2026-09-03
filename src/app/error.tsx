"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AmbientOrbs, Button, buttonClasses } from "@/components/ui";

/**
 * A tela de erro do app — item 10.2.
 *
 * Precisa ser client component: é o `error.tsx` do App Router, e ele recebe
 * a função `reset` para tentar renderizar de novo sem recarregar a página.
 * Isso importa porque a maioria dos erros aqui é uma leitura do Supabase que
 * falhou — rede instável, sessão expirando no meio. Tentar de novo resolve,
 * e é o primeiro botão.
 *
 * **A mensagem crua do erro não vai para a tela.** Ela pode conter o SQL da
 * consulta ou o nome de uma coluna, e nada disso ajuda quem está olhando.
 * Vai para o console do servidor, onde serve. O `digest` aparece porque é o
 * identificador que liga esta tela àquela linha de log — é o número que faz
 * sentido pedir a alguém que reporta um problema.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] erro não tratado:", error);
  }, [error]);

  return (
    <>
      <AmbientOrbs />
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-margin-mobile py-16">
        <span className="font-mono text-caption tracking-[0.14em] text-error uppercase">
          Algo deu errado
        </span>
        <h1 className="font-display text-headline-lg text-on-surface">
          Não consegui carregar esta tela
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Costuma ser passageiro. Tente de novo — se insistir, seus QR Codes
          continuam funcionando normalmente: esta falha é da tela, não deles.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={reset}>
            Tentar de novo
          </Button>
          <Link href="/painel" className={buttonClasses("secondary")}>
            Voltar ao painel
          </Link>
        </div>

        {error.digest ? (
          <p className="border-t border-hairline pt-4 text-[12px] text-on-surface-variant">
            Se for reportar, cite este código:{" "}
            <code className="font-mono text-data text-secondary">
              {error.digest}
            </code>
          </p>
        ) : null}
      </main>
    </>
  );
}
