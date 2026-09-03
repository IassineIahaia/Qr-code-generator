import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { ResetRequestForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <Card>
      <CardBody className="flex flex-col gap-stack-md p-stack-lg">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-display text-headline text-on-surface">
            Recuperar senha
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            Informe seu e-mail e enviamos um link para você definir uma senha
            nova.
          </p>
        </header>

        <ResetRequestForm />

        <p className="text-center text-[13px] text-on-surface-variant">
          Lembrou?{" "}
          <Link
            href="/entrar"
            className="text-primary underline-offset-4 hover:underline"
          >
            Voltar ao login
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
