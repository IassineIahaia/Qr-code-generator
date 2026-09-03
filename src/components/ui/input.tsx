import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-control border border-hairline bg-base text-body text-on-surface placeholder:text-on-surface-variant/50 transition-colors focus:border-brand/50 focus:ring-2 focus:ring-brand/18 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const invalid =
  "border-error/50 focus:border-error/60 focus:ring-error/20";

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

/** Envelope de um campo: rótulo, dica e mensagem de erro. */
export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-label text-on-surface">
          {label}
          {required ? (
            <span className="ml-0.5 text-error" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[12px] text-error">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ícone dentro do campo, à esquerda. */
  icon?: ReactNode;
  /** Conteúdo à direita: atalho, botão de limpar, unidade. */
  trailing?: ReactNode;
  invalid?: boolean;
  /** Números, IDs e slugs em JetBrains Mono. */
  mono?: boolean;
}

export function Input({
  icon,
  trailing,
  invalid: isInvalid,
  mono,
  className,
  ...props
}: InputProps) {
  const input = (
    <input
      aria-invalid={isInvalid || undefined}
      className={cn(
        field,
        "h-10 px-3",
        icon && "pl-10",
        trailing && "pr-12",
        mono && "font-mono text-data",
        isInvalid && invalid,
        className,
      )}
      {...props}
    />
  );

  if (!icon && !trailing) return input;

  return (
    <div className="group relative">
      {icon ? (
        <span
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      {input}
      {trailing ? (
        <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({
  invalid: isInvalid,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={isInvalid || undefined}
      className={cn(field, "resize-y px-3 py-2", isInvalid && invalid, className)}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid: isInvalid, className, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={isInvalid || undefined}
      className={cn(field, "h-10 cursor-pointer px-3", isInvalid && invalid, className)}
      {...props}
    />
  );
}

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 cursor-pointer rounded-sm border border-outline-variant bg-base accent-(--color-primary-container) transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/** Tecla desenhada, para atalhos (⌘K). */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-hairline bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant">
      {children}
    </kbd>
  );
}
