import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { Lock, User } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { BRAND } from '@/lib/brand';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha no login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="text-center mb-8 space-y-3">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-[96px] md:h-[120px] w-auto max-w-[360px] mx-auto object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-brand font-semibold">Painel Admin</p>
            <p className="text-sm text-text-secondary mt-1">
              Acesso restrito à administração da plataforma
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
            autoComplete="username"
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-erro bg-erro/10 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Entrar no admin
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-text-secondary">
          <Link to="/" className="text-brand hover:underline">
            ← Voltar ao site
          </Link>
        </p>
      </Card>
    </div>
  );
}
