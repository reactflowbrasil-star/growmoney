import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import LandingPage from '@/pages/public/LandingPage';
import Login from '@/pages/auth/Login';
import Cadastre from '@/pages/auth/Cadastre';
import RecuperaçãoSenha from '@/pages/auth/RecuperaçãoSenha';
import TermosUso from '@/pages/auth/TermosUso';
import Privacidade from '@/pages/auth/Privacidade';
import Dashboard from '@/pages/dashboard/Dashboard';
import Clientes from '@/pages/dashboard/ Clientes';
import Contratos from '@/pages/dashboard/Contratos';
import Servicos from '@/pages/dashboard/Servicos';
import Vendedores from '@/pages/dashboard/Vendedores';
import Agenda from '@/pages/dashboard/Agenda';
import Financeiro from '@/pages/dashboard/Financeiro';
import Relatorios from '@/pages/dashboard/Relatorios';
import Auditoria from '@/pages/dashboard/Auditoria';
import Configuracoes from '@/pages/dashboard/Configuracoes';
import Perfil from '@/pages/dashboard/Perfil';
import DashboardExecutivo from '@/pages/dashboard/DashboardExecutivo';
import Empresas from '@/pages/dashboard/Empresas';
import { navItems } from '@/config/nav';
import './index.css';
import './design-system/tokens.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Login />} />
              <Route path="/cadastro" element={<Cadastre />} />
              <Route path="/recuperar-senha" element={<RecuperaçãoSenha />} />
              <Route path="/termos" element={<TermosUso />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/dashboard" element={<AppLayout navItems={navItems}><Dashboard /></AppLayout>} />
              <Route path="/dashboard/executivo" element={<AppLayout navItems={navItems}><DashboardExecutivo /></AppLayout>} />
              <Route path="/empresas" element={<AppLayout navItems={navItems}><Empresas /></AppLayout>} />
              <Route path="/clients" element={<AppLayout navItems={navItems}>< Clientes /></AppLayout>} />
              <Route path="/contratos" element={<AppLayout navItems={navItems}><Contratos /></AppLayout>} />
              <Route path="/servicos" element={<AppLayout navItems={navItems}><Servicos /></AppLayout>} />
              <Route path="/vendedores" element={<AppLayout navItems={navItems}><Vendedores /></AppLayout>} />
              <Route path="/agenda" element={<AppLayout navItems={navItems}><Agenda /></AppLayout>} />
              <Route path="/financeiro" element={<AppLayout navItems={navItems}><Financeiro /></AppLayout>} />
              <Route path="/relatorios" element={<AppLayout navItems={navItems}><Relatorios /></AppLayout>} />
              <Route path="/auditoria" element={<AppLayout navItems={navItems}><Auditoria /></AppLayout>} />
              <Route path="/configuracoes" element={<AppLayout navItems={navItems}><Configuracoes /></AppLayout>} />
              <Route path="/perfil" element={<AppLayout navItems={navItems}><Perfil /></AppLayout>} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;