"use client";

import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import type { PontoDoDia } from "@/lib/qr/analytics";
import {
  COR_EIXO,
  COR_GRADE,
  COR_LEITURAS,
  COR_UNICAS,
} from "./palette";

/**
 * Leituras por dia — o gráfico principal da Fase 7.
 *
 * Duas séries num eixo só, e isso é uma escolha, não um descuido: leituras e
 * leituras únicas medem a mesma coisa na mesma unidade, e única é sempre um
 * subconjunto de total. Dar a cada uma o seu eixo (o vício clássico de
 * dashboard) faria as duas curvas se cruzarem em pontos sem significado
 * nenhum e sugeriria que às vezes há mais únicas que leituras.
 *
 * Pelo mesmo motivo elas não são cores rivais: o total é área preenchida, as
 * únicas são uma linha por cima. A forma já diz que uma contém a outra.
 */

export interface SerieDiariaProps {
  dados: PontoDoDia[];
  /** Altura do desenho. A tabela alternativa não usa. */
  altura?: number;
}

export function SerieDiaria({ dados, altura = 260 }: SerieDiariaProps) {
  const [modo, setModo] = useState<"grafico" | "tabela">("grafico");

  if (dados.length === 0) {
    return (
      <p className="py-stack-lg text-center text-[13px] text-on-surface-variant">
        Nenhuma leitura neste período.
      </p>
    );
  }

  // Com 90 dias no eixo, um rótulo por dia vira uma tarja preta. O passo
  // cresce com a janela para caber sempre umas seis marcas.
  const passo = Math.max(1, Math.ceil(dados.length / 6));

  return (
    <div className="flex flex-col gap-stack-sm">
      <div className="flex items-center justify-between gap-3">
        <Legenda />
        <button
          type="button"
          onClick={() => setModo(modo === "grafico" ? "tabela" : "grafico")}
          className="text-[12px] text-primary underline-offset-4 hover:underline"
        >
          {modo === "grafico" ? "Ver como tabela" : "Ver como gráfico"}
        </button>
      </div>

      {modo === "tabela" ? (
        <TabelaDaSerie dados={dados} />
      ) : (
        <div style={{ height: altura }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dados}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <defs>
                <linearGradient id="grad-leituras" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COR_LEITURAS} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COR_LEITURAS} stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Só linhas horizontais: as verticais competiriam com as
                  próprias marcas de dado sem ajudar a ler valor nenhum. */}
              <CartesianGrid stroke={COR_GRADE} vertical={false} />

              <XAxis
                dataKey="dia"
                tickFormatter={rotuloDoDia}
                interval={passo - 1}
                tick={{ fill: COR_EIXO, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: COR_GRADE }}
              />
              <YAxis
                allowDecimals={false}
                width={44}
                tick={{ fill: COR_EIXO, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ stroke: COR_GRADE, strokeWidth: 1 }}
                content={<Dica />}
              />

              <Area
                type="monotone"
                dataKey="total"
                name="Leituras"
                stroke={COR_LEITURAS}
                strokeWidth={2}
                fill="url(#grad-leituras)"
                // 8px de raio: o ponto de hover precisa ser maior que a
                // marca para ser alcançável com o dedo.
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#00121F" }}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="unicos"
                name="Únicas"
                stroke={COR_UNICAS}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#00121F" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Duas séries pedem legenda sempre — identidade nunca só por cor. */
function Legenda() {
  return (
    <div className="flex items-center gap-4 text-[12px] text-on-surface-variant">
      <span className="flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-sm"
          style={{ background: COR_LEITURAS }}
          aria-hidden
        />
        Leituras
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-0.5 w-3 rounded-full"
          style={{ background: COR_UNICAS }}
          aria-hidden
        />
        Únicas
      </span>
    </div>
  );
}

interface DicaProps {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}

function Dica({ active, payload, label }: DicaProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-control border border-hairline bg-elevated px-3 py-2 shadow-lg">
      <p className="pb-1 text-[12px] text-on-surface">{dataLonga(label)}</p>
      {payload.map((linha) => (
        <p
          key={linha.name}
          className="flex items-center gap-2 text-[12px] text-on-surface-variant"
        >
          <span
            className="size-2 rounded-full"
            style={{ background: linha.color }}
            aria-hidden
          />
          {linha.name}
          <span className="ml-auto font-mono text-on-surface tabular-nums">
            {(linha.value ?? 0).toLocaleString("pt-BR")}
          </span>
        </p>
      ))}
    </div>
  );
}

function TabelaDaSerie({ dados }: { dados: PontoDoDia[] }) {
  // Do mais recente para o mais antigo: quem abre a tabela quer conferir
  // ontem, não o primeiro dia da janela.
  const linhas = [...dados].reverse().filter((d) => d.total > 0);

  return (
    <div className="max-h-[260px] overflow-y-auto">
      <Table>
        <THead>
          <Tr static>
            <Th>Dia</Th>
            <Th className="text-right">Leituras</Th>
            <Th className="text-right">Únicas</Th>
          </Tr>
        </THead>
        <TBody>
          {linhas.length === 0 ? (
            <Tr static>
              <Td colSpan={3} className="text-on-surface-variant">
                Nenhum dia com leitura neste período.
              </Td>
            </Tr>
          ) : (
            linhas.map((d) => (
              <Tr key={d.dia} static>
                <Td>{dataLonga(d.dia)}</Td>
                <Td className="text-right font-mono tabular-nums">
                  {d.total.toLocaleString("pt-BR")}
                </Td>
                <Td className="text-right font-mono tabular-nums text-on-surface-variant">
                  {d.unicos.toLocaleString("pt-BR")}
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}

/* ---------- datas ---------- */

/**
 * `2026-09-02` chega do Postgres já no fuso do produto — ele agrupou por dia
 * em `America/Sao_Paulo`. Então formatamos como texto puro, sem passar por
 * `new Date()`: converter aqui aplicaria o fuso do browser de novo e jogaria
 * metade dos dias para o anterior.
 */
function rotuloDoDia(dia: string): string {
  const [, mes, d] = dia.split("-");
  return `${d}/${mes}`;
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function dataLonga(dia?: string): string {
  if (!dia) return "";
  const [ano, mes, d] = dia.split("-");
  return `${d} de ${MESES[Number(mes) - 1] ?? mes} de ${ano}`;
}
