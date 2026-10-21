import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  getAdminSession,
  createAdminSession,
  setAdminSession,
  validateAdminLogin,
  changeAdminPassword,
  changeAdminUsername,
  getAdminCredentials,
  type AdminSession,
} from '@/lib/admin-auth';

interface AdminAuthValue {
  session: AdminSession | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updatePassword: (current: string, next: string) => Promise<void>;
  updateUsername: (username: string, password: string) => Promise<void>;
  credentialsUsername: string;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [credentialsUsername, setCredentialsUsername] = useState('admin');

  useEffect(() => {
    setSession(getAdminSession());
    setCredentialsUsername(getAdminCredentials().username);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    if (!validateAdminLogin(username, password)) {
      throw new Error('Usuário ou senha inválidos.');
    }
    const s = createAdminSession(username.trim());
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    setAdminSession(null);
    setSession(null);
  }, []);

  const updatePassword = useCallback(async (current: string, next: string) => {
    const result = changeAdminPassword(current, next);
    if (!result.ok) throw new Error(result.error);
  }, []);

  const updateUsername = useCallback(
    async (username: string, password: string) => {
      const result = changeAdminUsername(username, password);
      if (!result.ok) throw new Error(result.error);
      setCredentialsUsername(getAdminCredentials().username);
      if (session) {
        const s = createAdminSession(username.trim());
        setSession(s);
      }
    },
    [session]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        isAdmin: !!session,
        isLoading,
        login,
        logout,
        updatePassword,
        updateUsername,
        credentialsUsername,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
