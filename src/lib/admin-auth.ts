const CREDS_KEY = 'grow_admin_credentials';
const SESSION_KEY = 'grow_admin_session';

export type AdminCredentials = {
  username: string;
  password: string;
};

const DEFAULT_CREDS: AdminCredentials = {
  username: 'admin',
  password: '123',
};

export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return { ...DEFAULT_CREDS };
    const parsed = JSON.parse(raw) as AdminCredentials;
    if (parsed?.username && parsed?.password) return parsed;
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_CREDS };
}

export function setAdminCredentials(next: AdminCredentials) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(next));
}

export function validateAdminLogin(username: string, password: string): boolean {
  const creds = getAdminCredentials();
  return (
    username.trim().toLowerCase() === creds.username.toLowerCase() &&
    password === creds.password
  );
}

export function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): { ok: true } | { ok: false; error: string } {
  const creds = getAdminCredentials();
  if (currentPassword !== creds.password) {
    return { ok: false, error: 'Senha atual incorreta.' };
  }
  if (newPassword.length < 3) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 3 caracteres.' };
  }
  setAdminCredentials({ ...creds, password: newPassword });
  return { ok: true };
}

export function changeAdminUsername(
  newUsername: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const creds = getAdminCredentials();
  if (password !== creds.password) {
    return { ok: false, error: 'Senha incorreta.' };
  }
  if (!newUsername.trim()) {
    return { ok: false, error: 'Usuário inválido.' };
  }
  setAdminCredentials({ username: newUsername.trim(), password: creds.password });
  return { ok: true };
}

export type AdminSession = {
  username: string;
  loggedAt: string;
};

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function createAdminSession(username: string): AdminSession {
  const session: AdminSession = {
    username,
    loggedAt: new Date().toISOString(),
  };
  setAdminSession(session);
  return session;
}
