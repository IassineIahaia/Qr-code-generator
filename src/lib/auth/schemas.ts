import { z } from "zod";

/**
 * Validações compartilhadas pelo formulário (browser) e pela Server Action.
 * O mesmo schema nos dois lados evita a clássica divergência entre o que a
 * tela aceita e o que o servidor aceita.
 */

const email = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .email("E-mail inválido.")
  .toLowerCase();

const senha = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");

export const signInSchema = z.object({
  email,
  // No login não repetimos as regras de força: quem já tem conta só precisa
  // acertar a senha, e mensagens de formato aqui só atrapalham.
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "Nome muito longo."),
  email,
  password: senha,
});

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password: senha,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

/* ------------------------------------------------------------------ */
/*  Configurações da conta — item 8.4                                  */
/* ------------------------------------------------------------------ */

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "Nome muito longo."),
});

/**
 * Troca de senha por quem já está dentro.
 *
 * Pede a senha atual, e isso **não** é burocracia: o Supabase troca a senha
 * com a sessão que existe, sem perguntar nada. Sem este campo, qualquer
 * pessoa que passe por um computador destravado assume a conta em dois
 * cliques — e o dono só descobre quando não conseguir mais entrar.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    password: senha,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: "A nova senha precisa ser diferente da atual.",
    path: ["password"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
