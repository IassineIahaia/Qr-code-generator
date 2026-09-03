"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Field,
  Input,
  Select,
} from "@/components/ui";
import { updateQrRules } from "@/lib/qr/actions";
import {
  agoraBrasilia,
  deHorarioBrasilia,
  paraHorarioBrasilia,
} from "@/lib/qr/datetime";
import { PLATAFORMAS, type DeviceRules, type GeoRules } from "@/lib/qr/rules";
import type { DisabledBehavior } from "@/lib/supabase/types";

/**
 * As regras de controle — itens 5.3 a 5.6 e 6.6.
 *
 * Um formulário só, com um botão só. Elas parecem cinco assuntos, mas o dono
 * as pensa como um: "no ar durante a promoção, no máximo 500 leituras, com
 * senha, e quem chegar depois vê um recado". Separar em cinco cards com
 * cinco botões faria a pessoa salvar cinco vezes para descrever uma decisão.
 *
 * A exceção é o switch ativo/pausado, que fica fora: aquele é um gesto de
 * emergência e não pode esperar por um "salvar".
 */

export interface RulesCardProps {
  id: string;
  isDynamic: boolean;
  activeFrom: string | null;
  expiresAt: string | null;
  scanLimit: number | null;
  scanCount: number;
  temSenha: boolean;
  disabledBehavior: DisabledBehavior;
  disabledMessage: string | null;
  disabledRedirectUrl: string | null;
  deviceRules: DeviceRules;
  geoRules: GeoRules;
}

type ModoSenha = "manter" | "definir" | "remover";

interface LinhaPais {
  country: string;
  url: string;
}

export function RulesCard(props: RulesCardProps) {
  const [activeFrom, setActiveFrom] = useState(
    paraHorarioBrasilia(props.activeFrom),
  );
  const [expiresAt, setExpiresAt] = useState(
    paraHorarioBrasilia(props.expiresAt),
  );
  const [limite, setLimite] = useState(
    props.scanLimit ? String(props.scanLimit) : "",
  );

  const [modoSenha, setModoSenha] = useState<ModoSenha>("manter");
  const [senha, setSenha] = useState("");

  const [comportamento, setComportamento] = useState<DisabledBehavior>(
    props.disabledBehavior,
  );
  const [recado, setRecado] = useState(props.disabledMessage ?? "");
  const [redirecionar, setRedirecionar] = useState(
    props.disabledRedirectUrl ?? "",
  );

  const [device, setDevice] = useState<Record<string, string>>({
    ios: props.deviceRules.ios ?? "",
    android: props.deviceRules.android ?? "",
    desktop: props.deviceRules.desktop ?? "",
  });

  const [paises, setPaises] = useState<LinhaPais[]>(
    Object.entries(props.geoRules).map(([country, url]) => ({ country, url })),
  );

  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  if (!props.isDynamic) {
    return (
      <Card>
        <CardHeader title="Regras" description="Só existem no QR dinâmico." />
        <CardBody>
          <p className="text-[13px] text-on-surface-variant">
            Um QR estático carrega o conteúdo dentro do próprio desenho: quem
            escaneia nunca passa pelo nosso servidor. Sem essa passagem não há
            onde aplicar agendamento, limite de leituras ou senha — o código
            simplesmente abre o que foi impresso nele.
          </p>
        </CardBody>
      </Card>
    );
  }

  function salvar() {
    setErros({});
    setAviso(null);

    iniciar(async () => {
      const r = await updateQrRules({
        id: props.id,
        // O campo mostra horário de parede; o banco guarda instante. A
        // conversão fixa Brasília, esteja o browser onde estiver.
        activeFrom: deHorarioBrasilia(activeFrom),
        expiresAt: deHorarioBrasilia(expiresAt),
        scanLimit: limite.trim() ? Number(limite) : null,
        password:
          modoSenha === "manter" ? null : modoSenha === "remover" ? "" : senha,
        disabledBehavior: comportamento,
        disabledMessage: recado,
        disabledRedirectUrl: redirecionar,
        deviceRules: device,
        geoRules: paises.filter((p) => p.country.trim() && p.url.trim()),
      });

      if (r.ok) {
        setAviso("Regras salvas.");
        setModoSenha("manter");
        setSenha("");
        setTimeout(() => setAviso(null), 4000);
        return;
      }

      const encontrados = r.fieldErrors ?? {};
      setErros(r.message ? { ...encontrados, _geral: r.message } : encontrados);
    });
  }

  const min = agoraBrasilia();
  const restantes =
    props.scanLimit !== null ? props.scanLimit - props.scanCount : null;

  return (
    <Card>
      <CardHeader
        title="Regras"
        description="Quando o código funciona, para quem, e o que aparece quando ele está fora do ar."
      />

      <CardBody className="flex flex-col gap-stack-lg">
        {/* ---------- 5.3 agendamento ---------- */}
        <Secao
          titulo="Janela de funcionamento"
          descricao="Horários de Brasília, sempre — não importa o fuso do seu computador."
        >
          <div className="grid gap-stack-md sm:grid-cols-2">
            <Field
              label="Entra no ar em"
              htmlFor="ativa-em"
              hint="Vazio = já está no ar."
              error={erros.activeFrom}
            >
              <Input
                id="ativa-em"
                type="datetime-local"
                value={activeFrom}
                min={min}
                onChange={(e) => setActiveFrom(e.target.value)}
                invalid={!!erros.activeFrom}
              />
            </Field>
            <Field
              label="Sai do ar em"
              htmlFor="expira-em"
              hint="Vazio = não expira."
              error={erros.expiresAt}
            >
              <Input
                id="expira-em"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                invalid={!!erros.expiresAt}
              />
            </Field>
          </div>
          {activeFrom || expiresAt ? (
            <Button
              size="sm"
              variant="ghost"
              className="self-start"
              onClick={() => {
                setActiveFrom("");
                setExpiresAt("");
              }}
            >
              Limpar as duas datas
            </Button>
          ) : null}
        </Secao>

        {/* ---------- 5.4 limite ---------- */}
        <Secao
          titulo="Limite de leituras"
          descricao="Ao atingir o número, o código para de abrir sozinho."
        >
          <Field
            label="Máximo de leituras"
            htmlFor="limite"
            error={erros.scanLimit}
            hint={textoDoLimite(props.scanCount, props.scanLimit, restantes)}
          >
            <Input
              id="limite"
              type="number"
              min={1}
              step={1}
              mono
              inputMode="numeric"
              placeholder="sem limite"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              invalid={!!erros.scanLimit}
              className="max-w-[200px]"
            />
          </Field>
        </Secao>

        {/* ---------- 5.5 senha ---------- */}
        <Secao
          titulo="Senha"
          descricao="Quem escanear precisa digitar a senha antes de chegar ao destino."
        >
          <BlocoSenha
            temSenha={props.temSenha}
            modo={modoSenha}
            setModo={setModoSenha}
            senha={senha}
            setSenha={setSenha}
            erro={erros.password}
          />
        </Secao>

        {/* ---------- 6.6 o que aparece quando está fora do ar ---------- */}
        <Secao
          titulo="Quando estiver fora do ar"
          descricao="Vale para pausado, expirado, agendado e limite atingido."
        >
          <Field label="O que quem escanear vê" htmlFor="comportamento">
            <Select
              id="comportamento"
              value={comportamento}
              onChange={(e) =>
                setComportamento(e.target.value as DisabledBehavior)
              }
              className="max-w-[320px]"
            >
              <option value="default">A página padrão de indisponível</option>
              <option value="message">A página padrão, com um recado seu</option>
              <option value="redirect">Outro endereço, escolhido por você</option>
            </Select>
          </Field>

          {comportamento === "message" ? (
            <Field
              label="Seu recado"
              htmlFor="recado"
              error={erros.disabledMessage}
              hint="Escreva para quem está com o celular na mão, não para você."
            >
              <Input
                id="recado"
                maxLength={280}
                value={recado}
                onChange={(e) => setRecado(e.target.value)}
                invalid={!!erros.disabledMessage}
                placeholder="A promoção terminou. Passe na loja para conhecer as novas."
              />
            </Field>
          ) : null}

          {comportamento === "redirect" ? (
            <Field
              label="Mandar para"
              htmlFor="redirecionar"
              error={erros.disabledRedirectUrl}
              hint="Sua página inicial, por exemplo."
            >
              <Input
                id="redirecionar"
                value={redirecionar}
                onChange={(e) => setRedirecionar(e.target.value)}
                invalid={!!erros.disabledRedirectUrl}
                placeholder="https://seusite.com.br"
              />
            </Field>
          ) : null}
        </Secao>

        {/* ---------- 5.6 dispositivo e país ---------- */}
        <Secao
          titulo="Destinos por aparelho"
          descricao="Um adesivo só que leva o iPhone à App Store e o Android à Play Store. Vazio = usa o destino normal."
        >
          {PLATAFORMAS.map((p) => (
            <Field
              key={p.chave}
              label={p.label}
              htmlFor={`dev-${p.chave}`}
              error={erros[`deviceRules.${p.chave}`]}
            >
              <Input
                id={`dev-${p.chave}`}
                value={device[p.chave]}
                placeholder={p.exemplo}
                onChange={(e) =>
                  setDevice({ ...device, [p.chave]: e.target.value })
                }
                invalid={!!erros[`deviceRules.${p.chave}`]}
              />
            </Field>
          ))}
        </Secao>

        <Secao
          titulo="Destinos por país"
          descricao="Aplicado só quando nenhuma regra de aparelho combinar — o aparelho vem primeiro."
        >
          <ListaDePaises linhas={paises} setLinhas={setPaises} erros={erros} />
        </Secao>
      </CardBody>

      <CardFooter className="flex items-center justify-between gap-3">
        {erros._geral ? (
          <p role="alert" className="text-[12px] text-error">
            {erros._geral}
          </p>
        ) : aviso ? (
          <p role="status" className="text-[12px] text-tertiary">
            {aviso}
          </p>
        ) : (
          <span />
        )}
        <Button variant="primary" size="sm" loading={salvando} onClick={salvar}>
          Salvar regras
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function textoDoLimite(
  lidas: number,
  limite: number | null,
  restantes: number | null,
): string {
  const n = (v: number) => v.toLocaleString("pt-BR");
  if (limite === null || restantes === null) {
    return `Vazio = sem limite. Este código já tem ${n(lidas)} leituras.`;
  }
  return restantes > 0
    ? `Já foram ${n(lidas)}. Faltam ${n(restantes)}.`
    : `Limite atingido: ${n(lidas)} de ${n(limite)}.`;
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-stack-md border-t border-hairline pt-stack-md first:border-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-label text-on-surface">{titulo}</h3>
        <p className="text-[12px] text-on-surface-variant">{descricao}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * A senha tem três gestos, e o servidor os distingue por um campo só:
 * `null` não mexe, `""` remove, texto define. Aqui isso vira três estados de
 * tela — e nunca mostramos a senha guardada, porque não a temos: o banco
 * guarda só o derivado.
 */
function BlocoSenha({
  temSenha,
  modo,
  setModo,
  senha,
  setSenha,
  erro,
}: {
  temSenha: boolean;
  modo: ModoSenha;
  setModo: (m: ModoSenha) => void;
  senha: string;
  setSenha: (s: string) => void;
  erro?: string;
}) {
  if (modo === "definir") {
    return (
      <div className="flex flex-col gap-stack-sm">
        <Field
          label={temSenha ? "Nova senha" : "Senha"}
          htmlFor="senha-nova"
          error={erro}
          hint="De 4 a 72 caracteres. Fica visível enquanto você digita: é você quem vai repassá-la."
        >
          <Input
            id="senha-nova"
            type="text"
            autoComplete="off"
            maxLength={72}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            invalid={!!erro}
            className="max-w-[320px]"
          />
        </Field>
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          onClick={() => {
            setSenha("");
            setModo("manter");
          }}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  if (modo === "remover") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Chip tone="danger">Vai sair ao salvar</Chip>
        <span className="text-[12px] text-on-surface-variant">
          Depois de salvar, qualquer pessoa com o código abre o destino.
        </span>
        <Button size="sm" variant="ghost" onClick={() => setModo("manter")}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {temSenha ? (
        <>
          <Chip tone="success">Protegido por senha</Chip>
          <Button size="sm" onClick={() => setModo("definir")}>
            Trocar senha
          </Button>
          <Button size="sm" variant="danger" onClick={() => setModo("remover")}>
            Remover senha
          </Button>
        </>
      ) : (
        <>
          <Chip>Sem senha</Chip>
          <Button size="sm" onClick={() => setModo("definir")}>
            Proteger com senha
          </Button>
        </>
      )}
    </div>
  );
}

function ListaDePaises({
  linhas,
  setLinhas,
  erros,
}: {
  linhas: LinhaPais[];
  setLinhas: (l: LinhaPais[]) => void;
  erros: Record<string, string>;
}) {
  function atualizar(i: number, campo: keyof LinhaPais, valor: string) {
    setLinhas(linhas.map((l, j) => (i === j ? { ...l, [campo]: valor } : l)));
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      {linhas.map((linha, i) => (
        <div key={i} className="flex items-start gap-2">
          <Input
            aria-label="País"
            value={linha.country}
            maxLength={2}
            mono
            placeholder="BR"
            onChange={(e) => atualizar(i, "country", e.target.value.toUpperCase())}
            invalid={!!erros[`geoRules.${i}.country`]}
            className="w-[72px] shrink-0 text-center uppercase"
          />
          <div className="flex-1">
            <Input
              aria-label="Destino para este país"
              value={linha.url}
              placeholder="https://seusite.com/br"
              onChange={(e) => atualizar(i, "url", e.target.value)}
              invalid={!!erros[`geoRules.${i}.url`]}
            />
            {erros[`geoRules.${i}.country`] ?? erros[`geoRules.${i}.url`] ? (
              <p className="pt-1 text-[12px] text-error">
                {erros[`geoRules.${i}.country`] ?? erros[`geoRules.${i}.url`]}
              </p>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Remover a regra do país ${linha.country || i + 1}`}
            onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}
            className="h-10"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ))}

      {linhas.length < 20 ? (
        <Button
          size="sm"
          icon={<Plus size={14} />}
          className="self-start"
          onClick={() => setLinhas([...linhas, { country: "", url: "" }])}
        >
          Adicionar país
        </Button>
      ) : null}

      <p className="text-[12px] text-on-surface-variant">
        O país vem do endereço de rede de quem escaneia. Em desenvolvimento
        local ele não existe, então estas regras só entram em ação depois de
        publicado.
      </p>
    </div>
  );
}
