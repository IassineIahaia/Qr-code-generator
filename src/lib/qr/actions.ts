"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type {
  Json,
  QrEffectiveStatus,
  QrEventAction,
} from "@/lib/supabase/types";
import { destinationOf, supportsDynamic } from "./content/encode";
import { searchQrCodes, type QrEncontrado } from "./queries";
import { hashSenha } from "./password";
import { destinoSeguro } from "./rules";
import {
  createQrSchema,
  setStatusSchema,
  updateDesignSchema,
  updateDestinationSchema,
  updateQrMetaSchema,
  updateRulesSchema,
} from "./schemas";
import { EVENTO_POR_STATUS, effectiveStatus } from "./status";
import {
  SLUG_MESSAGES,
  checkSlugFormat,
  generateSlug,
  type SlugProblem,
} from "./slug";

/**
 * Server Actions da Fase 4 — criar, checar slug e apagar.
 *
 * Tudo que grava passa por aqui: o cliente nunca escreve direto no Supabase.
 * O RLS é a segunda linha de defesa, não a primeira.
 */

export interface CreateQrResult {
  ok: boolean;
  /** Erros por campo, no mesmo formato de `validateContent`. */
  fieldErrors?: Record<string, string>;
  /** Erro geral, quando não dá para apontar um campo. */
  message?: string;
  qr?: { id: string; slug: string };
}

/** Código do Postgres para violação de unicidade. */
const UNIQUE_VIOLATION = "23505";

/**
 * Quantas vezes tentamos um slug sorteado antes de desistir. Com 56^6
 * combinações, chegar na terceira tentativa já é um evento improvável — se
 * acontecer sempre, o problema é outro e é melhor falhar visível.
 */
const MAX_TENTATIVAS = 5;

/**
 * O slug está livre?
 *
 * Depende da função `slug_available` (migration 0004), que roda com
 * `security definer` porque o RLS esconderia os códigos dos outros usuários e
 * faria toda checagem responder "livre". Se a função ainda não foi aplicada,
 * devolvemos `unknown` em vez de mentir: a tela some com o selo verde e o
 * índice único continua sendo a garantia real, no momento do insert.
 */
export async function checkSlug(
  slug: string,
): Promise<
  { status: "ok" } | { status: "erro"; message: string } | { status: "unknown" }
> {
  const problema: SlugProblem | null = checkSlugFormat(slug);
  if (problema) return { status: "erro", message: SLUG_MESSAGES[problema] };

  const user = await getCurrentUser();
  if (!user) return { status: "unknown" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("slug_available", {
    candidate: slug.trim(),
  });

  if (error) return { status: "unknown" };
  return data
    ? { status: "ok" }
    : { status: "erro", message: SLUG_MESSAGES.ocupado };
}

export async function createQrCode(input: unknown): Promise<CreateQrResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sua sessão expirou. Entre de novo." };
  }

  const parsed = createQrSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path.join(".");
      if (campo && !fieldErrors[campo]) fieldErrors[campo] = issue.message;
    }
    return {
      ok: false,
      fieldErrors,
      message: "Confira os campos destacados.",
    };
  }

  const { name, content, design, slug, folderId, tags } = parsed.data;

  // Wi-Fi, vCard, Pix e companhia não têm destino navegável para trocar
  // depois: forçá-los a dinâmico geraria um QR que não abre nada.
  const isDynamic = parsed.data.isDynamic && supportsDynamic(content.type);

  const slugPedido = slug.trim();
  if (slugPedido) {
    const problema = checkSlugFormat(slugPedido);
    if (problema) {
      return { ok: false, fieldErrors: { slug: SLUG_MESSAGES[problema] } };
    }
  }

  const supabase = await createClient();

  const linhaBase = {
    user_id: user.id,
    folder_id: folderId,
    name,
    is_dynamic: isDynamic,
    type: content.type,
    content,
    // O destino só existe para o QR dinâmico; o estático carrega a string
    // codificada dentro do próprio desenho.
    destination: isDynamic ? destinationOf(content) : null,
    design,
    tags,
  };

  // Um slug pedido pela pessoa é tentado uma vez só: se está ocupado, ela
  // precisa saber e escolher outro, e não receber um sorteado no lugar.
  const tentativas = slugPedido ? 1 : MAX_TENTATIVAS;

  for (let i = 0; i < tentativas; i++) {
    const candidato = slugPedido || generateSlug();

    const { data, error } = await supabase
      .from("qr_codes")
      .insert({ ...linhaBase, slug: candidato })
      .select("id, slug")
      .single();

    if (!error && data) {
      revalidatePath("/painel");
      revalidatePath("/painel/codigos");
      return { ok: true, qr: { id: data.id, slug: data.slug } };
    }

    if (error?.code === UNIQUE_VIOLATION) {
      if (slugPedido) {
        return { ok: false, fieldErrors: { slug: SLUG_MESSAGES.ocupado } };
      }
      continue; // sorteia outro
    }

    return {
      ok: false,
      message:
        error?.message ??
        "Não foi possível salvar o QR Code. Tente de novo em instantes.",
    };
  }

  return {
    ok: false,
    message: "Não conseguimos gerar um endereço curto livre. Tente de novo.",
  };
}

/** Apaga um QR. O RLS garante que só o dono consegue. */
export async function deleteQrCode(id: string): Promise<CreateQrResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou." };

  const supabase = await createClient();
  const { error } = await supabase.from("qr_codes").delete().eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/painel");
  revalidatePath("/painel/codigos");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Edição — item 4.5                                                  */
/* ------------------------------------------------------------------ */

/** Revalida as três telas que mostram um QR. */
function revalidarQr(id: string) {
  revalidatePath("/painel");
  revalidatePath("/painel/codigos");
  revalidatePath(`/painel/codigos/${id}`);
}

/**
 * Registra no histórico. Falhar aqui não desfaz a edição: o histórico é um
 * diário, não o dado. Melhor perder uma linha de log do que devolver erro
 * numa troca de destino que já aconteceu.
 *
 * Falha calada para o usuário, mas não para quem mantém: o `check` de
 * `qr_events.action` cresce a cada fase, e uma migration não aplicada
 * derrubaria só esta linha — do lado de fora, seria um histórico que
 * misteriosamente não registra nada.
 */
async function registrarEvento(
  supabase: Awaited<ReturnType<typeof createClient>>,
  qrId: string,
  userId: string,
  action: QrEventAction,
  meta: Record<string, unknown> = {},
) {
  const { error } = await supabase
    .from("qr_events")
    .insert({ qr_id: qrId, user_id: userId, action, meta: meta as Json });

  if (error) {
    console.warn(
      `[qr_events] não gravei "${action}" para ${qrId}: ${error.message}`,
    );
  }
}

/**
 * Troca para onde um QR dinâmico aponta.
 *
 * É isto que justifica o QR dinâmico existir: o código impresso continua
 * idêntico, o slug continua o mesmo, só o destino muda. Por isso a action
 * recusa QR estático — nele o conteúdo está gravado no desenho, e "editar"
 * seria mentira.
 */
export async function updateQrDestination(
  input: unknown,
): Promise<CreateQrResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou. Entre de novo." };

  const parsed = updateDestinationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path.join(".");
      if (campo && !fieldErrors[campo]) fieldErrors[campo] = issue.message;
    }
    return { ok: false, fieldErrors, message: "Confira os campos destacados." };
  }

  const { id, content } = parsed.data;
  const supabase = await createClient();

  // Lê antes de gravar: precisamos saber se é dinâmico e qual era o destino
  // anterior, para o histórico fazer sentido.
  const { data: atual, error: erroLeitura } = await supabase
    .from("qr_codes")
    .select("id, is_dynamic, type, destination")
    .eq("id", id)
    .maybeSingle();

  if (erroLeitura) return { ok: false, message: erroLeitura.message };
  if (!atual) return { ok: false, message: "QR Code não encontrado." };

  if (!atual.is_dynamic) {
    return {
      ok: false,
      message:
        "Este QR é estático: o conteúdo está gravado no próprio código e não pode ser trocado. Crie um novo, dinâmico, para poder editar depois.",
    };
  }

  if (!supportsDynamic(content.type)) {
    return {
      ok: false,
      fieldErrors: {
        "content.type":
          "Este tipo de conteúdo não tem endereço para redirecionar. Um QR dinâmico só aceita link ou WhatsApp.",
      },
    };
  }

  const destino = destinationOf(content);

  const { error } = await supabase
    .from("qr_codes")
    .update({
      type: content.type,
      content,
      destination: destino,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  await registrarEvento(supabase, id, user.id, "destination_changed", {
    de: atual.destination,
    para: destino,
  });

  revalidarQr(id);
  return { ok: true, qr: { id, slug: "" } };
}

/** Renomear e reetiquetar. Não toca no código nem no destino. */
export async function updateQrMeta(input: unknown): Promise<CreateQrResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou. Entre de novo." };

  const parsed = updateQrMetaSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path.join(".");
      if (campo && !fieldErrors[campo]) fieldErrors[campo] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const { id, name, folderId, tags } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("qr_codes")
    .update({
      name,
      folder_id: folderId,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  await registrarEvento(supabase, id, user.id, "updated", { name });
  revalidarQr(id);
  return { ok: true };
}

/** Troca a aparência. O conteúdo e o slug ficam como estão. */
export async function updateQrDesign(input: unknown): Promise<CreateQrResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou. Entre de novo." };

  const parsed = updateDesignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Design inválido." };
  }

  const { id, design } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("qr_codes")
    .update({ design, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  await registrarEvento(supabase, id, user.id, "design_changed");
  revalidarQr(id);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Duplicar e excluir — item 4.6                                      */
/* ------------------------------------------------------------------ */

/**
 * Cria uma cópia com slug novo.
 *
 * O slug *não* é copiado, e isso é o ponto: duas linhas com o mesmo endereço
 * curto seriam recusadas pelo índice único, e mesmo que passassem, o
 * redirect não saberia qual das duas seguir. A cópia nasce como um código
 * independente, com o material impresso do original intocado.
 */
export async function duplicateQrCode(id: string): Promise<CreateQrResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou." };

  const supabase = await createClient();

  const { data: original, error: erroLeitura } = await supabase
    .from("qr_codes")
    .select(
      "name, folder_id, is_dynamic, type, content, destination, design, tags",
    )
    .eq("id", id)
    .maybeSingle();

  if (erroLeitura) return { ok: false, message: erroLeitura.message };
  if (!original) return { ok: false, message: "QR Code não encontrado." };

  // Contadores e histórico ficam para trás: a cópia começa do zero, senão
  // as métricas do original apareceriam como se fossem dela.
  const copia = {
    user_id: user.id,
    folder_id: original.folder_id,
    name: `Cópia de ${original.name}`.slice(0, 120),
    is_dynamic: original.is_dynamic,
    type: original.type,
    content: original.content,
    destination: original.destination,
    design: original.design,
    tags: original.tags,
  };

  for (let i = 0; i < MAX_TENTATIVAS; i++) {
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({ ...copia, slug: generateSlug() })
      .select("id, slug")
      .single();

    if (!error && data) {
      await registrarEvento(supabase, data.id, user.id, "created", {
        duplicado_de: id,
      });
      revalidarQr(data.id);
      return { ok: true, qr: { id: data.id, slug: data.slug } };
    }

    if (error?.code === UNIQUE_VIOLATION) continue;
    return { ok: false, message: error?.message ?? "Não consegui duplicar." };
  }

  return {
    ok: false,
    message: "Não conseguimos gerar um endereço curto livre. Tente de novo.",
  };
}

/* ------------------------------------------------------------------ */
/*  Controle — Fase 5                                                  */
/* ------------------------------------------------------------------ */

/**
 * Liga, pausa ou arquiva — item 5.1.
 *
 * A tela faz atualização otimista: o switch vira antes da resposta chegar.
 * Por isso esta action devolve o estado *efetivo* que ficou valendo, e não
 * só `ok`. Sem isso, pausar um código expirado mostraria "ativo" no switch
 * até o próximo F5 — a intenção teria sido gravada, mas o relógio continua
 * mandando, e a tela estaria contando outra história.
 */
export async function setQrStatus(input: unknown): Promise<StatusResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou. Entre de novo." };

  const parsed = setStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Estado inválido." };

  const { id, status } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qr_codes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("status, active_from, expires_at, scan_limit, scan_count")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "QR Code não encontrado." };

  await registrarEvento(supabase, id, user.id, EVENTO_POR_STATUS[status]);

  revalidarQr(id);
  return { ok: true, status: effectiveStatus(data) };
}

export interface StatusResult {
  ok: boolean;
  message?: string;
  /** O estado real depois da mudança — o switch se corrige por ele. */
  status?: QrEffectiveStatus;
}

/**
 * Agendamento, limite, senha, recado de indisponível e regras por
 * dispositivo/país — itens 5.3 a 5.6 e 6.6, num salvamento só.
 *
 * Elas viajam juntas porque o dono as decide juntas, e porque a janela
 * (`activeFrom` × `expiresAt`) só dá para validar vendo as duas pontas.
 */
export async function updateQrRules(input: unknown): Promise<CreateQrResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou. Entre de novo." };

  const parsed = updateRulesSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path.join(".");
      if (campo && !fieldErrors[campo]) fieldErrors[campo] = issue.message;
    }
    return { ok: false, fieldErrors, message: "Confira os campos destacados." };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { data: atual, error: erroLeitura } = await supabase
    .from("qr_codes")
    .select("is_dynamic, active_from, expires_at, scan_limit, password_hash")
    .eq("id", v.id)
    .maybeSingle();

  if (erroLeitura) return { ok: false, message: erroLeitura.message };
  if (!atual) return { ok: false, message: "QR Code não encontrado." };

  // Nada disto existe num QR estático: não há redirect para interceptar, o
  // conteúdo já está gravado no desenho impresso. Aceitar em silêncio seria
  // vender um controle que não funciona.
  if (!atual.is_dynamic) {
    return {
      ok: false,
      message:
        "Um QR estático não passa pelo nosso servidor: o conteúdo está gravado no desenho. Agendamento, limite e senha só existem no QR dinâmico.",
    };
  }

  /**
   * A senha tem três gestos e um campo só: `null` não mexe (o formulário
   * não reenvia a senha a cada salvamento), `""` remove, texto define.
   */
  let passwordHash = atual.password_hash;
  let eventoSenha: QrEventAction | null = null;

  if (v.password !== null) {
    if (v.password === "") {
      if (atual.password_hash) eventoSenha = "password_removed";
      passwordHash = null;
    } else {
      passwordHash = await hashSenha(v.password);
      eventoSenha = "password_set";
    }
  }

  const deviceRules: Record<string, string> = {};
  for (const chave of ["ios", "android", "desktop"] as const) {
    const destino = destinoSeguro(v.deviceRules[chave]);
    if (destino) deviceRules[chave] = destino;
  }

  const geoRules: Record<string, string> = {};
  for (const regra of v.geoRules) {
    const destino = destinoSeguro(regra.url);
    if (destino) geoRules[regra.country] = destino;
  }

  const { error } = await supabase
    .from("qr_codes")
    .update({
      active_from: v.activeFrom,
      expires_at: v.expiresAt,
      scan_limit: v.scanLimit,
      password_hash: passwordHash,
      disabled_behavior: v.disabledBehavior,
      disabled_message: v.disabledMessage || null,
      disabled_redirect_url: destinoSeguro(v.disabledRedirectUrl),
      device_rules: deviceRules as Json,
      geo_rules: geoRules as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", v.id);

  if (error) {
    // `janela_coerente` (migration 0005) barra expiração antes da ativação.
    // O Zod já pega isso antes, mas o banco é a última palavra — e se ele
    // falar, a mensagem tem que apontar o campo, não despejar SQL na tela.
    if (error.message.includes("janela_coerente")) {
      return {
        ok: false,
        fieldErrors: {
          expiresAt: "A expiração tem que vir depois da ativação.",
        },
      };
    }
    return { ok: false, message: error.message };
  }

  // Duas linhas no histórico quando a senha muda: "mexeu nas regras" e
  // "pôs/tirou senha" são coisas que o dono procura separadamente.
  await registrarEvento(supabase, v.id, user.id, "rules_changed", {
    agendamento: { de: atual.active_from, para: v.activeFrom },
    expiracao: { de: atual.expires_at, para: v.expiresAt },
    limite: { de: atual.scan_limit, para: v.scanLimit },
    dispositivos: Object.keys(deviceRules),
    paises: Object.keys(geoRules),
  });

  if (eventoSenha) {
    await registrarEvento(supabase, v.id, user.id, eventoSenha);
  }

  revalidarQr(v.id);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Busca da paleta ⌘K — item 8.3                                      */
/* ------------------------------------------------------------------ */

/**
 * Ponte entre a paleta (client) e a busca (server-only).
 *
 * É uma action e não uma rota porque não há nada de HTTP a decidir aqui —
 * nem cache, nem status, nem formato. O RLS de `qr_codes` continua sendo
 * quem limita o resultado ao dono.
 */
export async function buscarCodigos(termo: string): Promise<QrEncontrado[]> {
  if (typeof termo !== "string") return [];

  const user = await getCurrentUser();
  if (!user) return [];

  return searchQrCodes(termo);
}
