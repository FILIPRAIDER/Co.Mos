"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState, type ReactNode, type SVGProps } from "react";

const navGroups = [
  {
    label: "Dashboards",
    items: [
      { label: "Inicio", href: "/dashboard", icon: HomeIcon },
      { label: "Órdenes", icon: ClipboardIcon },
      { label: "Mesas", icon: TableIcon },
      { label: "Reportes", icon: ChartIcon },
    ],
  },
  {
    label: "Producto",
    items: [{ label: "Productos", icon: BoxIcon }],
  },
];

type IconProps = SVGProps<SVGSVGElement>;

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName = useMemo(() => {
    const full = session?.user?.name?.trim();
    if (!full) return "equipo";
    const [name] = full.split(" ");
    return name || "equipo";
  }, [session?.user?.name]);

  const roleLabel = session?.user?.role ?? "Sin rol";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-dvh bg-[#0a0a0f] text-neutral-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-black/60 px-4 py-6 backdrop-blur lg:flex lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <BrandBlock />
        <nav className="mt-8 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{group.label}</p>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`
                          flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                          ${
                            pathname.startsWith(item.href)
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/40 ring-0 transition-colors hover:bg-white/5 hover:text-white/80"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMobile} aria-hidden="true" />
          <div className="relative ml-0 flex h-full w-72 flex-col bg-[#0f0f15] px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between">
              <BrandBlock compact onClickLogo={closeMobile} />
              <button
                type="button"
                onClick={closeMobile}
                className="rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar menú"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 space-y-6">
              {navGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{group.label}</p>
                  <ul className="space-y-1.5">
                    {group.items.map((item) => (
                      <li key={`${group.label}-${item.label}`}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className={`
                              flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                              ${
                                pathname.startsWith(item.href)
                                  ? "bg-white/10 text-white"
                                  : "text-white/60 hover:bg-white/5 hover:text-white"
                              }
                            `}
                            onClick={closeMobile}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

  <div className="flex min-h-dvh flex-1 flex-col lg:overflow-y-auto">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-black/60 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Abrir menú"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Dashboard</p>
              <h1 className="text-lg font-semibold text-white">Inicio</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">Hola, {firstName}</p>
              <p className="text-xs uppercase tracking-wide text-white/50">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/10"
            >
              Salir
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function BrandBlock({ compact, onClickLogo }: { compact?: boolean; onClickLogo?: () => void }) {
  if (onClickLogo) {
    return (
      <button
        type="button"
        onClick={onClickLogo}
        className="flex items-center gap-2 text-left"
        aria-label="Inicio co.mos"
      >
        <LogoIcon className="h-6 w-6" />
        {!compact && <span className="text-lg font-semibold text-white">co.mos</span>}
        {compact && <span className="text-base font-semibold text-white">co.mos</span>}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2" aria-label="co.mos">
      <LogoIcon className="h-6 w-6" />
      {!compact && <span className="text-lg font-semibold text-white">co.mos</span>}
      {compact && <span className="text-base font-semibold text-white">co.mos</span>}
    </div>
  );
}

function LogoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="16" cy="16" r="12" strokeOpacity="0.6" />
      <path d="M11 16a5 5 0 0 1 5-5 5 5 0 0 1 5 5" strokeLinecap="round" />
      <circle cx="16" cy="20" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M5 7h14M5 12h14M5 17h14" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path
        d="m4 11 8-6 8 6v8a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M9 5h6M9 9h6M9 13h6" strokeLinecap="round" />
      <path
        d="M7 4h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TableIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="4" y="9" width="16" height="5" rx="1" />
      <path d="M7 14v5M17 14v5" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M5 12v7M12 5v14M19 9v10" strokeLinecap="round" />
      <path d="M4 19h16" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12 20 8M12 12 4 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
