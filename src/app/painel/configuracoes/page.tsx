import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Globe, KeyRound, LogOut, Plug, Users, Wallet } from "lucide-react";
import { Card, CardBody, CardHeader, Button } from "@/components/ui";
import { PerfilForm, SenhaForm } from "@/components/auth/settings-forms";
import { signOut } from "@/lib/auth/actions";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configurações" };

/**
 * Configurações da conta — item 8.4 (`configura_es_e_equipe`).
 *
 * **Só a aba "Geral" do desenho existe aqui, e é de propósito.** A tela do
 * Stitch é quase toda Domínios (fase 9.1) e Equipe (9.2): dois recursos que
 * ainda não foram construídos. Desenhar a tabela de domínios com linhas
 * falsas e um botão "Adicionar domínio" que não adiciona nada seria uma
 * maquete passando por produto — quem clicasse descobriria sozinho.
 *
 * O que existe, existe de verdade e grava no banco: nome e senha. O resto
 * está listado no fim, apagado, como na sidebar — o mapa fica visível sem
 * que nada minta.
 */
export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?redirectTo=/painel/configuracoes");

  const supabase = await createClient();
  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, email, plan, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const nome = perfil?.full_name ?? user.user_metadata?.full_name ?? "";
  const email = perfil?.email ?? user.email ?? "—";

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-headline-lg text-on-surface">
          Configurações
        </h1>
        <p className="text-on-surface-variant">
          Sua conta e seu acesso.
        </p>
      </header>

      <div className="grid gap-stack-md lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-stack-md">
          <Card>
            <CardHeader
              title="Perfil"
              description="O nome que o produto usa para falar com você."
            />
            <CardBody>
              <PerfilForm nome={nome} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Senha"
              description="Pedimos a senha atual porque a sessão aberta, sozinha, não prova que é você."
            />
            <CardBody>
              <SenhaForm />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Ainda não está aqui"
              description="O que a tela vai ganhar, e em qual fase."
            />
            <CardBody>
              <ul className="flex flex-col gap-3">
                <EmBreve
                  icon={<Globe size={16} aria-hidden />}
                  titulo="Domínio próprio"
                  texto="Trocar o `qrg.pro/abc` por um endereço seu, com verificação de DNS."
                  fase="9.1"
                />
                <EmBreve
                  icon={<Users size={16} aria-hidden />}
                  titulo="Equipe"
                  texto="Convidar gente como Proprietário, Editor ou Visualizador."
                  fase="9.2"
                />
                <EmBreve
                  icon={<Plug size={16} aria-hidden />}
                  titulo="API e webhooks"
                  texto="Chaves de acesso e aviso automático a cada leitura."
                  fase="9.3"
                />
                <EmBreve
                  icon={<Wallet size={16} aria-hidden />}
                  titulo="Faturamento"
                  texto="Planos e limites de uso. Hoje não há cobrança nenhuma."
                  fase="9.4"
                />
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-stack-md">
          <Card>
            <CardHeader title="Conta" />
            <CardBody className="flex flex-col gap-3 text-[13px]">
              <Linha rotulo="E-mail" valor={email} mono />
              <Linha rotulo="Plano" valor={perfil?.plan ?? "free"} />
              <Linha
                rotulo="Cliente desde"
                valor={formatarData(perfil?.created_at ?? user.created_at)}
              />
              <p className="pt-1 text-[12px] text-on-surface-variant">
                O e-mail é o seu login e ainda não pode ser trocado por aqui —
                trocá-lo exige reconfirmar a caixa nova antes de valer, e essa
                ida e volta não está escrita.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Sessão"
              description="Sai só deste aparelho. Os QR Codes continuam funcionando."
            />
            <CardBody>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="danger"
                  icon={<LogOut size={16} aria-hidden />}
                >
                  Sair da conta
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-start gap-3">
              <KeyRound
                size={16}
                className="mt-0.5 shrink-0 text-on-surface-variant"
                aria-hidden
              />
              <p className="text-[12px] text-on-surface-variant">
                Sua senha é guardada pelo Supabase, com hash — nem este
                produto nem quem o mantém consegue lê-la.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Linha({
  rotulo,
  valor,
  mono,
}: {
  rotulo: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <span className="text-on-surface-variant">{rotulo}</span>
      <span
        className={
          mono
            ? "truncate font-mono text-data text-on-surface"
            : "truncate text-on-surface"
        }
        title={valor}
      >
        {valor}
      </span>
    </span>
  );
}

function EmBreve({
  icon,
  titulo,
  texto,
  fase,
}: {
  icon: React.ReactNode;
  titulo: string;
  texto: string;
  fase: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-on-surface-variant/50">{icon}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="text-label text-on-surface-variant">{titulo}</span>
          <span className="rounded-full border border-hairline px-1.5 py-0.5 text-[10px] text-on-surface-variant/50">
            fase {fase}
          </span>
        </span>
        <span className="text-[12px] text-on-surface-variant/70">{texto}</span>
      </span>
    </li>
  );
}

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}
