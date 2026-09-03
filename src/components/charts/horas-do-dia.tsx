"use client";

import type { PontoDaHora } from "@/lib/qr/analytics";
import { COR_LEITURAS } from "./palette";

/**
 * Leituras por hora do dia — item 7.1.
 *
 * Uma série só, então nada de legenda: o título do card já diz o que é. E
 * nada de recharts aqui — vinte e quatro barras de altura proporcional são
 * `div`s, e um gráfico de barras dessa simplicidade não justifica hidratar
 * uma biblioteca inteira no browser.
 *
 * É a soma de *todas* as leituras da janela por hora, não as de hoje: é o
 * horário em que as pessoas escaneiam, uma informação sobre o público, não
 * sobre um dia específico. Um único dia teria 24 números perto de zero.
 */

export function HorasDoDia({ dados }: { dados: PontoDaHora[] }) {
  const maior = Math.max(...dados.map((h) => h.total), 1);
  const temDados = dados.some((h) => h.total > 0);

  if (!temDados) {
    return (
      <p className="py-stack-md text-[13px] text-on-surface-variant">
        Nenhuma leitura neste período.
      </p>
    );
  }

  const pico = dados.reduce((a, b) => (b.total > a.total ? b : a));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-32 items-end gap-[3px]" role="list">
        {dados.map((h) => (
          <div
            key={h.hora}
            role="listitem"
            // O `title` é a camada de hover: numa barra de 8px de largura,
            // um tooltip desenhado erraria o alvo mais vezes que acertaria.
            title={`${String(h.hora).padStart(2, "0")}h — ${h.total.toLocaleString("pt-BR")} leitura(s)`}
            className="group flex h-full flex-1 items-end"
          >
            <div
              className="w-full rounded-t-[3px] transition-opacity group-hover:opacity-100"
              style={{
                height: `${Math.max((h.total / maior) * 100, h.total > 0 ? 3 : 1)}%`,
                background: COR_LEITURAS,
                // A hora de pico fica cheia; as outras recuam. É a regra de
                // "uma série é o ponto, o resto é contexto".
                opacity: h.hora === pico.hora ? 1 : 0.45,
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-on-surface-variant">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>

      <p className="text-[12px] text-on-surface-variant">
        Pico às{" "}
        <strong className="font-mono text-on-surface">
          {String(pico.hora).padStart(2, "0")}h
        </strong>{" "}
        — {pico.total.toLocaleString("pt-BR")} leitura
        {pico.total === 1 ? "" : "s"}. Horário de Brasília.
      </p>
    </div>
  );
}
