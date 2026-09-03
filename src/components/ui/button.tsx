import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium text-label whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // Gradiente da marca: só para a ação principal da tela.
  primary: "bg-brand-gradient text-white shadow-brand hover:opacity-90",
  secondary:
    "bg-surface-low border border-hairline text-on-surface hover:bg-surface-high hover:border-hairline-strong",
  ghost: "text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
  danger:
    "bg-error-container/15 border border-error/30 text-error hover:bg-error-container/25",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-10 px-4",
  lg: "h-11 px-5 text-body",
};

/**
 * As mesmas classes do `Button`, para quando o elemento precisa ser um `<a>`
 * de verdade — um `<Link>` do Next, por exemplo. Um botão que navega tem que
 * abrir em nova aba com ctrl+clique, e `onClick` não faz isso.
 */
export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mostra spinner e bloqueia o clique. */
  loading?: boolean;
  /** Ícone à esquerda do texto (Lucide, `size={16}`). */
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: o botão não tem texto visível. */
  label: string;
  variant?: Extract<ButtonVariant, "ghost" | "secondary" | "danger">;
  size?: "sm" | "md";
}

/** Botão só de ícone — o `label` vira `aria-label` e `title`. */
export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        base,
        variants[variant],
        "rounded-lg p-0",
        size === "sm" ? "size-8" : "size-10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
