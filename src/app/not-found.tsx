import Link from "next/link";
import { AmbientOrbs, buttonClasses } from "@/components/ui";

/**
 * 404 — item 10.2.
 *
 * Fala com duas pessoas ao mesmo tempo e não sabe qual delas está lendo:
 * alguém do produto que clicou num link velho, ou um estranho que digitou
 * mal um endereço curto. Por isso não há jargão, não há código de erro na
 * cara, e os dois caminhos de saída aparecem — a landing e o painel.
 *
 * O que **não** aparece: nada sobre "sua conta", "seus códigos" ou login.
 * Quem caiu aqui vindo de um QR impresso não tem conta nenhuma, e sugerir
 * que ele criou algo que sumiu é confundir de graça.
 */
export default function NaoEncontrado() {
  return (
    <>
      <AmbientOrbs />
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-margin-mobile py-16">
        <span className="font-mono text-caption tracking-[0.14em] text-primary uppercase">
          Página não encontrada
        </span>
        <h1 className="font-display text-headline-lg text-on-surface">
          Este endereço não leva a lugar nenhum
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          O link pode ter mudado, ou o endereço veio digitado com uma letra
          diferente. Confira o endereço e tente de novo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={buttonClasses("primary")}>
            Ir para o início
          </Link>
          <Link href="/painel" className={buttonClasses("secondary")}>
            Abrir meu painel
          </Link>
        </div>
      </main>
    </>
  );
}
