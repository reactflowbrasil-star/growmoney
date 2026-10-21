import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';

export default function Cadastro() {
  const [form, setForm] = useState({
    empresa: '',
    cnpj: '',
    admin: '',
    email: '',
    senha: '',
    confirmar: '',
  });
  const [termos, setTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.empresa.trim()) {
      setError('Informe o nome da empresa.');
      return;
    }
    if (!form.admin.trim()) {
      setError('Informe o nome do administrador.');
      return;
    }
    if (!form.email.trim()) {
      setError('Informe o e-mail.');
      return;
    }
    if (form.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (form.senha !== form.confirmar) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!termos) {
      setError('Aceite os termos de uso para continuar.');
      return;
    }

    setLoading(true);
    try {
      await register(form.admin.trim(), form.email.trim(), form.senha, form.empresa.trim());
      setSuccess('Conta criada! Redirecionando...');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta.';
      if (/confirm|confirma|email/i.test(msg) && /sent|enviad|verify|verif|Verifique/i.test(msg)) {
        setSuccess(
          'Conta criada. Verifique seu e-mail para confirmar o cadastro e depois faça login.'
        );
      } else if (/already|já|registered|exists|exist/i.test(msg)) {
        setError('Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-4 py-8">
      <div className="w-full max-w-lg bg-bg-primary border border-border-color rounded-xl p-8 shadow-md">
        <div className="text-center mb-6 space-y-4">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-16 md:h-20 w-auto max-w-[260px] mx-auto object-contain"
          />
          <h1 className="text-2xl font-bold text-text-primary">Criar conta</h1>
          <p className="text-sm text-text-secondary">Cadastro empresarial · {BRAND.name}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nome da empresa"
            value={form.empresa}
            onChange={(e) => set('empresa', e.target.value)}
            leftIcon={<Building2 className="w-4 h-4" />}
            required
            autoComplete="organization"
          />
          <Input
            label="CNPJ (opcional)"
            value={form.cnpj}
            onChange={(e) => set('cnpj', e.target.value)}
            leftIcon={<FileText className="w-4 h-4" />}
          />
          <Input
            label="Nome do administrador"
            value={form.admin}
            onChange={(e) => set('admin', e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            value={form.senha}
            onChange={(e) => set('senha', e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirmar senha"
            type="password"
            value={form.confirmar}
            onChange={(e) => set('confirmar', e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
          />

          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={termos}
              onChange={(e) => setTermos(e.target.checked)}
              className="accent-brand mt-1"
            />
            Aceito os termos de uso e política de privacidade
          </label>

          {error && (
            <p className="text-sm text-erro bg-erro/10 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-brand bg-brand/10 rounded-lg px-3 py-2" role="status">
              {success}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            Criar conta
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Já tem conta?{' '}
          <Link to="/auth" className="text-brand hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
