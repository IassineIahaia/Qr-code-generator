/**
 * Tipos do banco, espelhando supabase/migrations/.
 * Quando o schema mudar, atualize aqui (ou gere com
 * `npx supabase gen types typescript --project-id <id>`).
 */

export type QrType =
  | "url"
  | "pix"
  | "whatsapp"
  | "wifi"
  | "vcard"
  | "email"
  | "sms"
  | "text"
  | "pdf"
  | "menu"
  | "appstore"
  | "video";

/** Intenção do dono, gravada na tabela. */
export type QrStatus = "active" | "paused" | "archived";

/** Estado real, que também depende do relógio e do contador. */
export type QrEffectiveStatus =
  | "active"
  | "paused"
  | "scheduled"
  | "expired"
  | "limit_reached"
  | "archived";

export type ScanOutcome =
  | "redirected"
  | "blocked_paused"
  | "blocked_expired"
  | "blocked_limit"
  | "blocked_scheduled"
  | "password_required";

export type DisabledBehavior = "default" | "message" | "redirect";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "business";
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface QrCode {
  id: string;
  user_id: string;
  folder_id: string | null;

  name: string;
  slug: string;
  is_dynamic: boolean;

  type: QrType;
  content: Json;
  destination: string | null;

  design: Json;

  status: QrStatus;
  active_from: string | null;
  expires_at: string | null;
  scan_limit: number | null;
  password_hash: string | null;
  disabled_behavior: DisabledBehavior;
  disabled_message: string | null;
  disabled_redirect_url: string | null;
  device_rules: Json;
  geo_rules: Json;

  scan_count: number;
  unique_scan_count: number;
  last_scan_at: string | null;

  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: number;
  qr_id: string;
  created_at: string;
  is_unique: boolean;
  visitor_hash: string | null;
  ip_hash: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  referrer: string | null;
  user_agent: string | null;
  outcome: ScanOutcome;
}

export type QrEventAction =
  | "created"
  | "updated"
  | "destination_changed"
  | "activated"
  | "paused"
  | "scheduled"
  | "expired"
  | "limit_reached"
  | "design_changed"
  | "moved"
  | "restored"
  // acrescentados em `0005_controle.sql`, junto com a Fase 5
  | "rules_changed"
  | "password_set"
  | "password_removed";

export interface QrEvent {
  id: number;
  qr_id: string;
  user_id: string | null;
  action: QrEventAction;
  meta: Json;
  created_at: string;
}

/**
 * `{ [K in keyof T]: T[K] }` em vez de `T` direto não é enfeite: o
 * postgrest-js exige `Row extends Record<string, unknown>`, e uma
 * `interface` não ganha index signature implícita — só um mapped type
 * ganha. Sem isso o schema inteiro falha o `extends GenericSchema`, cai no
 * ramo `any` e todo `.select()` passa a devolver `never` silenciosamente.
 */
/** A linha de `qr_codes` como o PostgREST devolve: colunas + campo computado. */
type QrCodeWithStatus = QrCode & {
  qr_effective_status: QrEffectiveStatus;
};

type Row<T> = {
  Row: { [K in keyof T]: T[K] };
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Row<Profile>;
      folders: Row<Folder>;
      // `qr_effective_status` não é coluna: é a função de `0002_functions`
      // que recebe a linha inteira, e o PostgREST expõe funções assim como
      // coluna computada — dá para selecionar e filtrar, nunca gravar. Por
      // isso ela entra só no `Row`; `Insert`/`Update` continuam sobre `QrCode`.
      // O `Row<>` tem que envolver a interseção inteira: o mapeamento é o que
      // transforma a interface num tipo com índice, e sem ele o schema não
      // casa com `GenericSchema` e todo `.select()` volta `never`.
      qr_codes: Omit<Row<QrCodeWithStatus>, "Insert" | "Update"> & {
        Insert: Partial<QrCode>;
        Update: Partial<QrCode>;
      };
      scans: Row<Scan>;
      qr_events: Row<QrEvent>;
    };
    // Precisam ser `Record<string, ...>` de verdade: o postgrest-js checa
    // `Schema extends GenericSchema` e, se falhar, cai no ramo `any` — e aí
    // todo `.select()` passa a devolver `never`, sem erro visível na origem.
    Views: Record<string, never>;
    Functions: {
      generate_qr_slug: {
        Args: { size?: number };
        Returns: string;
      };
      slug_available: {
        Args: { candidate: string };
        Returns: boolean;
      };
      scan_series: {
        Args: { p_qr_id: string; p_from: string; p_to?: string };
        Returns: { dia: string; total: number; unicos: number }[];
      };
      /** `0005_controle.sql` — anota no histórico o que o relógio já expirou. */
      registrar_expiracoes: {
        Args: Record<string, never>;
        Returns: number;
      };
      /**
       * `0006_analytics.sql` — todas as quebras de uma janela num jsonb só.
       * O `Returns: Json` é honesto: para o PostgREST é mesmo um jsonb
       * opaco. Quem dá forma é `QrAnalytics`, em `lib/qr/analytics.ts`.
       */
      qr_analytics: {
        Args: { p_qr_id: string; p_from: string; p_to?: string };
        Returns: Json;
      };
      account_analytics: {
        Args: { p_from: string; p_to?: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
