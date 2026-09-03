"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Lock, QrCode } from "lucide-react";
import { AmbientOrbs, Button, Field, Input } from "@/components/ui";
import { destravarQr, type EstadoDestrave } from "@/lib/qr/unlock";

/**
 * A porta de senha — item 6.5.
 *
 * Mostra o nome do código porque quem escaneou precisa saber que chegou no
 * lugar certo antes de digitar qualquer coisa. Não mostra o destino: ele é
 * exatamente o que a senha protege.
 */

export function PortaDeSenha({ slug, nome }: { slug: string; nome: string }) {
  const [estado, acao] = useActionState<EstadoDestrave, FormData>(destravarQr, {});

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-between overflow-hidden bg-base px-margin-mobile">
      <AmbientOrbs />

      <main className="relative z-10 flex w-full max-w-[420px] flex-1 flex-col items-center justify-center gap-stack-lg py-stack-lg text-center">
        <span className="flex size-24 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container/50 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
          <Lock size={40} strokeWidth={1.2} className="text-primary" aria-hidden />
        </span>

        <div className="flex flex-col items-center gap-stack-sm">
          <h1 className="max-w-[320px] font-display text-headline text-on-surface">
            Este QR Code é protegido
          </h1>
          <p className="max-w-[320px] text-body text-on-surface-variant">
            Digite a senha para abrir{" "}
            <strong className="text-on-surface">{nome}</strong>.
          </p>
        </div>

        <form action={acao} className="flex w-full max-w-[320px] flex-col gap-stack-md">
          <input type="hidden" name="slug" value={slug} />
          <Field label="Senha" htmlFor="senha-qr" error={estado.erro}>
            <Input
              id="senha-qr"
              name="senha"
              type="password"
              autoFocus
              autoComplete="off"
              maxLength={72}
              required
              invalid={!!estado.erro}
              icon={<KeyRound size={16} />}
              className="text-center"
            />
          </Field>
          <Enviar />
        </form>
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

/** Separado só para poder usar `useFormStatus`, que exige estar dentro do form. */
function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending} className="w-full">
      Abrir
    </Button>
  );
}
