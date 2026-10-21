import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { hasPermission as checkPermission } from '@/lib/permissions';
import type { UserSession, Empresa } from '@/lib/auth-types';

interface AuthContextValue {
  user: UserSession | null;
  empresas: Empresa[];
  empresaAtiva: Empresa | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, empresaNome: string) => Promise<void>;
  logout: () => Promise<void>;
  switchEmpresa: (empresaId: string) => void;
  refreshEmpresas: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserCompanies = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('empresa_members')
      .select(`
        empresa_id,
        role,
        empresas (id, nome, cnpj)
      `)
      .eq('usuario_id', userId)
      .eq('status', 'aceito');

    if (error) throw new Error(`Falha ao carregar empresas: ${error.message}`);

    const loadedEmpresas = (data || []).map((m: any) => ({
      id: m.empresas.id,
      nome: m.empresas.nome,
      cnpj: m.empresas.cnpj,
      role: m.role,
    }));
    setEmpresas(loadedEmpresas);

    if (loadedEmpresas.length > 0) {
      const savedId = localStorage.getItem('empresaAtiva');
      const active = loadedEmpresas.find((e) => e.id === savedId) || loadedEmpresas[0];
      setEmpresaAtiva(active);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(`Falha ao autenticar: ${error.message}`);

    const { data: usuario, error: usuarioError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (usuarioError) throw new Error(`Falha ao buscar perfil: ${usuarioError.message}`);

    const session: UserSession = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
      empresa_id: null,
      empresas: [],
      token: data.session?.access_token || '',
      expira_em: data.session?.expires_at || '',
    };

    setUser(session);
    await loadUserCompanies(session.id);
  }, [loadUserCompanies]);

  const register = useCallback(async (nome: string, email: string, senha: string, empresaNome: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) throw new Error(`Falha ao registrar: ${error.message}`);

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user?.id,
      email,
      nome,
      role: 'admin',
    });

    if (profileError) throw new Error(`Falha ao criar perfil: ${profileError.message}`);

    const { error: empresaError } = await supabase.from('empresas').insert({
      nome: empresaNome,
      responsavel_id: data.user?.id,
    });

    if (empresaError) throw new Error(`Falha ao criar empresa: ${empresaError.message}`);

    const { data: novaEmpresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('responsavel_id', data.user?.id)
      .single();

    if (novaEmpresa) {
      await supabase.from('empresa_members').insert({
        empresa_id: novaEmpresa.id,
        usuario_id: data.user?.id,
        role: 'admin',
        status: 'aceito',
      });
    }

    const session: UserSession = {
      id: data.user?.id,
      email,
      nome,
      role: 'admin',
      empresa_id: novaEmpresa?.id || null,
      empresas: [{ id: novaEmpresa?.id || '', nome: empresaNome, role: 'admin' }],
      token: data.session?.access_token || '',
      expira_em: data.session?.expires_at || '',
    };

    setUser(session);
    if (novaEmpresa) setEmpresaAtiva(novaEmpresa as unknown as Empresa);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmpresas([]);
    setEmpresaAtiva(null);
  }, []);

  const switchEmpresa = useCallback((empresaId: string) => {
    const empresa = empresas.find((e) => e.id === empresaId);
    if (empresa) {
      setEmpresaAtiva(empresa);
      localStorage.setItem('empresaAtiva', empresaId);
    }
  }, [empresas]);

  const refreshEmpresas = useCallback(async () => {
    if (user) await loadUserCompanies(user.id);
  }, [user, loadUserCompanies]);

  const hasPermissionCb = useCallback(
    (permission: string) => {
      if (!user || !user.role) return false;
      return checkPermission(user.role as any, permission as any);
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    empresas,
    empresaAtiva,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    switchEmpresa,
    refreshEmpresas,
    hasPermission: hasPermissionCb,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}