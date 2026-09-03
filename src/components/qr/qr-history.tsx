import {
  ArrowRightLeft,
  CalendarClock,
  CircleCheck,
  Copy,
  Gauge,
  KeyRound,
  KeySquare,
  Palette,
  Pause,
  Pencil,
  Plus,
  SlidersHorizontal,
  TimerOff,
  type LucideIcon,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui";
import type { QrEventoResumo } from "@/lib/qr/queries";
import { formatarData } from "@/lib/qr/status";
import type { Json, QrEventAction } from "@/lib/supabase/types";

/**
 * O histórico de alterações — item 5.8.
 *
 * As linhas já vinham sendo gravadas desde o item 4.5: toda action que muda
 * um QR chama `registrarEvento`. O que faltava era mostrá-las.
 *
 * A pergunta que esta seção responde é sempre a mesma, e é uma pergunta de
 * emergência: *"o código impresso parou de funcionar — o que mudou?"*. Por
 * isso a lista é cronológica invertida e cada linha diz o que mudou de quê
 * para quê, e não só que "houve uma atualização".
 */

interface Estilo {
  icon: LucideIcon;
  cor: string;
  /** Frase base. O detalhe do `meta` entra depois, quando existe. */
  texto: string;
}

const ESTILOS: Record<QrEventAction, Estilo> = {
  created: { icon: Plus, cor: "text-tertiary", texto: "Código criado" },
  updated: { icon: Pencil, cor: "text-on-surface-variant", texto: "Identidade editada" },
  destination_changed: {
    icon: ArrowRightLeft,
    cor: "text-primary",
    texto: "Destino trocado",
  },
  activated: { icon: CircleCheck, cor: "text-tertiary", texto: "Ativado" },
  paused: { icon: Pause, cor: "text-on-surface-variant", texto: "Pausado" },
  scheduled: { icon: CalendarClock, cor: "text-secondary", texto: "Agendado" },
  expired: { icon: TimerOff, cor: "text-error", texto: "Expirou" },
  limit_reached: { icon: Gauge, cor: "text-warning", texto: "Limite de leituras atingido" },
  design_changed: { icon: Palette, cor: "text-secondary", texto: "Aparência alterada" },
  moved: { icon: Copy, cor: "text-on-surface-variant", texto: "Movido de pasta" },
  restored: { icon: CircleCheck, cor: "text-tertiary", texto: "Restaurado" },
  rules_changed: {
    icon: SlidersHorizontal,
    cor: "text-secondary",
    texto: "Regras alteradas",
  },
  password_set: { icon: KeyRound, cor: "text-warning", texto: "Senha definida" },
  password_removed: { icon: KeySquare, cor: "text-on-surface-variant", texto: "Senha removida" },
};

export function QrHistory({ eventos }: { eventos: QrEventoResumo[] }) {
  return (
    <Card>
      <CardHeader
        title="Histórico"
        description="O que mudou neste código, do mais recente para o mais antigo."
      />
      <CardBody>
        {eventos.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant">
            Nada por aqui ainda. Cada edição de destino, aparência ou regra
            aparece nesta lista.
          </p>
        ) : (
          <ol className="flex flex-col">
            {eventos.map((evento, i) => (
              <Linha
                key={evento.id}
                evento={evento}
                ultima={i === eventos.length - 1}
              />
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

function Linha({
  evento,
  ultima,
}: {
  evento: QrEventoResumo;
  ultima: boolean;
}) {
  const estilo = ESTILOS[evento.action] ?? ESTILOS.updated;
  const Icon = estilo.icon;
  const detalhe = detalharEvento(evento.action, evento.meta);

  return (
    <li className="flex gap-3">
      {/* A linha vertical que costura os pontos. Não desce no último item,
          senão a régua pareceria continuar para um evento que não existe. */}
      <div className="flex flex-col items-center">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-low ${estilo.cor}`}
        >
          <Icon size={14} aria-hidden />
        </span>
        {ultima ? null : <span className="w-px flex-1 bg-hairline" aria-hidden />}
      </div>

      <div className={`flex flex-col gap-0.5 ${ultima ? "pb-0" : "pb-stack-md"}`}>
        <span className="text-[13px] text-on-surface">{estilo.texto}</span>
        {detalhe ? (
          <span className="text-[12px] break-all text-on-surface-variant">
            {detalhe}
          </span>
        ) : null}
        <span className="text-[11px] text-on-surface-variant/70">
          <time dateTime={evento.created_at}>
            {formatarData(evento.created_at)}
          </time>
          {evento.autor ? ` · ${evento.autor}` : " · automático"}
        </span>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Traduz o `meta` de cada evento para uma frase.
 *
 * O `meta` é `jsonb` livre e foi gravado por versões diferentes do código,
 * então tudo aqui é leitura defensiva: campo que não estiver no formato
 * esperado simplesmente não vira texto. Um histórico com uma linha menos
 * detalhada é melhor que uma tela que quebra por causa de um log antigo.
 */
function detalharEvento(action: QrEventAction, meta: Json): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const m = meta as Record<string, Json | undefined>;

  if (action === "destination_changed") {
    const de = texto(m.de);
    const para = texto(m.para);
    if (para) return de ? `${de} → ${para}` : `Agora aponta para ${para}`;
    return null;
  }

  if (action === "created" && texto(m.duplicado_de)) {
    return "Cópia de outro código";
  }

  if (action === "updated" && texto(m.name)) {
    return `Agora se chama "${texto(m.name)}"`;
  }

  if (action === "rules_changed") {
    const partes = [
      mudancaDeData("Ativação", m.agendamento),
      mudancaDeData("Expiração", m.expiracao),
      mudancaDeLimite(m.limite),
      lista("Aparelhos", m.dispositivos),
      lista("Países", m.paises),
    ].filter(Boolean);

    return partes.length ? partes.join(" · ") : null;
  }

  return null;
}

function texto(v: Json | undefined): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

/** `{ de, para }` de um campo de data, já formatado no fuso do produto. */
function mudancaDeData(rotulo: string, v: Json | undefined): string | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const par = v as Record<string, Json | undefined>;

  const de = texto(par.de);
  const para = texto(par.para);
  if (de === para) return null;

  if (!para) return `${rotulo} removida`;
  return `${rotulo}: ${formatarData(para)}`;
}

function mudancaDeLimite(v: Json | undefined): string | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const par = v as Record<string, Json | undefined>;

  const de = typeof par.de === "number" ? par.de : null;
  const para = typeof par.para === "number" ? par.para : null;
  if (de === para) return null;

  return para === null
    ? "Limite removido"
    : `Limite: ${para.toLocaleString("pt-BR")} leituras`;
}

function lista(rotulo: string, v: Json | undefined): string | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  const itens = v.filter((x): x is string => typeof x === "string");
  return itens.length ? `${rotulo}: ${itens.join(", ")}` : null;
}
