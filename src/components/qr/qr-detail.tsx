"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Field,
  Input,
  Modal,
  StatusPill,
} from "@/components/ui";
import { ContentForm } from "./content-form";
import { CopyButton } from "./copy-button";
import { DesignForm } from "./design-form";
import { ExportButtons } from "./export-buttons";
import { QrPreview } from "./qr-preview";
import { ReadabilityMeter } from "./readability-meter";
import { RulesCard, type RulesCardProps } from "./rules-card";
import { StatusToggle } from "./status-toggle";
import {
  deleteQrCode,
  duplicateQrCode,
  updateQrDesign,
  updateQrDestination,
  updateQrMeta,
} from "@/lib/qr/actions";
import {
  metaFor,
  validateContent,
  type ContentErrors,
  type QrContent,
} from "@/lib/qr/content";
import { qrPayload } from "@/lib/qr/payload";
import { avaliarLegibilidade } from "@/lib/qr/readability";
import type { QrDesign } from "@/lib/qr/types";
import type { QrEffectiveStatus, QrStatus } from "@/lib/supabase/types";

/**
 * Tela de detalhe: ver, editar, duplicar e excluir um QR.
 *
 * Cada bloco salva sozinho. É proposital — trocar o destino de um código já
 * impresso é uma decisão de outra natureza que renomeá-lo, e um botão
 * "salvar tudo" no rodapé faria as duas coisas parecerem a mesma.
 */

export interface QrDetailProps {
  id: string;
  slug: string;
  nome: string;
  isDynamic: boolean;
  /** A intenção gravada (coluna `status`) — o que o switch mostra. */
  intencao: QrStatus;
  /** O estado real — o que o selo mostra. Os dois divergem, e devem. */
  status: QrEffectiveStatus;
  /** Por que o estado é esse, em uma frase. `null` quando é óbvio. */
  explicacao: string | null;
  content: QrContent;
  design: QrDesign;
  tags: string[];
  scanCount: number;
  uniqueScanCount: number;
  lastScanAt: string | null;
  createdAt: string;
  baseUrl: string;
  /** As regras de controle, já lidas e limpas pelo servidor. */
  regras: Omit<RulesCardProps, "id" | "isDynamic" | "scanCount">;
  /**
   * O histórico vem pronto de fora porque é Server Component: ele lê o banco
   * e não precisa de estado nenhum. Passá-lo como slot evita transformar
   * vinte linhas de log em props serializadas.
   */
  historico: ReactNode;
}

export function QrDetail(props: QrDetailProps) {
  const router = useRouter();
  const linkCurto = `${props.baseUrl}/r/${props.slug}`;

  const [content, setContent] = useState<QrContent>(props.content);
  const [design, setDesign] = useState<QrDesign>(props.design);
  const [nome, setNome] = useState(props.nome);
  const [tags, setTags] = useState<string[]>(props.tags);
  const [tagRascunho, setTagRascunho] = useState("");
  const [larguraMm, setLarguraMm] = useState(40);

  const validacao = validateContent(content);
  const conteudoValido = validacao.ok;

  // O que o código carrega hoje. No dinâmico é sempre o link curto — mudar o
  // destino não muda um pixel do desenho, e é isso que salva o material
  // impresso.
  const data = qrPayload(content, props.isDynamic, props.slug, props.baseUrl);
  const report = avaliarLegibilidade({ design, data, printWidthMm: larguraMm });

  return (
    <div className="grid gap-stack-md lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-stack-md">
        <IdentidadeCard
          {...props}
          nome={nome}
          setNome={setNome}
          tags={tags}
          setTags={setTags}
          tagRascunho={tagRascunho}
          setTagRascunho={setTagRascunho}
        />

        <DestinoCard
          id={props.id}
          isDynamic={props.isDynamic}
          content={content}
          setContent={setContent}
          conteudoValido={conteudoValido}
          errosConteudo={validacao.ok ? {} : validacao.errors}
          original={props.content}
        />

        <RulesCard
          id={props.id}
          isDynamic={props.isDynamic}
          scanCount={props.scanCount}
          {...props.regras}
        />

        <DesignCard id={props.id} design={design} setDesign={setDesign} original={props.design} />

        {props.historico}

        <ZonaPerigo
          id={props.id}
          nome={props.nome}
          onDuplicado={(novoId) => router.push(`/painel/codigos/${novoId}`)}
          onExcluido={() => router.push("/painel/codigos")}
        />
      </div>

      {/* ---------- coluna do código ---------- */}
      <div className="flex flex-col gap-stack-md lg:sticky lg:top-stack-md lg:self-start">
        <Card>
          <CardHeader
            title="O código"
            description={
              props.isDynamic
                ? "Aponta para o link curto. O desenho não muda quando o destino muda."
                : "Conteúdo gravado no desenho. Editar exige um código novo."
            }
          />
          <CardBody className="flex flex-col items-center gap-stack-md">
            <QrPreview data={data} design={design} displaySize={220} />
            <ExportButtons data={data} design={design} nome={nome || "qrcode"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Leituras" />
          <CardBody className="flex flex-col gap-2 text-[13px]">
            <Linha rotulo="Total" valor={props.scanCount.toLocaleString("pt-BR")} />
            <Linha
              rotulo="Únicas"
              valor={props.uniqueScanCount.toLocaleString("pt-BR")}
            />
            <Linha
              rotulo="Última"
              valor={props.lastScanAt ? formatarData(props.lastScanAt) : "nunca"}
            />
            <Linha rotulo="Criado em" valor={formatarData(props.createdAt)} />
            <p className="pt-1 text-[12px] text-on-surface-variant">
              Números de sempre. A quebra por período, aparelho e lugar está
              logo abaixo.
            </p>
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

      {/* Fica fora do fluxo: só a coluna da esquerda precisa dele. */}
      <span className="hidden" aria-hidden>
        <CopyButton value={linkCurto} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="text-on-surface-variant">{rotulo}</span>
      <span className="font-mono text-data text-on-surface">{valor}</span>
    </span>
  );
}

/** Data curta no fuso do produto. */
function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/** Mensagem de sucesso que some sozinha, para não virar entulho na tela. */
function useAviso() {
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function sucesso(texto: string) {
    setErro(null);
    setAviso(texto);
    setTimeout(() => setAviso(null), 4000);
  }

  return { aviso, erro, sucesso, setErro };
}

function Recado({ aviso, erro }: { aviso: string | null; erro: string | null }) {
  if (erro) {
    return (
      <p role="alert" className="text-[12px] text-error">
        {erro}
      </p>
    );
  }
  if (aviso) {
    return (
      <p role="status" className="text-[12px] text-tertiary">
        {aviso}
      </p>
    );
  }
  return null;
}

/* ---------- nome, link curto e etiquetas ---------- */

function IdentidadeCard({
  id,
  slug,
  isDynamic,
  intencao,
  status,
  explicacao,
  baseUrl,
  nome,
  setNome,
  tags,
  setTags,
  tagRascunho,
  setTagRascunho,
}: QrDetailProps & {
  setNome: (v: string) => void;
  setTags: (v: string[]) => void;
  tagRascunho: string;
  setTagRascunho: (v: string) => void;
}) {
  const [salvando, iniciar] = useTransition();
  const { aviso, erro, sucesso, setErro } = useAviso();
  const linkCurto = `${baseUrl}/r/${slug}`;

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
    iniciar(async () => {
      const r = await updateQrMeta({ id, name: nome, folderId: null, tags });
      if (r.ok) sucesso("Salvo.");
      else setErro(r.fieldErrors?.name ?? r.message ?? "Não consegui salvar.");
    });
  }

  return (
    <Card>
      <CardHeader
        title="Identidade"
        description="O nome é só para você. O link curto é o que vai impresso."
      />
      <CardBody className="flex flex-col gap-stack-md">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* Item 5.1: o switch é a intenção; o selo, o estado real. Num QR
                estático não há redirect nosso, então não há o que pausar. */}
            {isDynamic ? (
              <StatusToggle
                id={id}
                intencao={intencao}
                efetivo={status}
                size="md"
              />
            ) : null}
            <StatusPill status={status} glyph="icon" size="md" />
            <Chip tone={isDynamic ? "brand" : "neutral"}>
              {isDynamic ? "Dinâmico" : "Estático"}
            </Chip>
          </div>
          {explicacao ? (
            <p className="text-[12px] text-on-surface-variant">{explicacao}</p>
          ) : null}
        </div>

        <Field label="Nome" htmlFor="det-nome">
          <Input
            id="det-nome"
            value={nome}
            maxLength={120}
            onChange={(e) => setNome(e.target.value)}
          />
        </Field>

        {isDynamic ? (
          <Field
            label="Link curto"
            hint="Este endereço não muda nunca — é o que está impresso."
          >
            <span className="flex items-center gap-2 rounded-control border border-hairline bg-base px-3 py-2">
              <code className="flex-1 truncate font-mono text-data text-secondary">
                {linkCurto}
              </code>
              <CopyButton value={linkCurto} />
            </span>
          </Field>
        ) : null}

        <Field label="Etiquetas" htmlFor="det-tag" hint="Até 10. Enter adiciona.">
          <div className="flex flex-col gap-2">
            <Input
              id="det-tag"
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
            />
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Chip
                    key={t}
                    onRemove={() => setTags(tags.filter((x) => x !== t))}
                    removeLabel={`Remover etiqueta ${t}`}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        </Field>
      </CardBody>
      <CardFooter className="flex items-center justify-between gap-3">
        <Recado aviso={aviso} erro={erro} />
        <Button variant="primary" size="sm" loading={salvando} onClick={salvar}>
          Salvar
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ---------- o destino: o item 4.5 ---------- */

function DestinoCard({
  id,
  isDynamic,
  content,
  setContent,
  conteudoValido,
  errosConteudo,
  original,
}: {
  id: string;
  isDynamic: boolean;
  content: QrContent;
  setContent: (c: QrContent) => void;
  conteudoValido: boolean;
  errosConteudo: ContentErrors;
  original: QrContent;
}) {
  const [salvando, iniciar] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const { aviso, erro, sucesso, setErro } = useAviso();

  const mudou = JSON.stringify(content) !== JSON.stringify(original);
  const meta = metaFor(content.type);

  if (!isDynamic) {
    return (
      <Card>
        <CardHeader
          title="Conteúdo"
          description="Este é um QR estático."
        />
        <CardBody className="flex flex-col gap-3">
          <p className="text-[13px] text-on-surface-variant">
            O conteúdo do tipo{" "}
            <strong className="text-on-surface">{meta.label}</strong> está
            gravado dentro do próprio desenho do código. Não existe destino
            para trocar: qualquer mudança gera um QR diferente, e o que já foi
            impresso continuaria levando ao conteúdo antigo.
          </p>
          <p className="text-[13px] text-on-surface-variant">
            Para poder editar depois de imprimir, crie um QR dinâmico — ele
            aponta para um link curto que fica sob seu controle.
          </p>
        </CardBody>
      </Card>
    );
  }

  function salvar() {
    setErros({});
    iniciar(async () => {
      const r = await updateQrDestination({ id, content });
      if (r.ok) {
        sucesso("Destino trocado. Quem escanear agora já vai para o novo.");
        return;
      }
      setErros(r.fieldErrors ?? {});
      setErro(r.message ?? "Não consegui trocar o destino.");
    });
  }

  return (
    <Card>
      <CardHeader
        title="Destino"
        description="Troque para onde o código leva. O desenho impresso continua o mesmo."
      />
      <CardBody className="flex flex-col gap-stack-md">
        <ContentForm
          content={content}
          onChange={setContent}
          errors={{ ...errosConteudo, ...erros }}
        />
      </CardBody>
      <CardFooter className="flex items-center justify-between gap-3">
        <Recado aviso={aviso} erro={erro} />
        <div className="flex items-center gap-2">
          {mudou ? (
            <Button size="sm" variant="ghost" onClick={() => setContent(original)}>
              Descartar
            </Button>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            loading={salvando}
            disabled={!mudou || !conteudoValido}
            onClick={salvar}
          >
            Trocar destino
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

/* ---------- aparência ---------- */

function DesignCard({
  id,
  design,
  setDesign,
  original,
}: {
  id: string;
  design: QrDesign;
  setDesign: (d: QrDesign) => void;
  original: QrDesign;
}) {
  const [aberto, setAberto] = useState(false);
  const [salvando, iniciar] = useTransition();
  const { aviso, erro, sucesso, setErro } = useAviso();

  const mudou = JSON.stringify(design) !== JSON.stringify(original);

  return (
    <Card>
      <CardHeader
        title="Aparência"
        description="Mudar o desenho gera um código novo para imprimir."
      />
      <CardBody className="flex flex-col gap-stack-md">
        {aberto ? (
          <DesignForm design={design} onChange={setDesign} />
        ) : (
          <Button size="sm" onClick={() => setAberto(true)}>
            Editar aparência
          </Button>
        )}
      </CardBody>
      {aberto ? (
        <CardFooter className="flex items-center justify-between gap-3">
          <Recado aviso={aviso} erro={erro} />
          <div className="flex items-center gap-2">
            {mudou ? (
              <Button size="sm" variant="ghost" onClick={() => setDesign(original)}>
                Descartar
              </Button>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              loading={salvando}
              disabled={!mudou}
              onClick={() =>
                iniciar(async () => {
                  const r = await updateQrDesign({ id, design });
                  if (r.ok) sucesso("Aparência salva.");
                  else setErro(r.message ?? "Não consegui salvar.");
                })
              }
            >
              Salvar aparência
            </Button>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}

/* ---------- duplicar e excluir: o item 4.6 ---------- */

function ZonaPerigo({
  id,
  nome,
  onDuplicado,
  onExcluido,
}: {
  id: string;
  nome: string;
  onDuplicado: (novoId: string) => void;
  onExcluido: () => void;
}) {
  const [duplicando, iniciarDuplicacao] = useTransition();
  const [excluindo, iniciarExclusao] = useTransition();
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  // Digitar o nome inteiro é chato de propósito: excluir um QR já impresso
  // transforma todo o material publicado em papel morto.
  const podeExcluir = confirmacao.trim() === nome.trim();

  return (
    <>
      <Card className="border-error/25">
        <CardHeader
          title="Duplicar ou excluir"
          description="A cópia nasce com um link curto novo e sem histórico."
        />
        <CardBody className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            loading={duplicando}
            onClick={() =>
              iniciarDuplicacao(async () => {
                const r = await duplicateQrCode(id);
                if (r.ok && r.qr) onDuplicado(r.qr.id);
                else setErro(r.message ?? "Não consegui duplicar.");
              })
            }
          >
            Duplicar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setConfirmacao("");
              setErro(null);
              setModalAberto(true);
            }}
          >
            Excluir
          </Button>
          {erro ? (
            <p role="alert" className="text-[12px] text-error">
              {erro}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        dismissible={!excluindo}
        size="sm"
        title="Excluir este QR Code?"
        description="Some para sempre, junto com o histórico de leituras. Quem escanear o código impresso vai bater numa página de erro."
        footer={
          <>
            <Button
              size="sm"
              onClick={() => setModalAberto(false)}
              disabled={excluindo}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={excluindo}
              disabled={!podeExcluir}
              onClick={() =>
                iniciarExclusao(async () => {
                  const r = await deleteQrCode(id);
                  if (r.ok) onExcluido();
                  else {
                    setErro(r.message ?? "Não consegui excluir.");
                    setModalAberto(false);
                  }
                })
              }
            >
              Excluir para sempre
            </Button>
          </>
        }
      >
        <Field
          label={
            <>
              Digite <strong className="text-on-surface">{nome}</strong> para
              confirmar
            </>
          }
          htmlFor="confirmar"
        >
          <Input
            id="confirmar"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="off"
          />
        </Field>
      </Modal>
    </>
  );
}
