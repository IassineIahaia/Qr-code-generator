import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { SignUpForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastrarPage() {
  return (
    <Card>
      <CardBody className="flex flex-col gap-stack-md p-stack-lg">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-display text-headline text-on-surface">
            Criar conta
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            Comece de graça. Sem cartão de crédito.
          </p>
        </header>

        <SignUpForm />

        <p className="text-center text-[13px] text-on-surface-variant">
          Já tem conta?{" "}
          <Link
            href="/entrar"
            className="text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
