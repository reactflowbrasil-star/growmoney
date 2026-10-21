import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AdminSession } from '@/lib/admin-auth';

interface AdminAuthValue {
  session: AdminSession | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (current: string, next: string) => Promise<void>;
  updateEmail: (email: string, currentPassword: string) => Promise<void>;
  accountEmail: string;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

async function hasPlatformAdminAccess(userId: string) {
  const { data, error } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao verificar acesso administrativo: ${error.message}`);
  return Boolean(data);
}

function toAdminSession(user: { id: string; email?: string | null }): AdminSession {
  return {
    userId: user.id,
    username: user.email || user.id,
    loggedAt: new Date().toISOString(),
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreAdminSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session?.user && await hasPlatformAdminAccess(data.session.user.id) && mounted) {
          setSession(toAdminSession(data.session.user));
        }
      } catch (error) {
        console.error('Falha ao restaurar acesso administrativo', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void restoreAdminSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setSession(null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(`Falha no login: ${error.message}`);
    if (!data.user) throw new Error('A autenticação não retornou um usuário.');

    let authorized = false;
    try {
      authorized = await hasPlatformAdminAccess(data.user.id);
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }

    if (!authorized) {
      await supabase.auth.signOut();
      throw new Error('Esta conta não possui autorização para administrar a plataforma.');
    }
    const { error: auditError } = await supabase.rpc('admin_log_event', {
      p_action: 'login',
      p_details: { method: 'password' },
    });
    if (auditError) console.error('Falha ao registrar login administrativo', auditError);
    setSession(toAdminSession(data.user));
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setSession(null);
    if (error) throw new Error(`Falha ao sair: ${error.message}`);
  }, []);

  const updatePassword = useCallback(async (current: string, next: string) => {
    if (next.length < 12) throw new Error('A nova senha deve ter pelo menos 12 caracteres.');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) {
      throw new Error('Não foi possível identificar a conta autenticada.');
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: current,
    });
    if (reauthError) throw new Error('A senha atual está incorreta.');

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) throw new Error(`Falha ao alterar senha: ${error.message}`);
  }, []);

  const updateEmail = useCallback(async (email: string, currentPassword: string) => {
    const nextEmail = email.trim().toLowerCase();
    if (!nextEmail) throw new Error('Informe um e-mail válido.');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user?.email) {
      throw new Error('Não foi possível identificar a conta autenticada.');
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });
    if (reauthError) throw new Error('A senha atual está incorreta.');

    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error) throw new Error(`Falha ao atualizar e-mail: ${error.message}`);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        isAdmin: Boolean(session),
        isLoading,
        login,
        logout,
        updatePassword,
        updateEmail,
        accountEmail: session?.username || '',
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
