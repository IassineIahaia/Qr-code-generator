import {
  Archive,
  CalendarClock,
  CircleCheck,
  Gauge,
  Pause,
  TimerOff,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QrEffectiveStatus } from "@/lib/supabase/types";

interface StatusStyle {
  label: string;
  icon: LucideIcon;
  className: string;
  /** Cor do ponto/indicador, quando usado sem ícone. */
  dot: string;
}

/** Rótulo, cor e ícone de cada estado real do QR. */
export const QR_STATUS_STYLES: Record<QrEffectiveStatus, StatusStyle> = {
  active: {
    label: "Ativo",
    icon: CircleCheck,
    className: "bg-tertiary/10 border-tertiary/25 text-tertiary",
    dot: "bg-tertiary",
  },
  paused: {
    label: "Pausado",
    icon: Pause,
    className:
      "bg-surface-variant border-outline-variant text-on-surface-variant",
    dot: "bg-on-surface-variant",
  },
  scheduled: {
    label: "Agendado",
    icon: CalendarClock,
    className: "bg-secondary/10 border-secondary/25 text-secondary",
    dot: "bg-secondary",
  },
  expired: {
    label: "Expirado",
    icon: TimerOff,
    className: "bg-error/10 border-error/25 text-error",
    dot: "bg-error",
  },
  limit_reached: {
    label: "Limite atingido",
    icon: Gauge,
    className: "bg-warning/10 border-warning/25 text-warning",
    dot: "bg-warning",
  },
  archived: {
    label: "Arquivado",
    icon: Archive,
    className: "bg-surface-low border-hairline text-on-surface-variant/70",
    dot: "bg-on-surface-variant/60",
  },
};

export interface StatusPillProps {
  status: QrEffectiveStatus;
  /** `dot` (padrão na tabela) ou `icon`. */
  glyph?: "dot" | "icon" | "none";
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill({
  status,
  glyph = "dot",
  size = "sm",
  className,
}: StatusPillProps) {
  const style = QR_STATUS_STYLES[status];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        style.className,
        className,
      )}
    >
      {glyph === "dot" ? (
        <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      ) : null}
      {glyph === "icon" ? <Icon size={size === "sm" ? 12 : 14} aria-hidden /> : null}
      {style.label}
    </span>
  );
}

export interface ChipProps {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "data" | "success" | "danger";
  className?: string;
  /** Se informado, mostra o "×" de remover (filtros ativos). */
  onRemove?: () => void;
  removeLabel?: string;
}

const chipTones: Record<NonNullable<ChipProps["tone"]>, string> = {
  neutral: "bg-surface-high border-hairline text-on-surface-variant",
  brand: "bg-primary-container/15 border-primary-container/30 text-primary",
  data: "bg-secondary-container/10 border-secondary-container/30 text-secondary",
  success: "bg-tertiary-container/10 border-tertiary-container/30 text-tertiary",
  danger: "bg-error-container/15 border-error/30 text-error",
};

/** Chip de metadado ou de filtro ativo. */
export function Chip({
  children,
  tone = "neutral",
  className,
  onRemove,
  removeLabel = "Remover filtro",
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium",
        chipTones[tone],
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 rounded-full p-0.5 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 14 14" className="size-3" aria-hidden>
            <path
              d="M3.5 3.5l7 7m0-7l-7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
