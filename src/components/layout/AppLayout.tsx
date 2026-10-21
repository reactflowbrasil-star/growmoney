import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Executivo', href: '/dashboard/executivo', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Empresas', href: '/empresas', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Clientes', href: '/clientes', icon: <Users className="w-5 h-5" /> },
  { label: 'Contratos', href: '/contratos', icon: <FileText className="w-5 h-5" /> },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const layoutUser = user
    ? { name: user.nome, email: user.email }
    : undefined;

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Sidebar
        items={navItems}
        logo={BRAND.logo}
        user={layoutUser}
        onCollapse={setSidebarCollapsed}
      />
      <div
        className={`transition-[margin-left] duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-24' : 'ml-24 md:ml-72'
        }`}
      >
        <Header
          onMenuToggle={() => setSidebarCollapsed((c) => !c)}
          user={layoutUser}
          onLogout={handleLogout}
        />
        <main className="p-4 md:p-6 lg:p-8" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
