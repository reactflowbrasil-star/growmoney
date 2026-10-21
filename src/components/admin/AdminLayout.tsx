import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Shield,
  LogOut,
  Server,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const nav = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/sistema", label: "Sistema", icon: Server },
  { to: "/admin/auditoria", label: "Auditoria", icon: Shield },
  { to: "/admin/seguranca", label: "Segurança", icon: Settings },
];

function AdminNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? "Navegação administrativa" : "Menu administrativo"}
      className="space-y-1"
    >
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}
          className={({ isActive }) =>
            cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand/15 text-brand"
                : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
            )
          }
        >
          <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AdminBrand() {
  return (
    <Link to="/admin" className="flex min-w-0 flex-col items-start gap-1">
      <img
        src={BRAND.logo}
        alt={BRAND.name}
        className="h-auto max-h-14 w-auto max-w-full object-contain object-left"
      />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-brand">
        Painel Admin
      </span>
    </Link>
  );
}

export function AdminLayout() {
  const { session, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-transparent lg:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-border-color bg-bg-primary lg:flex">
        <div className="flex min-h-24 items-center border-b border-border-color px-5 py-4">
          <AdminBrand />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <AdminNavigation />
        </nav>

        <div className="border-t border-border-color p-3">
          <p className="mb-2 truncate px-2 text-xs text-text-secondary">
            {session?.username}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-erro hover:bg-erro/10"
          >
            <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 shrink-0 border-b border-border-color bg-bg-primary/95 px-3 py-3 backdrop-blur sm:px-6 lg:static lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
            <details
              id="admin-mobile-menu"
              className="group relative shrink-0 lg:hidden"
            >
              <summary
                aria-label="Abrir menu administrativo"
                className="flex h-11 w-11 list-none cursor-pointer items-center justify-center rounded-xl border border-border-color bg-bg-secondary text-text-primary [&::-webkit-details-marker]:hidden"
              >
                <Menu
                  aria-hidden="true"
                  className="h-5 w-5 group-open:hidden"
                />
                <X
                  aria-hidden="true"
                  className="hidden h-5 w-5 group-open:block"
                />
              </summary>
              <div className="absolute left-0 top-full mt-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-border-color bg-bg-primary p-3 shadow-xl">
                <div className="mb-3 border-b border-border-color px-2 pb-3">
                  <AdminBrand />
                </div>
                <AdminNavigation mobile />
                <div className="mt-3 border-t border-border-color pt-3">
                  <p className="mb-2 truncate px-3 text-xs text-text-secondary">
                    {session?.username}
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                      void handleLogout();
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-erro hover:bg-erro/10"
                  >
                    <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Sair
                  </button>
                </div>
              </div>
            </details>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold text-text-primary sm:text-base">
                Administração da plataforma
              </h1>
              <p className="truncate text-xs text-text-secondary">
                Gestão global · {BRAND.name}
              </p>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-xs font-medium text-brand hover:bg-bg-tertiary sm:px-3 sm:text-sm"
            >
              <span>Ir ao app</span>
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-clip px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
