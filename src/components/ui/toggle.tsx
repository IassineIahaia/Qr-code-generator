"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
  /** Controlado. Se omitido, o componente controla o próprio estado. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Enquanto a atualização otimista não confirma. */
  pending?: boolean;
  /** Descrição para leitores de tela quando não há `label` visível. */
  label: string;
  /** Texto visível ao lado do switch. */
  children?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/** Switch de ligar/desligar — o gesto central do produto. */
export function Toggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  pending = false,
  label,
  children,
  size = "md",
  className,
}: ToggleProps) {
  const id = useId();
  const [internal, setInternal] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internal;

  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "size-4" : "size-5";
  const travel = size === "sm" ? "translate-x-4" : "translate-x-5";

  function handleClick() {
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={isOn}
        aria-label={children ? undefined : label}
        aria-busy={pending || undefined}
        disabled={disabled || pending}
        onClick={handleClick}
        className={cn(
          "relative shrink-0 rounded-full border border-hairline transition-colors duration-200",
          track,
          isOn ? "bg-brand-gradient border-transparent" : "bg-surface-high",
          (disabled || pending) && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            knob,
            isOn && travel,
            pending && "animate-pulse",
          )}
        />
      </button>
      {children ? (
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-label text-on-surface select-none",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {children}
        </label>
      ) : null}
    </span>
  );
}
