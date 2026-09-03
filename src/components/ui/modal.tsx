"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Rodapé com as ações; normalmente `Cancelar` + ação principal. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Impede fechar por clique no fundo ou Esc (operações em andamento). */
  dismissible?: boolean;
  children?: ReactNode;
  className?: string;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

/**
 * Modal sobre `<dialog>` nativo: o navegador cuida do foco preso,
 * da camada de topo e do Esc.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  dismissible = true,
  children,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Esc dispara `cancel` antes de fechar: deixamos o React mandar no estado.
  function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (dismissible) onClose();
  }

  // Clique no backdrop chega no próprio <dialog>, não no conteúdo.
  function handleClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (dismissible && event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby="modal-title"
      className={cn(
        "m-auto w-[calc(100%-2rem)] bg-transparent p-0 text-on-surface",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        sizes[size],
        className,
      )}
    >
      <div className="rounded-modal border border-hairline bg-elevated shadow-float">
        <div className="flex items-start justify-between gap-4 p-stack-lg pb-stack-md">
          <div className="flex flex-col gap-1.5">
            <h2
              id="modal-title"
              className="font-display text-headline text-on-surface"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-[13px] text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>
          {dismissible ? (
            <IconButton label="Fechar" size="sm" onClick={onClose}>
              <X size={18} />
            </IconButton>
          ) : null}
        </div>

        {children ? (
          <div className="px-stack-lg pb-stack-md">{children}</div>
        ) : null}

        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-hairline p-stack-md">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
