import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { SignInForm } from "@/components/auth/forms";
import { FormError } from "@/components/auth/form-parts";
import { destinoSeguro } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  link_invalido:
    "Esse link expirou ou já foi usado. Peça um novo e-mail para continuar.",
  oauth: "Não foi possível entrar com o Google. Tente pelo e-mail e senha.",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; erro?: string }>;
}) {
  const { redirectTo, erro } = await searchParams;

  return (
    <Card>
      <CardBody className="flex flex-col gap-stack-md p-stack-lg">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-display text-headline text-on-surface">
            Entrar
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            Bom te ver de novo.
          </p>
        </header>

        {erro ? <FormError>{ERROS[erro] ?? ERROS.link_invalido}</FormError> : null}

        <SignInForm redirectTo={destinoSeguro(redirectTo)} />

        <p className="text-center text-[13px] text-on-surface-variant">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastrar"
            className="text-primary underline-offset-4 hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
