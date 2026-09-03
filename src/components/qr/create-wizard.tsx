"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Toggle,
} from "@/components/ui";
import { ContentForm, ContentTypePicker } from "./content-form";
import { DesignForm } from "./design-form";
import { ExportButtons } from "./export-buttons";
import { QrPreview } from "./qr-preview";
import { ReadabilityMeter } from "./readability-meter";
import { checkSlug, createQrCode } from "@/lib/qr/actions";
import {
  emptyContent,
  metaFor,
  suggestName,
  validateContent,
  type ContentErrors,
  type QrContent,
} from "@/lib/qr/content";
import { DEFAULT_DESIGN } from "@/lib/qr/defaults";
import { qrPayload } from "@/lib/qr/payload";
import { avaliarLegibilidade } from "@/lib/qr/readability";
import { SLUG_MESSAGES, checkSlugFormat, slugify } from "@/lib/qr/slug";
import type { QrDesign } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

/**
 * Criação em 3 passos: conteúdo → design → regras.
 *
 * O preview fica visível o tempo todo, à direita, porque a pergunta que a
 * pessoa faz o tempo inteiro é "como isso vai ficar?". Nenhum passo é
 * destrutivo: dá para voltar e mudar tudo antes de salvar.
 *
 * As regras de status (agendamento, limite, senha) entram aqui na Fase 5 —
 * por ora o passo 3 cuida de nome, endereço curto e etiquetas.
 */

const PASSOS = [
  { n: 1, titulo: "Conteúdo", legenda: "O que o código carrega" },
  { n: 2, titulo: "Design", legenda: "Como ele aparece" },
  { n: 3, titulo: "Regras", legenda: "Nome, endereço e etiquetas" },
] as const;

type SlugStatus =
  | { estado: "vazio" }
  | { estado: "checando" }
  | { estado: "livre" }
  | { estado: "ocupado"; message: string }
  | { estado: "desconhecido" };

export interface CreateWizardProps {
  /** Base dos links curtos, ex.: `https://qrpro.link`. Vem do servidor. */
  baseUrl: string;
}

export function CreateWizard({ baseUrl }: CreateWizardProps) {
  const router = useRouter();
  const [passo, setPasso] = useState(1);

  const [content, setContent] = useState<QrContent>(emptyContent("url"));
  const [design, setDesign] = useState<QrDesign>(DEFAULT_DESIGN);
  const [nome, setNome] = useState("");
  const [nomeTocado, setNomeTocado] = useState(false);
  const [slug, setSlug] = useState("");
  const [dinamico, setDinamico] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagRascunho, setTagRascunho] = useState("");
  const [larguraMm, setLarguraMm] = useState(40);

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, iniciarSalvamento] = useTransition();

  const meta = metaFor(content.type);
  const podeSerDinamico = meta.dynamic;
  const ehDinamico = dinamico && podeSerDinamico;

  // ---------- conteúdo ----------

  const validacao = useMemo(() => validateContent(content), [content]);
  const conteudoValido = validacao.ok;
  // Só mostramos erro de conteúdo depois que a pessoa tentou avançar; um
  // formulário que já nasce vermelho é hostil.
  const [mostrarErrosConteudo, setMostrarErrosConteudo] = useState(false);
  const errosConteudo: ContentErrors =
    mostrarErrosConteudo && !validacao.ok ? validacao.errors : {};

  // O nome acompanha o conteúdo até a pessoa digitar o dela — derivado, não
  // sincronizado por efeito.
  const nomeEfetivo = nomeTocado ? nome : suggestName(content);

  // ---------- slug ----------

  const slugTrim = slug.trim();

  // Guardamos a resposta junto do slug que a gerou. Assim "está checando?" é
  // uma comparação, não mais um estado para manter em dia.
  const [slugResposta, setSlugResposta] = useState<{
    slug: string;
    status: SlugStatus;
  } | null>(null);

  const problemaFormato = slugTrim ? checkSlugFormat(slugTrim) : null;

  const slugStatus: SlugStatus = !slugTrim
    ? { estado: "vazio" }
    : problemaFormato
      ? { estado: "ocupado", message: SLUG_MESSAGES[problemaFormato] }
      : slugResposta?.slug === slugTrim
        ? slugResposta.status
        : { estado: "checando" };

  useEffect(() => {
    // Formato ruim já foi respondido acima, sem gastar uma ida ao servidor.
    if (!slugTrim || checkSlugFormat(slugTrim)) return;

    let vivo = true;
    // Debounce: a pessoa ainda está digitando, não adianta perguntar a cada
    // tecla se o endereço está livre.
    const timer = setTimeout(async () => {
      const r = await checkSlug(slugTrim);
      if (!vivo) return;
      setSlugResposta({
        slug: slugTrim,
        status:
          r.status === "ok"
            ? { estado: "livre" }
            : r.status === "erro"
              ? { estado: "ocupado", message: r.message }
              : { estado: "desconhecido" },
      });
    }, 450);

    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [slugTrim]);

  // ---------- preview ----------

  // Enquanto o slug não existe, mostramos um exemplo do mesmo tamanho: o
  // preview precisa refletir a densidade real do código que será impresso.
  const slugPreview = slugTrim || "ab3kx9";
  const data = useMemo(() => {
    if (!conteudoValido) return "";
    return qrPayload(content, ehDinamico, slugPreview, baseUrl);
  }, [content, conteudoValido, ehDinamico, slugPreview, baseUrl]);

  const report = useMemo(
    () => avaliarLegibilidade({ design, data, printWidthMm: larguraMm }),
    [design, data, larguraMm],
  );

  // ---------- navegação ----------

  function avancar() {
    if (passo === 1) {
      setMostrarErrosConteudo(true);
      if (!conteudoValido) return;
    }
    setPasso((p) => Math.min(3, p + 1));
  }

  function adicionarTag() {
    const valor = tagRascunho.trim().toLowerCase();
    if (!valor || tags.includes(valor) || tags.length >= 10) {
      setTagRascunho("");
      return;
    }
    setTags([...tags, valor.slice(0, 30)]);
    setTagRascunho("");
  }

  function salvar() {
    setErroGeral(null);
    setErros({});
    setMostrarErrosConteudo(true);

    if (!conteudoValido) {
      setPasso(1);
      return;
    }

    iniciarSalvamento(async () => {
      const r = await createQrCode({
        name: nomeEfetivo,
        content,
        design,
        isDynamic: ehDinamico,
        slug: slugTrim,
        folderId: null,
        tags,
      });

      if (r.ok && r.qr) {
        router.push(`/painel/codigos?criado=${r.qr.slug}`);
        return;
      }

      setErros(r.fieldErrors ?? {});
      setErroGeral(r.message ?? "Não consegui salvar. Tente de novo.");
      // Erro de conteúdo joga a pessoa de volta ao passo em que ele mora.
      if (
        r.fieldErrors &&
        Object.keys(r.fieldErrors).some((k) => k.startsWith("content"))
      ) {
        setPasso(1);
      }
    });
  }

  const slugFinal = slugTrim || "(sorteado ao salvar)";

  return (
    <div className="flex flex-col gap-stack-lg">
      <Passos atual={passo} onIr={setPasso} podeIr={conteudoValido} />

      <div className="grid gap-stack-md lg:grid-cols-[1fr_360px]">
        {/* ---------- painel do passo ---------- */}
        <div className="flex flex-col gap-stack-md">
          {passo === 1 ? (
            <Card>
              <CardHeader
                title="O que este QR Code vai fazer?"
                description={meta.description}
              />
              <CardBody className="flex flex-col gap-stack-md">
                <ContentTypePicker
                  value={content.type}
                  onChange={(novo) => {
                    setContent(novo);
                    setMostrarErrosConteudo(false);
                  }}
                />
                <ContentForm
                  content={content}
                  onChange={setContent}
                  errors={errosConteudo}
                />
              </CardBody>
            </Card>
          ) : null}

          {passo === 2 ? <DesignForm design={design} onChange={setDesign} /> : null}

          {passo === 3 ? (
            <Card>
              <CardHeader
                title="Nome e endereço"
                description="Só você vê o nome. O endereço curto é o que vai impresso."
              />
              <CardBody className="flex flex-col gap-stack-md">
                <Field
                  label="Nome do QR Code"
                  htmlFor="nome"
                  error={erros.name}
                  hint="Para você achar depois na sua lista."
                  required
                >
                  <Input
                    id="nome"
                    value={nomeEfetivo}
                    maxLength={120}
                    invalid={!!erros.name}
                    onChange={(e) => {
                      setNomeTocado(true);
                      setNome(e.target.value);
                    }}
                  />
                </Field>

                <Toggle
                  label="QR Code dinâmico"
                  checked={ehDinamico}
                  disabled={!podeSerDinamico}
                  onCheckedChange={setDinamico}
                >
                  {podeSerDinamico
                    ? "Permite trocar o destino depois de impresso e contar as leituras."
                    : `Conteúdo do tipo "${meta.label}" só existe em versão estática: não há para onde redirecionar.`}
                </Toggle>

                {ehDinamico ? (
                  <Field
                    label="Endereço curto"
                    htmlFor="slug"
                    error={
                      erros.slug ??
                      (slugStatus.estado === "ocupado"
                        ? slugStatus.message
                        : undefined)
                    }
                    hint={
                      slugStatus.estado === "livre"
                        ? "Disponível."
                        : slugStatus.estado === "checando"
                          ? "Conferindo…"
                          : slugStatus.estado === "desconhecido"
                            ? "Não consegui conferir agora. Se estiver ocupado, aviso ao salvar."
                            : "Deixe em branco para sortearmos um curto e único."
                    }
                  >
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      invalid={
                        !!erros.slug || slugStatus.estado === "ocupado"
                      }
                      placeholder="promo-verao"
                      mono
                    />
                  </Field>
                ) : null}

                <Field
                  label="Etiquetas"
                  htmlFor="tag"
                  hint="Até 10. Enter adiciona."
                  error={erros.tags}
                >
                  <div className="flex flex-col gap-2">
                    <Input
                      id="tag"
                      value={tagRascunho}
                      maxLength={30}
                      onChange={(e) => setTagRascunho(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          adicionarTag();
                        }
                      }}
                      onBlur={adicionarTag}
                      placeholder="campanha, loja-centro"
                    />
                    {tags.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setTags(tags.filter((x) => x !== t))
                            }
                            className="rounded-full border border-hairline px-2.5 py-0.5 text-[12px] text-on-surface-variant transition-colors hover:border-error/50 hover:text-error"
                            title="Remover"
                          >
                            {t} ×
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Field>

                <div className="rounded-control border border-hairline bg-base px-3 py-2 text-[12px] text-on-surface-variant">
                  {ehDinamico ? (
                    <>
                      O código vai apontar para{" "}
                      <code className="font-mono text-secondary">
                        {baseUrl}/r/{slugFinal}
                      </code>
                      , e você troca o destino quando quiser.
                    </>
                  ) : (
                    <>
                      O conteúdo fica gravado no próprio código.{" "}
                      <strong className="text-on-surface">
                        Depois de impresso não dá para mudar
                      </strong>{" "}
                      — e não há como contar as leituras.
                    </>
                  )}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {erroGeral ? (
            <p
              role="alert"
              className="rounded-control border border-error/40 bg-error/8 px-3 py-2 text-[13px] text-error"
            >
              {erroGeral}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={passo === 1 || salvando}
              onClick={() => setPasso((p) => Math.max(1, p - 1))}
            >
              Voltar
            </Button>

            {passo < 3 ? (
              <Button type="button" variant="primary" onClick={avancar}>
                Continuar
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                loading={salvando}
                onClick={salvar}
                disabled={slugStatus.estado === "ocupado"}
              >
                {salvando ? "Salvando…" : "Criar QR Code"}
              </Button>
            )}
          </div>
        </div>

        {/* ---------- preview ---------- */}
        <div className="flex flex-col gap-stack-md lg:sticky lg:top-stack-md lg:self-start">
          <Card>
            <CardHeader title="Preview" />
            <CardBody className="flex flex-col items-center gap-stack-md">
              {conteudoValido ? (
                <>
                  <QrPreview data={data} design={design} displaySize={240} />
                  <ExportButtons data={data} design={design} nome={nomeEfetivo || "qrcode"} />
                </>
              ) : (
                <p className="py-10 text-center text-[13px] text-on-surface-variant">
                  Complete o conteúdo para ver o código.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-stack-md">
              <ReadabilityMeter report={report} />
              <Field label={`Largura impressa: ${larguraMm} mm`} htmlFor="mm">
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
        </div>
      </div>
    </div>
  );
}

/** Trilha dos 3 passos. Voltar é sempre permitido; avançar exige conteúdo. */
function Passos({
  atual,
  onIr,
  podeIr,
}: {
  atual: number;
  onIr: (n: number) => void;
  podeIr: boolean;
}) {
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {PASSOS.map((p, i) => {
        const ativo = p.n === atual;
        const feito = p.n < atual;
        const alcancavel = p.n <= atual || podeIr;
        return (
          <li key={p.n} className="flex flex-1 items-center gap-3">
            <button
              type="button"
              disabled={!alcancavel}
              onClick={() => alcancavel && onIr(p.n)}
              aria-current={ativo ? "step" : undefined}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors",
                ativo
                  ? "border-brand/60 bg-primary-container/12"
                  : "border-hairline",
                alcancavel
                  ? "hover:border-brand/40"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[12px]",
                  ativo || feito
                    ? "bg-primary-container text-on-primary-container"
                    : "border border-hairline text-on-surface-variant",
                )}
                aria-hidden
              >
                {feito ? "✓" : p.n}
              </span>
              <span className="flex flex-col">
                <span
                  className={cn(
                    "text-label",
                    ativo ? "text-on-surface" : "text-on-surface-variant",
                  )}
                >
                  {p.titulo}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {p.legenda}
                </span>
              </span>
            </button>
            {i < PASSOS.length - 1 ? (
              <span className="hidden h-px w-4 bg-hairline sm:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
