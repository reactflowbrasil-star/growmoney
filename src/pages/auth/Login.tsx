import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';
import { GoogleButton } from '@/components/auth/GoogleButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar. Verifique e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="text-center mb-8 space-y-4">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-[168px] md:h-[200px] w-auto max-w-[520px] mx-auto object-contain"
          />
          <p className="text-text-secondary text-sm">{BRAND.tagline}</p>
        </div>

        <GoogleButton label="Entrar com Google" />

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-color" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bg-primary px-2 text-text-secondary">ou e-mail</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-erro" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/recuperar-senha" className="text-verde-discreto hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <div className="mt-2 text-center text-sm text-text-secondary">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-verde-discreto hover:underline">
            Cadastre-se
          </Link>
        </div>
      </Card>
    </div>
  );
}
