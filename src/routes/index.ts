import { RouteObject } from 'react-router-dom';

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType> | React.ComponentType;
  label?: string;
  icon?: React.ReactNode;
  requireAuth?: boolean;
  children?: RouteConfig[];
}

export const publicRoutes: RouteConfig[] = [
  { path: '/', element: () => import('@/pages/public/LandingPage'), label: 'Início' },
  { path: '/auth', element: () => import('@/pages/auth/Login'), label: 'Entrar' },
  { path: '/cadastro', element: () => import('@/pages/auth/Cadastre'), label: 'C-adastre' },
  { path: '/recuperar-senha', element: () => import('@/pages/auth/RecuperaçãoSenha'), label: 'Recuperar Senha' },
  { path: '/termos', element: () => import('@/pages/auth/TermosUso'), label: 'Termos de Uso' },
  { path: '/privacidade', element: () => import('@/pages/auth/Privacidade'), label: 'Privacidade' },
];

export const dashboardRoutes: RouteConfig[] = [
  { path: '/dashboard', element: () => import('@/pages/dashboard/Dashboard'), label: 'Dashboard', icon: 'Layout' },
  { path: '/clients', element: () => import('@/pages/dashboard/ Clientes'), label: ' Clientes', icon: 'Users' },
  { path: '/contratos', element: () => import('@/pages/dashboard/Contratos'), label: 'Contratos', icon: 'FileText' },
  { path: '/servicos', element: () => import('@/pages/dashboard/Servicos'), label: 'Serviços', icon: 'Briefcase' },
  { path: '/vendedores', element: () => import('@/pages/dashboard/Vendedores'), label: 'Vendedores', icon: 'User' },
  { path: '/agenda', element: () => import('@/pages/dashboard/Agenda'), label: 'Agenda', icon: 'Calendar' },
  { path: '/financeiro', element: () => import('@/pages/dashboard/Financeiro'), label: 'Financeiro', icon: 'DollarSign' },
  { path: '/relatorios', element: () => import('@/pages/dashboard/Relatorios'), label: 'Relatorios', icon: 'BarChart' },
  { path: '/auditoria', element: () => import('@/pages/dashboard/Auditoria'), label: 'Auditoria', icon: 'Activity' },
  { path: '/configuracoes', element: () => import('@/pages/dashboard/Configuracoes'), label: 'Configuracoes', icon: 'Settings' },
  { path: '/perfil', element: () => import('@/pages/dashboard/Perfil'), label: 'Perfil', icon: 'User' },
];

export const allRoutes = [...publicRoutes, ...dashboardRoutes];