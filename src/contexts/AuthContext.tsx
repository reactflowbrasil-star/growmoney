import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
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
    try {
      const { data, error } = await supabase
        .from('empresa_members')
        .select(`empresa_id, role, empresas (id, nome, cnpj)`)
        .eq('usuario_id', userId)
        .eq('status', 'aceito');

      if (error) {
        console.warn('Falha ao carregar empresas:', error.message);
        return;
      }

      const loadedEmpresas: Empresa[] = (data || []).map((m: any) => ({
        id: m.empresas?.id ?? m.empresa_id,
        nome: m.empresas?.nome ?? 'Empresa',
        cnpj: m.empresas?.cnpj ?? null,
        role: m.role,
      }));
      setEmpresas(loadedEmpresas);

      if (loadedEmpresas.length > 0) {
        const savedId = localStorage.getItem('empresaAtiva');
        const active =
          loadedEmpresas.find((e) => e.id === savedId) || loadedEmpresas[0];
        setEmpresaAtiva(active);
      }
    } catch (err) {
      console.warn('Erro ao carregar empresas', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const sessionUser: UserSession = {
            id: session.user.id,
            email: session.user.email || profile?.email || '',
            nome: profile?.nome || session.user.user_metadata?.nome || 'Usuario',
            role: (profile?.role as any) || 'vendedor',
            empresa_id: null,
            empresas: [],
            token: session.access_token,
            expira_em: String(session.expires_at || ''),
          };
          setUser(sessionUser);
          await loadUserCompanies(session.user.id);
        }
      } catch (err) {
        console.warn('Erro ao restaurar sessao', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session) {
        setUser(null);
        setEmpresas([]);
        setEmpresaAtiva(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserCompanies]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(`Falha ao autenticar: ${error.message}`);

      const { data: usuario } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .maybeSingle();

      const session: UserSession = {
        id: data.user!.id,
        email: data.user!.email || email,
        nome: usuario?.nome || data.user!.user_metadata?.nome || 'Usuario',
        role: (usuario?.role as any) || 'admin',
        empresa_id: null,
        empresas: [],
        token: data.session?.access_token || '',
        expira_em: String(data.session?.expires_at || ''),
      };

      setUser(session);
      await loadUserCompanies(session.id);
    },
    [loadUserCompanies]
  );

  const register = useCallback(
    async (nome: string, email: string, senha: string, empresaNome: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      });
      if (error) throw new Error(`Falha ao registrar: ${error.message}`);
      if (!data.user) throw new Error('Usuario nao retornado apos cadastro');

      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        nome,
        role: 'admin',
      });

      const { data: novaEmpresa } = await supabase
        .from('empresas')
        .insert({
          nome: empresaNome,
          responsavel_id: data.user.id,
        })
        .select('*')
        .single();

      if (novaEmpresa) {
        await supabase.from('empresa_members').insert({
          empresa_id: novaEmpresa.id,
          usuario_id: data.user.id,
          role: 'admin',
          status: 'aceito',
        });
      }

      const session: UserSession = {
        id: data.user.id,
        email,
        nome,
        role: 'admin',
        empresa_id: novaEmpresa?.id || null,
        empresas: novaEmpresa
          ? [{ id: novaEmpresa.id, nome: empresaNome, role: 'admin' }]
          : [],
        token: data.session?.access_token || '',
        expira_em: String(data.session?.expires_at || ''),
      };

      setUser(session);
      if (novaEmpresa) {
        const emp: Empresa = {
          id: novaEmpresa.id,
          nome: empresaNome,
          cnpj: null,
          role: 'admin',
        };
        setEmpresaAtiva(emp);
        setEmpresas([emp]);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmpresas([]);
    setEmpresaAtiva(null);
    localStorage.removeItem('empresaAtiva');
  }, []);

  const switchEmpresa = useCallback(
    (empresaId: string) => {
      const empresa = empresas.find((e) => e.id === empresaId);
      if (empresa) {
        setEmpresaAtiva(empresa);
        localStorage.setItem('empresaAtiva', empresaId);
      }
    },
    [empresas]
  );

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
