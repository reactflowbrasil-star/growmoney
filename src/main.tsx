import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import './index.css';

import LandingPage from '@/pages/public/LandingPage';
import Login from '@/pages/auth/Login';
import Cadastro from '@/pages/auth/Cadastro';
import RecuperacaoSenha from '@/pages/auth/RecuperacaoSenha';
import TermosUso from '@/pages/auth/TermosUso';
import Privacidade from '@/pages/auth/Privacidade';
import Dashboard from '@/pages/dashboard/Dashboard';
import DashboardExecutivo from '@/pages/dashboard/DashboardExecutivo';
import Clientes from '@/pages/dashboard/Clientes';
import Contratos from '@/pages/dashboard/Contratos';
import Servicos from '@/pages/dashboard/Servicos';
import Vendedores from '@/pages/dashboard/Vendedores';
import Agenda from '@/pages/dashboard/Agenda';
import Financeiro from '@/pages/dashboard/Financeiro';
import Relatorios from '@/pages/dashboard/Relatorios';
import Auditoria from '@/pages/dashboard/Auditoria';
import Configuracoes from '@/pages/dashboard/Configuracoes';
import Perfil from '@/pages/dashboard/Perfil';
import Empresas from '@/pages/dashboard/Empresas';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/recuperar-senha" element={<RecuperacaoSenha />} />
                <Route path="/termos" element={<TermosUso />} />
                <Route path="/privacidade" element={<Privacidade />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard/executivo" element={<DashboardExecutivo />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/clients" element={<Clientes />} />
                    <Route path="/contratos" element={<Contratos />} />
                    <Route path="/servicos" element={<Servicos />} />
                    <Route path="/vendedores" element={<Vendedores />} />
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/relatorios" element={<Relatorios />} />
                    <Route path="/auditoria" element={<Auditoria />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/empresas" element={<Empresas />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Elemento #root nao encontrado no HTML');
}

createRoot(rootEl).render(<App />);
