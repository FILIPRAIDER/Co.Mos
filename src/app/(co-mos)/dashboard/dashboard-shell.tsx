"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useMemo, useState, useEffect, type ReactNode, type SVGProps } from "react";
import Image from "next/image";
import NotificationBadge from "@/app/components/NotificationBadge";

const navGroups = [
  {
    label: "Dashboards",
    items: [
      { label: "Inicio", href: "/dashboard", icon: HomeIcon },
      { label: "Órdenes", href: "/dashboard/ordenes", icon: ClipboardIcon },
      { label: "Historial", href: "/dashboard/historial", icon: HistoryIcon },
      { label: "Mesas", href: "/dashboard/mesas", icon: TableIcon },
      { label: "Reportes", href: "/dashboard/reportes", icon: ChartIcon, adminOnly: true },
    ],
  },
  {
    label: "Producto",
    items: [
      { label: "Productos", href: "/dashboard/productos", icon: BoxIcon, excludeRoles: ["COCINERO"] },
      { label: "Categorías", href: "/dashboard/categorias", icon: TagIcon, excludeRoles: ["COCINERO"] },
      { label: "Inventario", href: "/dashboard/inventario", icon: PackageIcon, adminOnly: true },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { label: "Vista Cocina", href: "/cocina", icon: ChefHatIcon },
      { label: "Vista Servicio", href: "/servicio", icon: ServerIcon, excludeRoles: ["COCINERO"] },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { label: "Usuarios", href: "/dashboard/usuarios", icon: UsersIcon, adminOnly: true },
      { label: "Restaurante", href: "/dashboard/restaurante", icon: StoreIcon, adminOnly: true },
      { label: "Exportar QR", href: "/dashboard/qr-export", icon: QrCodeIcon, adminOnly: true },
    ],
  },
];

// Traducción de roles
const roleTranslations: Record<string, string> = {
  ADMIN: "Administrador",
  WORKER: "Trabajador",
  CLIENT: "Cliente",
};

type IconProps = SVGProps<SVGSVGElement>;

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const firstName = useMemo(() => {
    const full = session?.user?.name?.trim();
    if (!full) return "equipo";
    const [name] = full.split(" ");
    return name || "equipo";
  }, [session?.user?.name]);

  const roleLabel = useMemo(() => {
    const role = session?.user?.role;
    if (!role) return "Sin rol";
    return roleTranslations[role] || role;
  }, [session?.user?.role]);

  const handleSignOut = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    await signOut({ callbackUrl: `${baseUrl}/auth/login` });
  };

  const openMobile = () => {
    setMobileOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const closeMobile = () => {
    setIsAnimating(false);
    setTimeout(() => setMobileOpen(false), 300);
  };

  // Bloquear scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh bg-[#0a0a0f] text-neutral-100">
      <aside 
        className={`hidden shrink-0 flex-col border-r border-white/5 bg-[#1a1a1f] px-4 py-6 lg:flex lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between">
          <BrandBlock collapsed={sidebarCollapsed} />
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-md p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={sidebarCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
          >
            {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </button>
        </div>
        <nav className="mt-8 space-y-6">
          {navGroups.map((group) => {
            const filteredItems = group.items.filter((item: any) => {
              // Filtrar por adminOnly
              if (item.adminOnly && session?.user?.role !== "ADMIN") {
                return false;
              }
              // Filtrar por excludeRoles
              if (item.excludeRoles && item.excludeRoles.includes(session?.user?.role)) {
                return false;
              }
              return true;
            });
            if (filteredItems.length === 0) return null;
            
            return (
              <div key={group.label} className="space-y-3">
                {!sidebarCollapsed && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{group.label}</p>
                )}
                <ul className="space-y-1.5">
                  {filteredItems.map((item) => (
                    <li key={item.label}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={`
                            flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                            ${
                              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                ? "bg-white/10 text-white"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            }
                            ${sidebarCollapsed ? "justify-center" : ""}
                          `}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <item.icon className="h-4 w-4" />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/40 ring-0 transition-colors hover:bg-white/5 hover:text-white/80 ${
                            sidebarCollapsed ? "justify-center" : ""
                          }`}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <item.icon className="h-4 w-4" />
                          {!sidebarCollapsed && <span>{item.label}</span>}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div 
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMobile} 
            aria-hidden="true" 
          />
          <div className={`relative ml-0 flex h-full w-72 flex-col bg-[#1a1a1f] px-4 py-6 shadow-xl transform transition-transform duration-300 ease-out ${
            isAnimating ? 'translate-x-0' : '-translate-x-full'
          }`}>
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
              {navGroups.map((group) => {
                const filteredItems = group.items.filter((item: any) => {
                  // Filtrar por adminOnly
                  if (item.adminOnly && session?.user?.role !== "ADMIN") {
                    return false;
                  }
                  // Filtrar por excludeRoles
                  if (item.excludeRoles && item.excludeRoles.includes(session?.user?.role)) {
                    return false;
                  }
                  return true;
                });
                if (filteredItems.length === 0) return null;
                
                return (
                  <div key={group.label} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{group.label}</p>
                    <ul className="space-y-1.5">
                      {filteredItems.map((item) => (
                        <li key={`${group.label}-${item.label}`}>
                          {item.href ? (
                            <Link
                              href={item.href}
                              className={`
                                flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                                ${
                                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
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
                );
              })}
            </nav>
          </div>
        </div>
      )}

  <div className="flex min-h-dvh flex-1 flex-col lg:overflow-y-auto">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-[#1a1a1f] px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openMobile}
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
            <NotificationBadge />
            <div className="text-right">
              <p className="text-sm font-medium text-white">Hola, {firstName}</p>
              <p className="text-xs text-white/50">{roleLabel}</p>
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

function BrandBlock({ compact, collapsed, onClickLogo }: { compact?: boolean; collapsed?: boolean; onClickLogo?: () => void }) {
  if (onClickLogo) {
    return (
      <button
        type="button"
        onClick={onClickLogo}
        className="flex items-center gap-2 text-left"
        aria-label="Inicio co.mos"
      >
        {collapsed ? (
          <Image src="/Logo.svg" alt="co.mos" width={24} height={24} className="shrink-0" />
        ) : (
          <>
            <Image src="/Logo.svg" alt="co.mos" width={48} height={18} className="shrink-0" />
            <span className="text-base font-semibold text-white">co.mos</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2" aria-label="co.mos">
      {collapsed ? (
        <Image src="/Logo.svg" alt="co.mos" width={24} height={24} className="shrink-0" />
      ) : (
        <>
          <Image src="/Logo.svg" alt="co.mos" width={48} height={18} className="shrink-0" />
          <span className="text-base font-semibold text-white">co.mos</span>
        </>
      )}
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

function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ChefHatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 17h12" strokeLinecap="round" />
    </svg>
  );
}

function ServerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="2" y="3" width="20" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="14" width="20" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="6.5" r="1" fill="currentColor" />
      <circle cx="6" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PackageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QrCodeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M17 14h4M17 18h4M17 21h4" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7v5l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
