import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { BrandLogo } from '@/components/brand/BrandLogo';

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
    document.body.classList.add('auth-layout-active');
    return () => document.body.classList.remove('auth-layout-active');
  }, []);

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
    <main className="auth-screen w-full flex items-center justify-center bg-transparent overflow-x-clip px-3 py-[max(.5rem,env(safe-area-inset-top))] pb-[max(.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-3">
      <div className="auth-card w-full max-w-xl bg-bg-primary/90 backdrop-blur-xl border border-border-color rounded-2xl p-3 sm:p-5 shadow-lg">
        <div className="auth-brand text-center mb-3 space-y-1.5">
          <BrandLogo linkTo={false} heightClass="h-auto max-h-[min(11svh,68px)]" className="auth-logo mx-auto w-full max-w-[min(100%,250px)]" />
          <h1 className="text-xl font-bold text-text-primary">Criar conta</h1>
          <p className="text-sm text-text-secondary">Cadastro empresarial · {BRAND.name}</p>
        </div>

        <GoogleButton label="Cadastrar com Google" className="auth-google" />

        <div className="auth-divider relative my-2.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-color" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bg-primary px-2 text-text-secondary">ou preencha o formulário</span>
          </div>
        </div>

        <form className="auth-form grid grid-cols-2 gap-x-3 gap-y-2" onSubmit={handleSubmit}>
          <div className="col-span-2"><Input label="Nome da empresa" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} leftIcon={<Building2 className="w-4 h-4" />} required autoComplete="organization" /></div>
          <Input label="CNPJ (opcional)" value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} leftIcon={<FileText className="w-4 h-4" />} />
          <Input label="Nome do administrador" value={form.admin} onChange={(e) => set('admin', e.target.value)} leftIcon={<User className="w-4 h-4" />} required autoComplete="name" />
          <div className="col-span-2"><Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} leftIcon={<Mail className="w-4 h-4" />} required autoComplete="email" /></div>
          <Input label="Senha" type="password" value={form.senha} onChange={(e) => set('senha', e.target.value)} leftIcon={<Lock className="w-4 h-4" />} required autoComplete="new-password" />
          <Input label="Confirmar senha" type="password" value={form.confirmar} onChange={(e) => set('confirmar', e.target.value)} leftIcon={<Lock className="w-4 h-4" />} required autoComplete="new-password" />

          <label className="col-span-2 flex items-start gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={termos} onChange={(e) => setTermos(e.target.checked)} className="accent-brand mt-1" />
            Aceito os termos de uso e política de privacidade
          </label>

          {error && (
            <p className="col-span-2 text-sm text-erro bg-erro/10 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="col-span-2 text-sm text-brand bg-brand/10 rounded-lg px-3 py-2" role="status">
              {success}
            </p>
          )}

          <Button type="submit" className="col-span-2 w-full" loading={loading} disabled={loading}>
            Criar conta
          </Button>
        </form>

        <p className="auth-footer text-center text-sm text-text-secondary mt-3">
          Já tem conta?{' '}
          <Link to="/auth" className="text-brand hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

