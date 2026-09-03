import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui";
import { NewPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Nova senha" };

export default function NovaSenhaPage() {
  return (
    <Card>
      <CardBody className="flex flex-col gap-stack-md p-stack-lg">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-display text-headline text-on-surface">
            Definir nova senha
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            Escolha uma senha que você ainda não usa em outro lugar.
          </p>
        </header>

        <NewPasswordForm />
      </CardBody>
    </Card>
  );
}
