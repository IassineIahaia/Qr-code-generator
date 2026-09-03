import {
  Folder,
  Globe,
  LayoutDashboard,
  QrCode,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * O mapa do app — item 8.3.
 *
 * Mora num arquivo só, sem `"use client"` nem `server-only`, porque três
 * peças precisam da mesma lista: a sidebar, o menu do celular e a paleta
 * ⌘K. Duplicá-la seria garantir que um dia elas discordem.
 *
 * **Os itens que ainda não existem aparecem, e aparecem apagados.** A
 * alternativa seria escondê-los até a fase que os constrói, e aí a sidebar
 * mudaria de forma três vezes ao longo do produto. Mostrar o mapa inteiro
 * com o que ainda não abriu marcado como "em breve" é honesto e estável —
 * o que não se faz é deixar um link vivo apontando para um 404.
 */
export interface ItemDeNavegacao {
  href: string;
  label: string;
  icon: LucideIcon;
  /** A fase que constrói este item. `null` quando já está de pé. */
  emBreve: string | null;
  /**
   * Casa também as rotas filhas. `/painel` não pode: senão ele ficaria
   * aceso em toda tela do painel, inclusive nas dos outros itens.
   */
  exato?: boolean;
}

export const NAVEGACAO: ItemDeNavegacao[] = [
  {
    href: "/painel",
    label: "Painel",
    icon: LayoutDashboard,
    emBreve: null,
    exato: true,
  },
  { href: "/painel/codigos", label: "Meus QR Codes", icon: QrCode, emBreve: null },
  { href: "/painel/pastas", label: "Pastas", icon: Folder, emBreve: "4.7" },
  { href: "/painel/dominios", label: "Domínios", icon: Globe, emBreve: "9.1" },
  { href: "/painel/equipe", label: "Equipe", icon: Users, emBreve: "9.2" },
  {
    href: "/painel/configuracoes",
    label: "Configurações",
    icon: Settings,
    emBreve: null,
  },
];

/** Se o item deve aparecer aceso para o caminho atual. */
export function estaAtivo(item: ItemDeNavegacao, pathname: string): boolean {
  if (item.exato) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
