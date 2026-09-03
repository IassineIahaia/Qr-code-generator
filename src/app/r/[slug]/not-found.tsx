import { Indisponivel } from "@/components/publico/indisponivel";

/**
 * Um link curto que não corresponde a nenhum código.
 *
 * Existe como `not-found.tsx`, e não como mais um ramo da página, para que a
 * resposta saia com **404 de verdade**. Um 200 dizendo "não existe" mente
 * para tudo que lê status em vez de texto: o cache da operadora, o
 * pré-visualizador do WhatsApp, o robô do buscador.
 */
export default function SlugInexistente() {
  return (
    <Indisponivel
      titulo="Este QR Code não existe"
      detalhe="O endereço pode ter sido digitado errado, ou o código foi excluído por quem o criou."
    />
  );
}
