"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Faixa de erro geral do formulário (credencial inválida, e-mail em uso). */
export function FormError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-control border border-error/30 bg-error-container/15 px-3 py-2.5 text-[13px] text-error"
    >
      <AlertCircle size={16} className="mt-px shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** Faixa de sucesso — usada quando não há redirect (e-mail enviado). */
export function FormSuccess({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-control border border-tertiary/30 bg-tertiary/10 px-3 py-2.5 text-[13px] text-tertiary"
    >
      <CheckCircle2 size={16} className="mt-px shrink-0" aria-hidden />
      {children}
    </p>
  );
}

/** Campo de senha com botão de mostrar/ocultar. */
export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  invalid,
}: {
  id: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <Input
      id={id}
      name={name}
      type={visivel ? "text" : "password"}
      autoComplete={autoComplete}
      placeholder={placeholder}
      invalid={invalid}
      trailing={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="rounded p-0.5 text-on-surface-variant transition-colors hover:text-on-surface"
        >
          {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}

/** Botão de envio que sabe sozinho quando o formulário está em voo. */
export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      loading={pending}
      className={cn("w-full", className)}
    >
      {children}
    </Button>
  );
}

export { Field };
