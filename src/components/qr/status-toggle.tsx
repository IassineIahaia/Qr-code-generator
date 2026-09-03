"use client";

import { useState, useTransition } from "react";
import { StatusPill, Toggle } from "@/components/ui";
import { setQrStatus } from "@/lib/qr/actions";
import type { QrEffectiveStatus, QrStatus } from "@/lib/supabase/types";

/**
 * Ligar e pausar — item 5.1.
 *
 * A distinção que este componente carrega é a mesma da máquina de estados:
 * o **switch mostra a intenção** do dono (a coluna `status`), o **selo ao
 * lado mostra o estado real** (que também obedece ao relógio e ao contador).
 *
 * Elas divergem, e é bom que divirjam visivelmente. Ligar um código cuja
 * data de expiração já passou grava `status = 'active'` — a intenção agora
 * é essa — e ainda assim o selo continua "Expirado", porque o código
 * continua sem abrir. Um controle único aqui teria que escolher entre
 * mentir sobre o que foi salvo ou recusar o clique sem explicar.
 */

export interface StatusToggleProps {
  id: string;
  /** A coluna `status`: o que o dono pediu. */
  intencao: QrStatus;
  /** O estado real, de `qr_effective_status`. */
  efetivo: QrEffectiveStatus;
  /** Um QR estático não passa pelo nosso servidor: não há o que pausar. */
  desabilitado?: boolean;
  size?: "sm" | "md";
  /** Mostrar o selo ao lado. A tabela já tem uma coluna para ele. */
  comSelo?: boolean;
}

export function StatusToggle({
  id,
  intencao: intencaoInicial,
  efetivo: efetivoInicial,
  desabilitado = false,
  size = "sm",
  comSelo = false,
}: StatusToggleProps) {
  const [intencao, setIntencao] = useState<QrStatus>(intencaoInicial);
  const [efetivo, setEfetivo] = useState<QrEffectiveStatus>(efetivoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function alternar(ligado: boolean) {
    const alvo: QrStatus = ligado ? "active" : "paused";
    const anterior = { intencao, efetivo };

    // Otimista: o switch vira agora. Numa lista de vinte códigos, esperar a
    // ida ao servidor a cada clique transformaria "pausar três campanhas"
    // numa sequência de esperas.
    setIntencao(alvo);
    setEfetivo(ligado ? "active" : "paused");
    setErro(null);

    iniciar(async () => {
      const r = await setQrStatus({ id, status: alvo });

      if (r.ok && r.status) {
        // O servidor tem a última palavra sobre o estado *real*: pode ser
        // que o palpite "active" vire "expired" ao chegar lá.
        setEfetivo(r.status);
        return;
      }

      setIntencao(anterior.intencao);
      setEfetivo(anterior.efetivo);
      setErro(r.message ?? "Não consegui salvar.");
    });
  }

  if (desabilitado) {
    return comSelo ? <StatusPill status={efetivo} size={size} /> : null;
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <Toggle
        size={size}
        checked={intencao === "active"}
        pending={pendente}
        onCheckedChange={alternar}
        label={intencao === "active" ? "Pausar este QR Code" : "Ativar este QR Code"}
      />
      {comSelo ? <StatusPill status={efetivo} size={size} /> : null}
      {erro ? (
        <span role="alert" className="text-[11px] text-error">
          {erro}
        </span>
      ) : null}
    </span>
  );
}
