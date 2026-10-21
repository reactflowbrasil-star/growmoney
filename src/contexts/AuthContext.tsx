import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { criarLinkArquivo } from '@/services/file-storage';
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
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchEmpresa: (empresaId: string) => void;
  refreshEmpresas: () => Promise<void>;
  updateProfile: (nome: string, avatarPath?: string | null) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata || {};
  return (
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.nome as string) ||
    (user.email ? user.email.split('@')[0] : 'Usuario')
  );
}

function getAuthCallbackUrl() {
  const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL('auth/callback', appBaseUrl).toString();
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
        setUser((current) => current ? { ...current, role: (active.role || current.role) as UserSession['role'] } : current);
      }
    } catch (err) {
      console.warn('Erro ao carregar empresas', err);
    }
  }, []);

  const ensureProfileAndEmpresa = useCallback(
    async (authUser: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }) => {
      const nome = displayNameFromUser(authUser);

      const { data: memberships } = await supabase
        .from('empresa_members')
        .select('id')
        .eq('usuario_id', authUser.id)
        .eq('status', 'aceito')
        .limit(1);

      if (memberships && memberships.length > 0) return;

      const empresaNome =
        (authUser.user_metadata?.empresa as string) ||
        `${nome.split(' ')[0]} � Empresa`;

      const { error: empresaError } = await supabase.rpc('ensure_default_empresa', {
        p_nome: empresaNome,
      });
      if (empresaError) {
        console.warn('empresa OAuth:', empresaError.message);
      }
    },
    []
  );

  const hydrateFromSession = useCallback(
    async (session: {
      user: {
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown>;
      };
      access_token: string;
      expires_at?: number;
    }) => {
      await ensureProfileAndEmpresa(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      const sessionUser: UserSession = {
        id: session.user.id,
        email: session.user.email || profile?.email || '',
        nome: profile?.nome || displayNameFromUser(session.user),
        avatar_url: profile?.avatar_url || null,
        avatar: profile?.avatar_url ? await criarLinkArquivo(profile.avatar_url).catch(() => undefined) : undefined,
        role: (profile?.role as any) || 'admin',
        empresa_id: null,
        empresas: [],
        token: session.access_token,
        expira_em: String(session.expires_at || ''),
      };
      setUser(sessionUser);
      await loadUserCompanies(session.user.id);
    },
    [ensureProfileAndEmpresa, loadUserCompanies]
  );

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          await hydrateFromSession(session as any);
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setEmpresas([]);
        setEmpresaAtiva(null);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        try {
          await hydrateFromSession(session as any);
        } catch (e) {
          console.warn('hydrate auth', e);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateFromSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(`Falha ao autenticar: ${error.message}`);
      if (!data.session) throw new Error('Sess�o n�o criada');
      await hydrateFromSession(data.session as any);
    },
    [hydrateFromSession]
  );

  const loginWithGoogle = useCallback(async () => {
    const redirectTo = getAuthCallbackUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) throw new Error(error.message || 'Falha ao iniciar login com Google');
  }, []);

  const register = useCallback(
    async (nome: string, email: string, senha: string, empresaNome: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome, empresa: empresaNome },
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });
      if (error) throw new Error(error.message || 'Falha ao registrar');
      if (!data.user) throw new Error('Usu�rio n�o retornado ap�s cadastro');

      if (!data.session) {
        throw new Error(
          'Conta criada. Verifique seu e-mail para confirmar o cadastro e depois fa�a login.'
        );
      }

      const { data: empresaId, error: empresaError } = await supabase.rpc('ensure_default_empresa', {
        p_nome: empresaNome,
      });
      if (empresaError) {
        throw new Error(`Conta criada, mas falha ao criar empresa: ${empresaError.message}`);
      }
      if (!empresaId) throw new Error('A conta foi criada, mas a empresa inicial nao foi criada.');
      const novaEmpresa = { id: empresaId, nome: empresaNome };

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
        localStorage.setItem('empresaAtiva', novaEmpresa.id);
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
        setUser((current) => current ? { ...current, role: (empresa.role || current.role) as UserSession['role'] } : current);
        localStorage.setItem('empresaAtiva', empresaId);
      }
    },
    [empresas]
  );

  const refreshEmpresas = useCallback(async () => {
    if (user) await loadUserCompanies(user.id);
  }, [user, loadUserCompanies]);

  const updateProfile = useCallback(async (nome: string, avatarPath?: string | null) => {
    if (!user) throw new Error('Entre na sua conta para atualizar o perfil.');
    const updates: { nome: string; avatar_url?: string | null } = { nome: nome.trim() };
    if (avatarPath !== undefined) updates.avatar_url = avatarPath;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(`N�o foi poss�vel salvar o perfil: ${error.message}`);
    if (!data) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        nome: updates.nome,
        avatar_url: updates.avatar_url ?? null,
      });
      if (insertError) throw new Error(`N�o foi poss�vel salvar o perfil: ${insertError.message}`);
    }
    const path = updates.avatar_url === undefined ? user.avatar_url : updates.avatar_url;
    const avatar = path ? await criarLinkArquivo(path).catch(() => undefined) : undefined;
    setUser((current) => current ? { ...current, nome: updates.nome, avatar_url: path, avatar } : current);
  }, [user]);

  const hasPermissionCb = useCallback(
    (permission: string) => {
      const role = empresaAtiva?.role || user?.role;
      if (!role) return false;
      return checkPermission(role as any, permission as any);
    },
    [user, empresaAtiva]
  );

  const value: AuthContextValue = {
    user,
    empresas,
    empresaAtiva,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    switchEmpresa,
    refreshEmpresas,
    updateProfile,
    hasPermission: hasPermissionCb,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


