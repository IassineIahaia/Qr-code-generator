"use client";

import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { QR_TYPES, emptyContent } from "@/lib/qr/content";
import type {
  ContentErrors,
  EmailContent,
  PixContent,
  QrContent,
  QrContentType,
  SmsContent,
  TextContent,
  UrlContent,
  VCardContent,
  WhatsAppContent,
  WifiContent,
} from "@/lib/qr/content";
import { cn } from "@/lib/utils";

/**
 * Passo "conteúdo" da criação de um QR (item 4.2), isolado num componente
 * para a bancada de `/ui/qr` e o fluxo real usarem exatamente o mesmo
 * formulário. Só cuida dos campos; quem valida é `validateContent`.
 */

export interface ContentFormProps {
  content: QrContent;
  onChange: (content: QrContent) => void;
  errors?: ContentErrors;
}

/** Grade de cartões para escolher o tipo. */
export function ContentTypePicker({
  value,
  onChange,
}: {
  value: QrContentType;
  onChange: (content: QrContent) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de conteúdo"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {QR_TYPES.map((meta) => {
        const ativo = meta.type === value;
        return (
          <button
            key={meta.type}
            type="button"
            role="radio"
            aria-checked={ativo}
            title={meta.description}
            onClick={() => onChange(emptyContent(meta.type))}
            className={cn(
              "flex flex-col gap-1 rounded-control border p-3 text-left transition-colors",
              ativo
                ? "border-brand/60 bg-primary-container/12 text-on-surface"
                : "border-hairline bg-base text-on-surface-variant hover:border-brand/30 hover:text-on-surface",
            )}
          >
            <span className="text-label">{meta.label}</span>
            <span className="text-[11px] leading-snug opacity-70">
              {meta.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ContentForm({ content, onChange, errors = {} }: ContentFormProps) {
  /** Troca um campo mantendo o discriminante — o `type` nunca muda por aqui. */
  function set<T extends QrContent, K extends keyof T>(
    atual: T,
    chave: K,
    valor: T[K],
  ) {
    onChange({ ...atual, [chave]: valor } as QrContent);
  }

  switch (content.type) {
    case "url":
      return <UrlFields c={content} set={set} errors={errors} />;
    case "text":
      return <TextFields c={content} set={set} errors={errors} />;
    case "pix":
      return <PixFields c={content} set={set} errors={errors} />;
    case "whatsapp":
      return <WhatsAppFields c={content} set={set} errors={errors} />;
    case "wifi":
      return <WifiFields c={content} set={set} errors={errors} />;
    case "vcard":
      return <VCardFields c={content} set={set} errors={errors} />;
    case "email":
      return <EmailFields c={content} set={set} errors={errors} />;
    case "sms":
      return <SmsFields c={content} set={set} errors={errors} />;
  }
}

/* ------------------------------------------------------------------ */

type Setter = <T extends QrContent, K extends keyof T>(
  atual: T,
  chave: K,
  valor: T[K],
) => void;

interface FieldsProps<T> {
  c: T;
  set: Setter;
  errors: ContentErrors;
}

const grade = "grid gap-stack-md sm:grid-cols-2";

function UrlFields({ c, set, errors }: FieldsProps<UrlContent>) {
  return (
    <Field
      label="Endereço"
      htmlFor="url"
      error={errors.url}
      hint="Sem `https://` a gente completa para você."
      required
    >
      <Input
        id="url"
        value={c.url}
        onChange={(e) => set(c, "url", e.target.value)}
        invalid={!!errors.url}
        placeholder="loja.com.br/promocao"
        inputMode="url"
        mono
      />
    </Field>
  );
}

function TextFields({ c, set, errors }: FieldsProps<TextContent>) {
  return (
    <Field
      label="Texto"
      htmlFor="text"
      error={errors.text}
      hint={`${c.text.length}/1200 — quanto mais curto, mais fácil de ler.`}
      required
    >
      <Textarea
        id="text"
        value={c.text}
        onChange={(e) => set(c, "text", e.target.value)}
        invalid={!!errors.text}
        placeholder="Bem-vindo! Retire seu cupom no caixa."
      />
    </Field>
  );
}

function PixFields({ c, set, errors }: FieldsProps<PixContent>) {
  return (
    <div className="flex flex-col gap-stack-md">
      <Field
        label="Chave Pix"
        htmlFor="pix-key"
        error={errors.key}
        hint="CPF, CNPJ, telefone com +55, e-mail ou chave aleatória."
        required
      >
        <Input
          id="pix-key"
          value={c.key}
          onChange={(e) => set(c, "key", e.target.value)}
          invalid={!!errors.key}
          placeholder="voce@exemplo.com"
          mono
        />
      </Field>

      <div className={grade}>
        <Field
          label="Nome de quem recebe"
          htmlFor="pix-nome"
          error={errors.merchantName}
          required
        >
          <Input
            id="pix-nome"
            value={c.merchantName}
            onChange={(e) => set(c, "merchantName", e.target.value)}
            invalid={!!errors.merchantName}
            maxLength={25}
            placeholder="Padaria do Bairro"
          />
        </Field>
        <Field
          label="Cidade"
          htmlFor="pix-cidade"
          error={errors.merchantCity}
          required
        >
          <Input
            id="pix-cidade"
            value={c.merchantCity}
            onChange={(e) => set(c, "merchantCity", e.target.value)}
            invalid={!!errors.merchantCity}
            maxLength={15}
            placeholder="São Paulo"
          />
        </Field>
      </div>

      <div className={grade}>
        <Field
          label="Valor"
          htmlFor="pix-valor"
          error={errors.amount}
          hint="Deixe em branco para o pagador escolher."
        >
          <Input
            id="pix-valor"
            type="number"
            min={0}
            step="0.01"
            value={c.amount ?? ""}
            onChange={(e) =>
              set(c, "amount", e.target.value === "" ? null : Number(e.target.value))
            }
            invalid={!!errors.amount}
            placeholder="0,00"
            mono
          />
        </Field>
        <Field
          label="Identificador"
          htmlFor="pix-txid"
          error={errors.txid}
          hint="Aparece na sua conciliação. Só letras e números."
        >
          <Input
            id="pix-txid"
            value={c.txid}
            onChange={(e) => set(c, "txid", e.target.value)}
            invalid={!!errors.txid}
            maxLength={25}
            placeholder="PEDIDO1042"
            mono
          />
        </Field>
      </div>

      <Field
        label="Mensagem"
        htmlFor="pix-desc"
        error={errors.description}
        hint="Aparece no app do pagador."
      >
        <Input
          id="pix-desc"
          value={c.description}
          onChange={(e) => set(c, "description", e.target.value)}
          invalid={!!errors.description}
          maxLength={72}
          placeholder="Almoço executivo"
        />
      </Field>
    </div>
  );
}

function WhatsAppFields({ c, set, errors }: FieldsProps<WhatsAppContent>) {
  return (
    <div className="flex flex-col gap-stack-md">
      <div className="grid gap-stack-md sm:grid-cols-[110px_1fr]">
        <Field label="País" htmlFor="wa-pais" error={errors.countryCode} required>
          <Input
            id="wa-pais"
            value={c.countryCode}
            onChange={(e) => set(c, "countryCode", e.target.value)}
            invalid={!!errors.countryCode}
            inputMode="numeric"
            placeholder="55"
            mono
          />
        </Field>
        <Field
          label="Número com DDD"
          htmlFor="wa-num"
          error={errors.phone}
          required
        >
          <Input
            id="wa-num"
            value={c.phone}
            onChange={(e) => set(c, "phone", e.target.value)}
            invalid={!!errors.phone}
            inputMode="tel"
            placeholder="11 98888-7777"
            mono
          />
        </Field>
      </div>
      <Field
        label="Mensagem"
        htmlFor="wa-msg"
        error={errors.message}
        hint="Já vem digitada na conversa; a pessoa só aperta enviar."
      >
        <Textarea
          id="wa-msg"
          rows={3}
          value={c.message}
          onChange={(e) => set(c, "message", e.target.value)}
          invalid={!!errors.message}
          placeholder="Olá! Vim pelo QR Code e quero saber mais."
        />
      </Field>
    </div>
  );
}

function WifiFields({ c, set, errors }: FieldsProps<WifiContent>) {
  const aberta = c.encryption === "nopass";
  return (
    <div className="flex flex-col gap-stack-md">
      <Field label="Nome da rede (SSID)" htmlFor="wifi-ssid" error={errors.ssid} required>
        <Input
          id="wifi-ssid"
          value={c.ssid}
          onChange={(e) => set(c, "ssid", e.target.value)}
          invalid={!!errors.ssid}
          maxLength={32}
          placeholder="Cafe_Convidados"
          mono
        />
      </Field>

      <div className={grade}>
        <Field label="Segurança" htmlFor="wifi-enc">
          <Select
            id="wifi-enc"
            value={c.encryption}
            onChange={(e) =>
              set(c, "encryption", e.target.value as WifiContent["encryption"])
            }
          >
            <option value="WPA">WPA / WPA2 / WPA3</option>
            <option value="WEP">WEP (antigo)</option>
            <option value="nopass">Rede aberta, sem senha</option>
          </Select>
        </Field>
        <Field
          label="Senha"
          htmlFor="wifi-pass"
          error={errors.password}
          hint={aberta ? "Rede aberta não usa senha." : undefined}
        >
          <Input
            id="wifi-pass"
            value={c.password}
            onChange={(e) => set(c, "password", e.target.value)}
            invalid={!!errors.password}
            disabled={aberta}
            maxLength={63}
            mono
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-label text-on-surface-variant">
        <Checkbox
          checked={c.hidden}
          onChange={(e) => set(c, "hidden", e.target.checked)}
        />
        A rede não aparece na lista (SSID oculto)
      </label>
    </div>
  );
}

function VCardFields({ c, set, errors }: FieldsProps<VCardContent>) {
  const texto = (
    chave: keyof VCardContent,
    label: string,
    extra?: { placeholder?: string; hint?: string },
  ) => (
    <Field
      label={label}
      htmlFor={`vc-${chave}`}
      error={errors[chave]}
      hint={extra?.hint}
    >
      <Input
        id={`vc-${chave}`}
        value={c[chave] as string}
        onChange={(e) => set(c, chave, e.target.value as never)}
        invalid={!!errors[chave]}
        placeholder={extra?.placeholder}
      />
    </Field>
  );

  return (
    <div className="flex flex-col gap-stack-md">
      <div className={grade}>
        {texto("firstName", "Nome", { placeholder: "Iassine" })}
        {texto("lastName", "Sobrenome", { placeholder: "Iahaia" })}
      </div>
      <div className={grade}>
        {texto("organization", "Empresa")}
        {texto("title", "Cargo")}
      </div>
      <div className={grade}>
        {texto("phoneMobile", "Celular", { placeholder: "+55 11 98888-7777" })}
        {texto("phoneWork", "Telefone comercial")}
      </div>
      <div className={grade}>
        {texto("email", "E-mail")}
        {texto("website", "Site")}
      </div>
      {texto("street", "Endereço")}
      <div className={grade}>
        {texto("city", "Cidade")}
        {texto("state", "Estado")}
      </div>
      <div className={grade}>
        {texto("zip", "CEP")}
        {texto("country", "País")}
      </div>
      <Field label="Observação" htmlFor="vc-note" error={errors.note}>
        <Textarea
          id="vc-note"
          rows={2}
          value={c.note}
          onChange={(e) => set(c, "note", e.target.value)}
        />
      </Field>
    </div>
  );
}

function EmailFields({ c, set, errors }: FieldsProps<EmailContent>) {
  return (
    <div className="flex flex-col gap-stack-md">
      <Field label="Para" htmlFor="mail-to" error={errors.to} required>
        <Input
          id="mail-to"
          type="email"
          value={c.to}
          onChange={(e) => set(c, "to", e.target.value)}
          invalid={!!errors.to}
          placeholder="contato@empresa.com.br"
          mono
        />
      </Field>
      <Field label="Assunto" htmlFor="mail-sub" error={errors.subject}>
        <Input
          id="mail-sub"
          value={c.subject}
          onChange={(e) => set(c, "subject", e.target.value)}
          invalid={!!errors.subject}
          placeholder="Pedido de orçamento"
        />
      </Field>
      <Field label="Mensagem" htmlFor="mail-body" error={errors.body}>
        <Textarea
          id="mail-body"
          rows={3}
          value={c.body}
          onChange={(e) => set(c, "body", e.target.value)}
          invalid={!!errors.body}
        />
      </Field>
    </div>
  );
}

function SmsFields({ c, set, errors }: FieldsProps<SmsContent>) {
  return (
    <div className="flex flex-col gap-stack-md">
      <Field label="Número" htmlFor="sms-num" error={errors.phone} required>
        <Input
          id="sms-num"
          value={c.phone}
          onChange={(e) => set(c, "phone", e.target.value)}
          invalid={!!errors.phone}
          inputMode="tel"
          placeholder="+55 11 98888-7777"
          mono
        />
      </Field>
      <Field label="Mensagem" htmlFor="sms-msg" error={errors.message}>
        <Textarea
          id="sms-msg"
          rows={3}
          value={c.message}
          onChange={(e) => set(c, "message", e.target.value)}
          invalid={!!errors.message}
        />
      </Field>
    </div>
  );
}
