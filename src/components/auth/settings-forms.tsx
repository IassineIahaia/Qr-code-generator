"use client";

import { useActionState } from "react";
import {
  changePassword,
  updateProfile,
  type AuthState,
} from "@/lib/auth/actions";
import { Field, Input } from "@/components/ui";
import { FormError, FormSuccess, PasswordInput, SubmitButton } from "./form-parts";

const vazio: AuthState = {};

/**
 * Os formulários das configurações — item 8.4.
 *
 * Cada bloco salva sozinho, pelo mesmo motivo do detalhe do QR: trocar o
 * nome que aparece no menu e trocar a senha da conta são decisões de
 * naturezas diferentes, e um "salvar tudo" no rodapé faria as duas
 * parecerem a mesma coisa.
 */

export function PerfilForm({ nome }: { nome: string }) {
  const [state, action] = useActionState(updateProfile, vazio);

  return (
    <form action={action} className="flex flex-col gap-stack-md">
      <FormError>{state.message}</FormError>
      <FormSuccess>{state.success}</FormSuccess>

      <Field
        label="Nome"
        htmlFor="fullName"
        error={state.fieldErrors?.fullName}
        hint="Aparece na saudação do painel e no histórico de alterações."
      >
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          defaultValue={nome}
          invalid={Boolean(state.fieldErrors?.fullName)}
          required
        />
      </Field>

      <SubmitButton className="w-fit">Salvar nome</SubmitButton>
    </form>
  );
}

export function SenhaForm() {
  const [state, action] = useActionState(changePassword, vazio);

  return (
    <form action={action} className="flex flex-col gap-stack-md">
      <FormError>{state.message}</FormError>
      <FormSuccess>{state.success}</FormSuccess>

      <Field
        label="Senha atual"
        htmlFor="currentPassword"
        error={state.fieldErrors?.currentPassword}
      >
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          invalid={Boolean(state.fieldErrors?.currentPassword)}
        />
      </Field>

      <Field
        label="Nova senha"
        htmlFor="password"
        error={state.fieldErrors?.password}
        hint="Pelo menos 8 caracteres."
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

      <SubmitButton className="w-fit">Alterar senha</SubmitButton>
    </form>
  );
}
