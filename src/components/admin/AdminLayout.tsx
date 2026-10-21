import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Shield,
  LogOut,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const nav = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin/sistema', label: 'Sistema', icon: Server },
  { to: '/admin/auditoria', label: 'Auditoria', icon: Shield },
  { to: '/admin/seguranca', label: 'Segurança', icon: Settings },
];

export function AdminLayout() {
  const { session, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      <aside className="w-64 shrink-0 border-r border-border-color bg-bg-primary flex flex-col">
        <div className="h-20 px-4 flex items-center border-b border-border-color">
          <Link to="/admin" className="flex flex-col gap-0.5">
            <img
              src={BRAND.logo}
              alt={BRAND.name}
              className="h-10 w-auto max-w-[160px] object-contain"
            />
            <span className="text-[10px] uppercase tracking-widest text-brand font-semibold">
              Painel Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/15 text-brand'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border-color">
          <p className="text-xs text-text-secondary px-2 mb-2 truncate">{session?.username}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-erro hover:bg-erro/10"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border-color bg-bg-primary px-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-text-primary">Administração da plataforma</h1>
            <p className="text-xs text-text-secondary">Gestão global · {BRAND.name}</p>
          </div>
          <Link to="/dashboard" className="text-xs text-brand hover:underline">
            Ir ao app →
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
