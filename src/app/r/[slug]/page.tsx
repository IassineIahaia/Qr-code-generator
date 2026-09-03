import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { Indisponivel } from "@/components/publico/indisponivel";
import { PortaDeSenha } from "@/components/publico/porta-de-senha";
import { buscarPorSlug, decidir, outcomeDe } from "@/lib/qr/redirect";
import { freioDeLeitura } from "@/lib/qr/rate-limit";
import {
  geoDaRequisicao,
  hashComSal,
  interpretarUserAgent,
  ipDaRequisicao,
  registrarLeitura,
  type Visita,
} from "@/lib/qr/scan";
import { RECADO_PUBLICO } from "@/lib/qr/status";
import { nomeCookieSenha, passeValido } from "@/lib/qr/token";

/**
 * `/r/[slug]` — o destino de todo QR dinâmico impresso.
 *
 * É uma página, não um route handler, porque metade dos desfechos precisa
 * *mostrar* alguma coisa: pausado, expirado, pede senha. Fazer o caminho
 * feliz por route handler e os outros por página exigiria um salto extra de
 * HTTP justamente nos casos em que a pessoa já está frustrada.
 *
 * Nada aqui pode ser cacheado: o mesmo endereço responde diferente conforme
 * o relógio, o aparelho, o país e o contador.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Abrindo…",
  // Um QR não deve puxar tráfego de busca para si: quem chega aqui veio da
  // câmera, e o buscador só encontraria uma página de redirecionamento.
  robots: { index: false, follow: false },
};

export default async function RedirectPublicoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const qr = await buscarPorSlug(slug);
  // `notFound()` em vez de renderizar direto: o `not-found.tsx` ao lado
  // mostra a mesma tela, mas com status 404 — que é o que caches e robôs
  // leem.
  if (!qr) notFound();

  const cabecalhos = await headers();
  const bolachas = await cookies();

  const ua = cabecalhos.get("user-agent");
  const leitura = interpretarUserAgent(ua);
  const geo = geoDaRequisicao(cabecalhos);
  const ip = ipDaRequisicao(cabecalhos);

  const visita: Visita = {
    ip,
    userAgent: ua,
    referrer: cabecalhos.get("referer"),
    pais: geo.pais,
    cidade: geo.cidade,
    visitanteId: bolachas.get("qrv")?.value ?? null,
  };

  const decisao = decidir(qr, {
    plataforma: leitura.plataforma,
    pais: geo.pais,
    senhaLiberada: await passeValido(
      qr.slug,
      bolachas.get(nomeCookieSenha(qr.slug))?.value,
    ),
  });

  /**
   * O registro nunca segura o redirect — item 6.7.
   *
   * `after` roda o bloco depois que a resposta já saiu. Uma consulta ao
   * Supabase leva dezenas de milissegundos; somá-los ao caminho crítico
   * significaria fazer alguém esperar, em pé numa fila, para que a nossa
   * estatística ficasse bonita.
   *
   * Robôs de pré-visualização (WhatsApp, Slack) e um mesmo IP martelando o
   * link ficam de fora da contagem, mas continuam sendo redirecionados: o
   * freio existe para proteger o número e o limite de leituras, não para
   * negar o destino a quem talvez seja gente.
   */
  const ipHash = ip ? await hashComSal(ip) : null;
  const dentroDoFreio = ipHash ? freioDeLeitura(ipHash, qr.slug).permitido : true;

  if (!leitura.ehRobo && dentroDoFreio) {
    after(() =>
      registrarLeitura({
        qrId: qr.id,
        outcome: outcomeDe(decisao),
        visita,
        leitura,
      }),
    );
  }

  if (decisao.tipo === "seguir") {
    // 307: preserva o método e, principalmente, não é cacheado pelo browser
    // como o 301 seria. Um QR dinâmico que o Chrome memorizasse deixaria de
    // ser dinâmico no aparelho de quem já escaneou uma vez.
    redirect(decisao.url);
  }

  if (decisao.tipo === "senha") {
    return <PortaDeSenha slug={qr.slug} nome={qr.name} />;
  }

  /* ---------- daqui para baixo, o código está fora do ar ---------- */

  // Item 6.6: o dono escolhe o que aparece no lugar.
  if (qr.disabled_behavior === "redirect" && qr.disabled_redirect_url) {
    redirect(qr.disabled_redirect_url);
  }

  const recado =
    decisao.tipo === "bloqueado"
      ? RECADO_PUBLICO[decisao.estado]
      : {
          titulo: "Este QR Code não está configurado",
          detalhe: "Ele ainda não tem um destino definido por quem o criou.",
        };

  return (
    <Indisponivel
      titulo={recado.titulo}
      detalhe={recado.detalhe}
      recadoDoDono={
        qr.disabled_behavior === "message" ? qr.disabled_message : null
      }
    />
  );
}
