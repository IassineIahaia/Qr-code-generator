import type { Metadata } from "next";
import { AmbientOrbs } from "@/components/ui";
import {
  ChamadaFinal,
  ComoFunciona,
  Hero,
  Navbar,
  Recursos,
  Rodape,
} from "@/components/landing/sections";

/**
 * A landing — item 8.4.
 *
 * Estática de ponta a ponta: nenhuma leitura do Supabase, nenhum estado,
 * nenhum `"use client"`. É a página que mais gente vai abrir e a única que
 * abre para quem não tem conta, então ela é HTML pronto no build.
 *
 * O título e a descrição daqui sobrescrevem os do `layout.tsx` de propósito:
 * o `template` do layout põe " · QR Generator Pro" no fim de tudo, e "QR
 * Generator Pro · QR Generator Pro" seria o resultado na aba do navegador.
 */
export const metadata: Metadata = {
  title: {
    absolute: "QR Generator Pro — QR Codes dinâmicos que você controla",
  },
  description:
    "Troque o destino de um QR Code depois de impresso, pause quando quiser e acompanhe as leituras: quantas, quando, em que aparelho e de onde.",
};

export default function Home() {
  return (
    <>
      <AmbientOrbs />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Recursos />
        <ComoFunciona />
        <ChamadaFinal />
      </main>
      <Rodape />
    </>
  );
}
