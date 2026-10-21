import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Calendar,
  Wallet,
  BarChart3,
  Shield,
  Settings,
  Building2,
  TrendingUp,
  FileSignature,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Executivo', href: '/dashboard/executivo', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Empresas', href: '/empresas', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Clientes', href: '/clientes', icon: <Users className="w-5 h-5" /> },
  { label: 'Contratos', href: '/contratos', icon: <FileText className="w-5 h-5" /> },
  { label: 'Assinaturas', href: '/assinaturas', icon: <FileSignature className="w-5 h-5" /> },
  { label: 'Servicos', href: '/servicos', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Vendedores', href: '/vendedores', icon: <Users className="w-5 h-5" /> },
  { label: 'Agenda', href: '/agenda', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Financeiro', href: '/financeiro', icon: <Wallet className="w-5 h-5" /> },
  { label: 'Relatorios', href: '/relatorios', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Auditoria', href: '/auditoria', icon: <Shield className="w-5 h-5" /> },
  { label: 'Configuracoes', href: '/configuracoes', icon: <Settings className="w-5 h-5" /> },
  { label: 'Perfil', href: '/perfil', icon: <Settings className="w-5 h-5" /> },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Inicia aberta e recolhe automaticamente ap�s 4 segundos (desktop)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSidebarCollapsed(true);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  // Fecha drawer mobile ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const layoutUser = user ? { name: user.nome, email: user.email, avatar: user.avatar } : undefined;

  return (
    <div className="min-h-dvh bg-transparent">
      <div className="hidden md:block">
        <Sidebar
          items={navItems}
          logo={BRAND.logo}
          user={layoutUser}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      <div
        className={cn(
          'md:hidden fixed inset-0 z-50 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[min(100%,20rem)] bg-bg-primary shadow-xl transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar
            items={navItems}
            logo={BRAND.logo}
            user={layoutUser}
            embedded
            onCollapse={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <div
        className={cn(
          'transition-[margin-left] duration-300 ease-in-out',
          'md:ml-72',
          sidebarCollapsed && 'md:ml-24'
        )}
      >
        <Header
          onMenuToggle={() => {
            if (window.matchMedia('(max-width: 767px)').matches) {
              setMobileOpen((o) => !o);
            } else {
              setSidebarCollapsed((c) => !c);
            }
          }}
          user={layoutUser}
          onLogout={handleLogout}
        />
        <main className="p-4 md:p-6 lg:p-8 mobile-nav-pad animate-in" role="main">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}


