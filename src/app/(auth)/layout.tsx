import Link from "next/link";
import { QrCode } from "lucide-react";
import { AmbientOrbs } from "@/components/ui";

/** Moldura comum das telas de entrada: marca no topo, card centralizado. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AmbientOrbs />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-stack-lg px-margin-mobile py-stack-lg">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container">
            <QrCode size={20} className="text-white" aria-hidden />
          </span>
          <span className="font-display text-title text-on-surface">
            QR Generator Pro
          </span>
        </Link>

        <main className="w-full max-w-[420px]">{children}</main>

        <p className="text-[12px] text-on-surface-variant/70">
          Seus QR Codes, sob seu controle.
        </p>
      </div>
    </>
  );
}
