import { LayoutDashboard, Users, FileText, Briefcase, Calendar, Wallet, BarChart3, Shield, Settings, Building2, TrendingUp } from 'lucide-react';

export const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Executivo', href: '/dashboard/executivo', icon: TrendingUp },
  { label: 'Empresas', href: '/empresas', icon: Building2 },
  { label: 'Client', href: '/clients', icon: Users },
  { label: 'Contratos', href: '/contratos', icon: FileText },
  { label: 'Servicos', href: '/servicos', icon: Briefcase },
  { label: 'Vendedores', href: '/vendedores', icon: Users },
  { label: 'Agenda', href: '/agenda', icon: Calendar },
  { label: 'Financeiro', href: '/financeiro', icon: Wallet },
  { label: 'Relatorios', href: '/relatorios', icon: BarChart3 },
  { label: 'Auditoria', href: '/auditoria', icon: Shield },
  { label: 'Configuracoes', href: '/configuracoes', icon: Settings },
  { label: 'Perfil', href: '/perfil', icon: Settings },
];
