"use client";

import { useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Toggle,
} from "@/components/ui";
import { BRAND_FROM, BRAND_TO, ECC_LABELS, PRESETS } from "@/lib/qr/defaults";
import type {
  DotStyle,
  ErrorCorrection,
  EyeBallStyle,
  EyeFrameStyle,
  QrDesign,
} from "@/lib/qr/types";

/**
 * Passo "design" — os mesmos controles na bancada `/ui/qr` e no fluxo de
 * criação. Só edita o objeto `QrDesign`; quem desenha é o `QrPreview`.
 */

/** Rótulos em português: `extra-rounded` não diz nada para quem usa. */
const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Quadrado" },
  { value: "rounded", label: "Arredondado" },
  { value: "extra-rounded", label: "Bem arredondado" },
  { value: "dots", label: "Bolinhas" },
  { value: "classy", label: "Clássico" },
  { value: "classy-rounded", label: "Clássico arredondado" },
];

const EYE_FRAMES: { value: EyeFrameStyle; label: string }[] = [
  { value: "square", label: "Quadrada" },
  { value: "extra-rounded", label: "Arredondada" },
  { value: "dot", label: "Circular" },
];

const EYE_BALLS: { value: EyeBallStyle; label: string }[] = [
  { value: "square", label: "Quadrado" },
  { value: "dot", label: "Círculo" },
  { value: "rounded", label: "Arredondado" },
];

const ECCS: ErrorCorrection[] = ["L", "M", "Q", "H"];

/** Acima disso a data URL estoura o limite do `designSchema`. */
const LOGO_MAX_BYTES = 1_400_000;

const inputCor =
  "h-10 w-full cursor-pointer rounded-control border border-hairline bg-base";
const inputRange = "w-full accent-(--color-primary-container)";

export interface DesignFormProps {
  design: QrDesign;
  onChange: (design: QrDesign) => void;
}

export function DesignForm({ design, onChange }: DesignFormProps) {
  const [erroLogo, setErroLogo] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof QrDesign>(chave: K, valor: QrDesign[K]) {
    onChange({ ...design, [chave]: valor });
  }

  function carregarLogo(file: File) {
    if (file.size > LOGO_MAX_BYTES) {
      setErroLogo("Imagem grande demais. Use um arquivo de até 1,4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setErroLogo(null);
      onChange({
        ...design,
        logo: {
          src: String(reader.result),
          size: design.logo?.size ?? 0.25,
          margin: design.logo?.margin ?? 4,
          hideBackgroundDots: design.logo?.hideBackgroundDots ?? true,
        },
        // O logo cobre módulos no meio do código. Com correção baixa isso
        // basta para o leitor desistir, então subimos junto — quem quiser
        // volta a baixar no seletor ao lado.
        errorCorrection:
          design.errorCorrection === "L" || design.errorCorrection === "M"
            ? "H"
            : design.errorCorrection,
      });
    };
    reader.onerror = () => setErroLogo("Não consegui ler esse arquivo.");
    reader.readAsDataURL(file);
  }

  const corSolida =
    design.foreground.kind === "solid" ? design.foreground.color : BRAND_FROM;
  // Extraído antes do JSX: o TypeScript não mantém o estreitamento de
  // `design.foreground` dentro dos callbacks de evento.
  const gradiente =
    design.foreground.kind === "gradient" ? design.foreground.gradient : null;

  return (
    <div className="flex flex-col gap-stack-md">
      <Card>
        <CardHeader
          title="Presets"
          description="Pontos de partida prontos. Você ajusta depois."
        />
        <CardBody className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="secondary"
              size="sm"
              type="button"
              title={preset.description}
              onClick={() => onChange(preset.design)}
            >
              {preset.name}
            </Button>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Formas e cores" />
        <CardBody className="grid gap-stack-md sm:grid-cols-2">
          <Field label="Módulos" htmlFor="dot">
            <Select
              id="dot"
              value={design.dotStyle}
              onChange={(e) => set("dotStyle", e.target.value as DotStyle)}
            >
              {DOT_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Moldura do olho" htmlFor="eyeframe">
            <Select
              id="eyeframe"
              value={design.eyeFrameStyle}
              onChange={(e) =>
                set("eyeFrameStyle", e.target.value as EyeFrameStyle)
              }
            >
              {EYE_FRAMES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Miolo do olho" htmlFor="eyeball">
            <Select
              id="eyeball"
              value={design.eyeBallStyle}
              onChange={(e) =>
                set("eyeBallStyle", e.target.value as EyeBallStyle)
              }
            >
              {EYE_BALLS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Correção de erro"
            htmlFor="ecc"
            hint="Mais correção tolera sujeira e logo, mas adensa o código."
          >
            <Select
              id="ecc"
              value={design.errorCorrection}
              onChange={(e) =>
                set("errorCorrection", e.target.value as ErrorCorrection)
              }
            >
              {ECCS.map((e) => (
                <option key={e} value={e}>
                  {ECC_LABELS[e]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Cor dos módulos" htmlFor="fg">
            <input
              id="fg"
              type="color"
              value={corSolida}
              onChange={(e) =>
                set("foreground", { kind: "solid", color: e.target.value })
              }
              className={inputCor}
              disabled={design.foreground.kind === "gradient"}
            />
          </Field>

          <Field label="Cor do fundo" htmlFor="bg">
            <input
              id="bg"
              type="color"
              value={design.background === "transparent" ? "#FFFFFF" : design.background}
              onChange={(e) => set("background", e.target.value)}
              className={inputCor}
            />
          </Field>

          <Field label={`Margem: ${design.margin} módulos`} htmlFor="margin">
            <input
              id="margin"
              type="range"
              min={0}
              max={10}
              value={design.margin}
              onChange={(e) => set("margin", Number(e.target.value))}
              className={inputRange}
            />
          </Field>

          <div className="flex items-end">
            <Toggle
              label="Gradiente da marca"
              checked={design.foreground.kind === "gradient"}
              onCheckedChange={(on) =>
                set(
                  "foreground",
                  on
                    ? {
                        kind: "gradient",
                        gradient: {
                          type: "linear",
                          rotation: 45,
                          from: BRAND_FROM,
                          to: BRAND_TO,
                        },
                      }
                    : { kind: "solid", color: "#000000" },
                )
              }
            >
              Gradiente
            </Toggle>
          </div>

          {gradiente ? (
            <>
              <Field label="Do tom" htmlFor="grad-from">
                <input
                  id="grad-from"
                  type="color"
                  value={gradiente.from}
                  onChange={(e) =>
                    set("foreground", {
                      kind: "gradient",
                      gradient: { ...gradiente, from: e.target.value },
                    })
                  }
                  className={inputCor}
                />
              </Field>
              <Field label="Ao tom" htmlFor="grad-to">
                <input
                  id="grad-to"
                  type="color"
                  value={gradiente.to}
                  onChange={(e) =>
                    set("foreground", {
                      kind: "gradient",
                      gradient: { ...gradiente, to: e.target.value },
                    })
                  }
                  className={inputCor}
                />
              </Field>
            </>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Moldura"
          description="A chamada que convida a escanear."
        />
        <CardBody className="flex flex-col gap-stack-md">
          <Toggle
            label="Ativar moldura"
            checked={design.frame !== null}
            onCheckedChange={(on) =>
              set(
                "frame",
                on
                  ? { text: "ESCANEIE-ME", color: "#000000", position: "bottom" }
                  : null,
              )
            }
          >
            Com moldura
          </Toggle>

          {design.frame ? (
            <div className="grid gap-stack-md sm:grid-cols-2">
              <Field label="Texto" htmlFor="frametext">
                <Input
                  id="frametext"
                  value={design.frame.text}
                  maxLength={60}
                  onChange={(e) =>
                    set("frame", { ...design.frame!, text: e.target.value })
                  }
                />
              </Field>
              <Field label="Posição" htmlFor="framepos">
                <Select
                  id="framepos"
                  value={design.frame.position}
                  onChange={(e) =>
                    set("frame", {
                      ...design.frame!,
                      position: e.target.value as "top" | "bottom",
                    })
                  }
                >
                  <option value="bottom">Embaixo</option>
                  <option value="top">Em cima</option>
                </Select>
              </Field>
              <Field label="Cor da faixa" htmlFor="framecolor">
                <input
                  id="framecolor"
                  type="color"
                  value={design.frame.color}
                  onChange={(e) =>
                    set("frame", { ...design.frame!, color: e.target.value })
                  }
                  className={inputCor}
                />
              </Field>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Logo"
          description="Cobre parte do código, então pede correção de erro alta."
        />
        <CardBody className="flex flex-col gap-stack-md">
          <input
            ref={arquivoRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) carregarLogo(file);
              e.target.value = "";
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => arquivoRef.current?.click()}
            >
              {design.logo ? "Trocar imagem" : "Enviar imagem"}
            </Button>
            {design.logo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={design.logo.src}
                  alt=""
                  className="size-10 rounded-control border border-hairline bg-base object-contain p-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => set("logo", null)}
                >
                  Remover
                </Button>
              </>
            ) : (
              <span className="text-[12px] text-on-surface-variant">
                PNG, JPG, SVG ou WebP, até 1,4 MB.
              </span>
            )}
          </div>

          {erroLogo ? <p className="text-[12px] text-error">{erroLogo}</p> : null}

          {design.logo ? (
            <div className="grid gap-stack-md sm:grid-cols-2">
              <Field
                label={`Tamanho: ${Math.round(design.logo.size * 100)}% da largura`}
                htmlFor="logosize"
              >
                <input
                  id="logosize"
                  type="range"
                  min={10}
                  max={45}
                  value={Math.round(design.logo.size * 100)}
                  onChange={(e) =>
                    set("logo", {
                      ...design.logo!,
                      size: Number(e.target.value) / 100,
                    })
                  }
                  className={inputRange}
                />
              </Field>
              <Field
                label={`Respiro: ${design.logo.margin} módulos`}
                htmlFor="logomargin"
              >
                <input
                  id="logomargin"
                  type="range"
                  min={0}
                  max={12}
                  value={design.logo.margin}
                  onChange={(e) =>
                    set("logo", {
                      ...design.logo!,
                      margin: Number(e.target.value),
                    })
                  }
                  className={inputRange}
                />
              </Field>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
