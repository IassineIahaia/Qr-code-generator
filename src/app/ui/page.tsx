"use client";

import { Copy, Download, Link2, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AmbientOrbs,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  Field,
  IconButton,
  Input,
  Kbd,
  Modal,
  Select,
  StatCard,
  StatusPill,
  Table,
  TableWrap,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Toggle,
  Tr,
} from "@/components/ui";
import type { QrEffectiveStatus } from "@/lib/supabase/types";

const STATUSES: QrEffectiveStatus[] = [
  "active",
  "paused",
  "scheduled",
  "expired",
  "limit_reached",
  "archived",
];

const ROWS = [
  {
    name: "Campanha Verão 2024",
    slug: "qrpro.link/v24",
    type: "URL",
    destination: "https://minhaempresa.com.br/promocao-verao-2024",
    scans: 1248,
    status: "active" as QrEffectiveStatus,
  },
  {
    name: "Cardápio Digital",
    slug: "qrpro.link/menu",
    type: "PDF",
    destination: "https://storage.qrpro.com/files/menu_v3.pdf",
    scans: 342,
    status: "paused" as QrEffectiveStatus,
  },
  {
    name: "Pré-lançamento",
    slug: "qrpro.link/drop",
    type: "URL",
    destination: "https://minhaempresa.com.br/lancamento",
    scans: 0,
    status: "scheduled" as QrEffectiveStatus,
  },
];

/** Vitrine interna dos componentes base. Não faz parte do produto. */
export default function UiKitPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState<Record<string, boolean>>({
    "qrpro.link/v24": true,
    "qrpro.link/menu": false,
    "qrpro.link/drop": true,
  });

  return (
    <>
      <AmbientOrbs />
      <main className="relative z-10 mx-auto flex max-w-app flex-col gap-stack-lg px-margin-mobile py-stack-lg md:px-gutter">
        <header className="flex flex-col gap-2">
          <span className="font-mono text-caption tracking-[0.14em] text-primary uppercase">
            Design system · Deep Obsidian Precision
          </span>
          <h1 className="font-display text-headline-lg text-on-surface">
            Componentes base
          </h1>
          <p className="max-w-prose text-on-surface-variant">
            Vitrine dos componentes de{" "}
            <code className="font-mono text-data text-secondary">
              src/components/ui
            </code>
            . Serve de referência visual enquanto as telas da Fase 8 são
            montadas.
          </p>
        </header>

        <section className="flex flex-col gap-stack-md">
          <h2 className="font-display text-title text-on-surface">Botões</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" icon={<Plus size={16} />}>
              Criar QR Code
            </Button>
            <Button variant="secondary" icon={<Download size={16} />}>
              Exportar CSV
            </Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="danger" icon={<Trash2 size={16} />}>
              Excluir
            </Button>
            <Button variant="link">Saiba mais</Button>
            <Button variant="primary" loading>
              Salvando
            </Button>
            <Button variant="secondary" disabled>
              Indisponível
            </Button>
            <IconButton label="Copiar link">
              <Copy size={18} />
            </IconButton>
          </div>
        </section>

        <section className="flex flex-col gap-stack-md">
          <h2 className="font-display text-title text-on-surface">
            Estados do QR
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {STATUSES.map((status) => (
              <StatusPill key={status} status={status} glyph="icon" size="md" />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="success">Status: Ativo</Chip>
            <Chip tone="data" onRemove={() => {}}>
              Tipo: URL
            </Chip>
            <Chip tone="brand">Pasta: Campanhas</Chip>
            <Chip tone="neutral">42 códigos</Chip>
          </div>
        </section>

        <section className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Scans (30d)"
            value="12.480"
            delta={18.4}
            hint="vs. período anterior"
          />
          <StatCard
            label="Scans únicos"
            value="9.117"
            delta={-3.2}
            hint="vs. período anterior"
          />
          <StatCard label="QR ativos" value="38" delta={0} hint="de 42 códigos" />
          <StatCard label="Taxa de leitura" value="94%" hint="média do mês" />
        </section>

        <section className="grid gap-stack-md lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Campos"
              description="Poço escuro, hairline e brilho laranja no foco."
            />
            <CardBody className="flex flex-col gap-stack-md">
              <Field label="Nome do código" required htmlFor="nome">
                <Input id="nome" placeholder="Campanha Verão 2024" />
              </Field>
              <Field
                label="Buscar"
                hint="Nome, destino ou link curto."
                htmlFor="busca"
              >
                <Input
                  id="busca"
                  icon={<Search size={18} />}
                  trailing={
                    <>
                      <Kbd>⌘</Kbd>
                      <Kbd>K</Kbd>
                    </>
                  }
                  placeholder="Buscar / Pular para..."
                />
              </Field>
              <Field label="Link curto" htmlFor="slug">
                <Input id="slug" mono defaultValue="qrpro.link/v24" />
              </Field>
              <Field label="Tipo" htmlFor="tipo">
                <Select id="tipo" defaultValue="url">
                  <option value="url">URL</option>
                  <option value="pix">PIX</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="wifi">Wi-Fi</option>
                </Select>
              </Field>
              <Field
                label="Slug"
                error="Este link curto já está em uso."
                htmlFor="slug-erro"
              >
                <Input id="slug-erro" mono invalid defaultValue="menu" />
              </Field>
              <Field label="Mensagem quando pausado" htmlFor="msg">
                <Textarea
                  id="msg"
                  placeholder="Este QR Code está temporariamente indisponível."
                />
              </Field>
              <div className="flex flex-col gap-3">
                <Toggle label="Ativar código" defaultChecked>
                  Código ativo
                </Toggle>
                <Toggle label="Exigir senha">Exigir senha</Toggle>
                <Toggle label="Salvando" pending defaultChecked>
                  Salvando…
                </Toggle>
                <label className="flex items-center gap-2 text-label text-on-surface">
                  <Checkbox defaultChecked /> Registrar scans anônimos
                </label>
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-stack-md">
            <Card tone="elevated">
              <CardHeader
                title="Card elevado"
                description="Para peças que flutuam sobre o conteúdo."
                action={<Button size="sm">Ação</Button>}
              />
              <CardBody className="text-on-surface-variant">
                Profundidade vem de camadas tonais e hairlines, não de sombras.
                Sombra só em modal e barra flutuante.
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Modal"
                description="Sobre o elemento dialog nativo do navegador."
              />
              <CardBody>
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  Abrir modal de controle
                </Button>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="flex flex-col gap-stack-md">
          <h2 className="font-display text-title text-on-surface">Tabela</h2>
          <TableWrap>
            <Table>
              <THead>
                <Tr static>
                  <Th className="w-12">
                    <Checkbox aria-label="Selecionar todos" />
                  </Th>
                  <Th className="min-w-[200px]">Nome &amp; link curto</Th>
                  <Th className="w-[100px]">Tipo</Th>
                  <Th className="min-w-[180px]">Destino</Th>
                  <Th className="w-[100px]">Scans</Th>
                  <Th className="w-[140px]">Status</Th>
                  <Th className="w-[80px]">Ativo</Th>
                </Tr>
              </THead>
              <TBody>
                {ROWS.map((row) => (
                  <Tr key={row.slug}>
                    <Td>
                      <Checkbox aria-label={`Selecionar ${row.name}`} />
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface transition-colors group-hover:text-primary">
                          {row.name}
                        </span>
                        <span className="font-mono text-[11px] text-secondary-dim">
                          {row.slug}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                        <Link2 size={14} />
                        {row.type}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="block max-w-[180px] truncate text-[12px] text-on-surface-variant"
                        title={row.destination}
                      >
                        {row.destination}
                      </span>
                    </Td>
                    <Td className="font-mono tabular-nums">
                      {row.scans.toLocaleString("pt-BR")}
                    </Td>
                    <Td>
                      <StatusPill status={row.status} />
                    </Td>
                    <Td>
                      <Toggle
                        size="sm"
                        label={`Ativar ${row.name}`}
                        checked={active[row.slug]}
                        onCheckedChange={(next) =>
                          setActive((prev) => ({ ...prev, [row.slug]: next }))
                        }
                      />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </section>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Pausar QR Code"
        description="Quem escanear verá a página de indisponível. O código impresso continua válido."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Pausar código
            </Button>
          </>
        }
      >
        <Field label="Mensagem exibida" htmlFor="modal-msg">
          <Textarea
            id="modal-msg"
            rows={3}
            defaultValue="Voltamos em breve. Acompanhe nossas redes."
          />
        </Field>
      </Modal>
    </>
  );
}
