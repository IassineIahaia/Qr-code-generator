"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  type AuthState,
} from "@/lib/auth/actions";
import { Field, Input } from "@/components/ui";
import {
  FormError,
  FormSuccess,
  PasswordInput,
  SubmitButton,
} from "./form-parts";

const vazio: AuthState = {};

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [state, action] = useActionState(signIn, vazio);

  return (
    <form action={action} className="flex flex-col gap-stack-md">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <FormError>{state.message}</FormError>

      <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </Field>

      <Field
        label="Senha"
        htmlFor="password"
        error={state.fieldErrors?.password}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      <div className="-mt-1 flex justify-end">
        <Link
          href="/recuperar-senha"
          className="text-[13px] text-primary underline-offset-4 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUp, vazio);

  // Cadastro concluído sem sessão: só falta a pessoa abrir o e-mail.
  if (state.success) {
    return <FormSuccess>{state.success}</FormSuccess>;
  }

  return (
    <form action={action} className="flex flex-col gap-stack-md">
      <FormError>{state.message}</FormError>

      <Field
        label="Nome"
        htmlFor="fullName"
        error={state.fieldErrors?.fullName}
      >
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Como devemos te chamar"
          invalid={Boolean(state.fieldErrors?.fullName)}
          required
        />
      </Field>

      <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </Field>

      <Field
        label="Senha"
        htmlFor="password"
        hint="Pelo menos 8 caracteres."
        error={state.fieldErrors?.password}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      <SubmitButton>Criar conta</SubmitButton>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, vazio);

  if (state.success) {
    return <FormSuccess>{state.success}</FormSuccess>;
  }

  return (
    <form action={action} className="flex flex-col gap-stack-md">
      <FormError>{state.message}</FormError>

      <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </Field>

      <SubmitButton>Enviar link de redefinição</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, vazio);

  return (
    <form action={action} className="flex flex-col gap-stack-md">
      <FormError>{state.message}</FormError>

      <Field
        label="Nova senha"
        htmlFor="password"
        hint="Pelo menos 8 caracteres."
        error={state.fieldErrors?.password}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          invalid={Boolean(state.fieldErrors?.password)}
        />
      </Field>

      <Field
        label="Repita a nova senha"
        htmlFor="confirmPassword"
        error={state.fieldErrors?.confirmPassword}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
      </Field>

      <SubmitButton>Salvar nova senha</SubmitButton>
    </form>
  );
}
