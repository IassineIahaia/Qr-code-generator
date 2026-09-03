import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `container` para conteúdo comum, `elevated` para peças que flutuam sobre ele. */
  tone?: "container" | "elevated" | "flat";
}

/** Card do painel: raio de 16px, hairline no lugar de sombra. */
export function Card({ tone = "container", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-hairline",
        tone === "container" && "bg-surface-container",
        tone === "elevated" && "bg-elevated",
        tone === "flat" && "bg-surface",
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Ações alinhadas à direita do título. */
  action?: ReactNode;
}

export function CardHeader({
  title,
  description,
  action,
  className,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-hairline p-stack-md",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-title font-display text-on-surface">{title}</h2>
        {description ? (
          <p className="text-[13px] text-on-surface-variant">{description}</p>
        ) : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-stack-md", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-hairline p-stack-md",
        className,
      )}
      {...props}
    />
  );
}

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  /** Variação percentual no período; positivo é verde, negativo é erro. */
  delta?: number;
  hint?: ReactNode;
  icon?: ReactNode;
}

/** KPI do painel: rótulo, número grande e variação. */
export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-2 p-stack-md", className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        {icon ? <span className="text-on-surface-variant">{icon}</span> : null}
      </div>
      <span className="font-display text-headline text-on-surface tabular-nums">
        {value}
      </span>
      <div className="flex items-center gap-2 text-[12px]">
        {typeof delta === "number" ? (
          <span
            className={cn(
              "font-mono",
              delta > 0 && "text-tertiary",
              delta < 0 && "text-error",
              delta === 0 && "text-on-surface-variant",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </span>
        ) : null}
        {hint ? <span className="text-on-surface-variant">{hint}</span> : null}
      </div>
    </Card>
  );
}
