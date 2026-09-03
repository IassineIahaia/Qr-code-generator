"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { destinoSeguro } from "./redirect";
import {
  changePasswordSchema,
  newPasswordSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
} from "./schemas";

/**
 * Resultado padrão de toda action de auth.
 * `fieldErrors` alimenta a mensagem embaixo de cada campo; `message` é o
 * erro geral (credencial inválida, e-mail já usado); `success` é o aviso
 * de sucesso quando não há redirect.
 */
export interface AuthState {
  message?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

/** Base absoluta desta requisição, para montar os links dos e-mails. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Traduz os erros do Supabase, que vêm em inglês e às vezes vazam detalhes
 * demais. Também evita a enumeração de contas: quem erra e-mail ou senha
 * recebe a mesma mensagem nos dois casos.
 */
function traduzErro(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com este e-mail.";
    case "weak_password":
      return "Senha muito fraca. Use pelo menos 8 caracteres.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas. Espere alguns minutos e tente de novo.";
    case "same_password":
      return "A nova senha precisa ser diferente da atual.";
    default:
      return fallback;
  }
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: campoErros(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Lido pelo trigger handle_new_user para preencher public.profiles.
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await origin()}/auth/confirmar`,
    },
  });

  if (error) {
    return { message: traduzErro(error.code, "Não foi possível criar a conta.") };
  }

  // Com confirmação de e-mail ligada, o Supabase devolve um usuário sem
  // sessão. Sem confirmação, já vem sessão e podemos ir direto ao painel.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/painel");
  }

  return {
    success:
      "Conta criada. Enviamos um link de confirmação para o seu e-mail — abra-o para ativar o acesso.",
  };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: campoErros(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: traduzErro(error.code, "Não foi possível entrar.") };
  }

  const destino = formData.get("redirectTo");
  revalidatePath("/", "layout");
  redirect(destinoSeguro(typeof destino === "string" ? destino : null));
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { fieldErrors: campoErros(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${await origin()}/auth/confirmar?next=/nova-senha` },
  );

  // De propósito não distinguimos "e-mail existe" de "não existe": responder
  // diferente entregaria a lista de quem tem conta aqui.
  if (error && error.code?.includes("rate_limit")) {
    return { message: traduzErro(error.code, "Tente de novo em alguns minutos.") };
  }

  return {
    success:
      "Se existir uma conta com este e-mail, o link de redefinição já está a caminho.",
  };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: campoErros(parsed.error) };
  }

  const supabase = await createClient();

  // Só chega aqui quem abriu o link do e-mail, que cria uma sessão de
  // recuperação. Sem ela, updateUser não teria a quem aplicar a senha.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message:
        "O link expirou ou já foi usado. Peça um novo e-mail de redefinição.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      message: traduzErro(error.code, "Não foi possível alterar a senha."),
    };
  }

  revalidatePath("/", "layout");
  redirect("/painel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}

/** Login social. Só aparece na tela quando o provedor está configurado. */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/confirmar` },
  });

  if (error || !data.url) {
    redirect("/entrar?erro=oauth");
  }

  redirect(data.url);
}

/** Achata os erros do Zod em `{ campo: primeira mensagem }`. */
function campoErros(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "");
    if (campo && !out[campo]) out[campo] = issue.message;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Configurações da conta — item 8.4                                  */
/* ------------------------------------------------------------------ */

/**
 * Troca o nome que aparece no menu, na saudação do painel e no histórico.
 *
 * Grava nos **dois** lugares: `profiles.full_name`, que é o que as telas
 * leem, e o `user_metadata` do Supabase, que é o que sobra caso o perfil
 * um dia não exista (a trigger falhou, a linha foi apagada à mão). São a
 * mesma informação em dois lugares porque o produto lê dos dois.
 */
export async function updateProfile(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) return { fieldErrors: campoErros(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { message: "Sua sessão expirou. Entre de novo." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) {
    return { message: "Não consegui salvar seu nome. Tente de novo." };
  }

  await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  // O nome aparece no shell, que é layout: revalidar só a página deixaria o
  // menu com o nome velho até o próximo recarregamento.
  revalidatePath("/painel", "layout");
  return { success: "Nome salvo." };
}

/**
 * Troca a senha de quem já está logado.
 *
 * A senha atual é conferida de verdade, e o único jeito honesto de fazer
 * isso com o Supabase é tentar entrar com ela. É uma ida a mais ao servidor
 * de auth, e ela paga por si: `updateUser` sozinho trocaria a senha só com
 * a sessão aberta, sem nunca perguntar quem é.
 */
export async function changePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) return { fieldErrors: campoErros(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { message: "Sua sessão expirou. Entre de novo." };

  const { error: erroDeSenha } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (erroDeSenha) {
    return { fieldErrors: { currentPassword: "Senha atual incorreta." } };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      message: traduzErro(error.code, "Não foi possível alterar a senha."),
    };
  }

  revalidatePath("/", "layout");
  return { success: "Senha alterada. Ela já vale no próximo acesso." };
}
