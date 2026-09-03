"use client";

import { useMemo, useState } from "react";
import {
  AmbientOrbs,
  Card,
  CardBody,
  CardHeader,
  Field,
} from "@/components/ui";
import { ContentForm, ContentTypePicker } from "@/components/qr/content-form";
import { DesignForm } from "@/components/qr/design-form";
import { ExportButtons } from "@/components/qr/export-buttons";
import { QrPreview } from "@/components/qr/qr-preview";
import { ReadabilityMeter } from "@/components/qr/readability-meter";
import {
  encodeContent,
  metaFor,
  validateContent,
  type QrContent,
} from "@/lib/qr/content";
import { DEFAULT_DESIGN } from "@/lib/qr/defaults";
import { avaliarLegibilidade } from "@/lib/qr/readability";
import type { QrDesign } from "@/lib/qr/types";

/**
 * Bancada do motor de QR. Não faz parte do produto: existe para exercitar o
 * codificador e o renderizador sem passar pelo banco. Os controles de design
 * são os mesmos do fluxo real (`DesignForm`).
 */
export default function QrEnginePage() {
  const [content, setContent] = useState<QrContent>({
    type: "url",
    url: "https://qrpro.link/v24",
  });
  const [design, setDesign] = useState<QrDesign>(DEFAULT_DESIGN);
  const [larguraMm, setLarguraMm] = useState(40);

  // Trocar de tipo zera o "tocado": um formulário que já nasce vermelho é
  // hostil, e a pessoa acabou de chegar naquele conjunto de campos.
  const [tocado, setTocado] = useState(false);

  const validacao = useMemo(() => validateContent(content), [content]);
  const valido = validacao.ok;
  const erros = !valido && tocado ? validacao.errors : {};

  const data = useMemo(
    () => (valido ? encodeContent(content) : ""),
    [content, valido],
  );

  const report = useMemo(
    () => avaliarLegibilidade({ design, data, printWidthMm: larguraMm }),
    [design, data, larguraMm],
  );

  return (
    <>
      <AmbientOrbs />
      <main className="relative z-10 mx-auto flex max-w-app flex-col gap-stack-lg px-margin-mobile py-stack-lg md:px-gutter">
        <header className="flex flex-col gap-2">
          <span className="font-mono text-caption tracking-[0.14em] text-primary uppercase">
            Fase 3 · motor de QR
          </span>
          <h1 className="font-display text-headline-lg text-on-surface">
            Bancada do gerador
          </h1>
          <p className="max-w-prose text-on-surface-variant">
            Preview ao vivo com debounce, medidor de escaneabilidade e
            exportação em PNG, SVG e PDF.
          </p>
        </header>

        <div className="grid gap-stack-md lg:grid-cols-[1fr_360px]">
          {/* ---------- Controles ---------- */}
          <div className="flex flex-col gap-stack-md">
            <Card>
              <CardHeader
                title="Conteúdo"
                description="Oito tipos, um codificador cada. O QR recebe a string de baixo."
              />
              <CardBody className="flex flex-col gap-stack-md">
                <ContentTypePicker
                  value={content.type}
                  onChange={(novo) => {
                    setContent(novo);
                    setTocado(false);
                  }}
                />
                <ContentForm
                  content={content}
                  onChange={(novo) => {
                    setContent(novo);
                    setTocado(true);
                  }}
                  errors={erros}
                />
                <Field
                  label="String codificada"
                  hint={
                    valido
                      ? `${data.length} caracteres · ${metaFor(content.type).dynamic ? "aceita QR dinâmico" : "só estático"}`
                      : "Complete os campos acima para gerar o código."
                  }
                >
                  <pre className="max-h-32 overflow-auto rounded-control border border-hairline bg-base px-3 py-2 font-mono text-data whitespace-pre-wrap break-all text-on-surface-variant">
                    {data || "—"}
                  </pre>
                </Field>
                <Field
                  label={`Largura impressa: ${larguraMm} mm`}
                  htmlFor="mm"
                  hint="Usado só pelo medidor, para estimar o tamanho de cada módulo."
                >
                  <input
                    id="mm"
                    type="range"
                    min={10}
                    max={200}
                    value={larguraMm}
                    onChange={(e) => setLarguraMm(Number(e.target.value))}
                    className="w-full accent-(--color-primary-container)"
                  />
                </Field>
              </CardBody>
            </Card>

            <DesignForm design={design} onChange={setDesign} />
          </div>

          {/* ---------- Preview ---------- */}
          <div className="flex flex-col gap-stack-md lg:sticky lg:top-stack-md lg:self-start">
            <Card>
              <CardHeader title="Preview" />
              <CardBody className="flex flex-col items-center gap-stack-md">
                {/* Sem conteúdo válido não há código: mostrar o anterior daria
                    a impressão de que o QR corresponde ao que está na tela. */}
                {valido ? (
                  <>
                    <QrPreview data={data} design={design} displaySize={260} />
                    <ExportButtons
                      data={data}
                      design={design}
                      nome="Campanha Verão 2024"
                    />
                  </>
                ) : (
                  <p className="py-16 text-center text-[13px] text-on-surface-variant">
                    Complete o conteúdo para ver o código.
                  </p>
                )}
              </CardBody>
            </Card>

            {valido ? (
              <Card>
                <CardBody>
                  <ReadabilityMeter report={report} />
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
