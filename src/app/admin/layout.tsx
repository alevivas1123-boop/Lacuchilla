import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración" },
  // El panel no se indexa. El middleware manda además la cabecera X-Robots-Tag.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col bg-cream">{children}</div>;
}
