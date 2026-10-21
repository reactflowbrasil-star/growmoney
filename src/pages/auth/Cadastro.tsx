import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function Cadastro() {
  const [form, setForm] = useState({ empresa: '', cnpj: '', admin: '', email: '', senha: '', confirmar: '' });
  const [termos, setTermos] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-8">
      <div className="w-full max-w-lg bg-bg-secondary border border-border-color rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Criar conta</h1>
          <p className="text-sm text-text-secondary mt-1">Cadastro empresarial GrowMoney</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Nome da empresa" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} leftIcon={<Building2 className="w-4 h-4" />} />
          <Input label="CNPJ" value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} leftIcon={<FileText className="w-4 h-4" />} />
          <Input label="Nome do administrador" value={form.admin} onChange={(e) => set('admin', e.target.value)} leftIcon={<User className="w-4 h-4" />} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} leftIcon={<Mail className="w-4 h-4" />} />
          <Input label="Senha" type="password" value={form.senha} onChange={(e) => set('senha', e.target.value)} leftIcon={<Lock className="w-4 h-4" />} />
          <Input label="Confirmar senha" type="password" value={form.confirmar} onChange={(e) => set('confirmar', e.target.value)} leftIcon={<Lock className="w-4 h-4" />} />
          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={termos} onChange={(e) => setTermos(e.target.checked)} className="accent-verde-discreto mt-1" />
            Aceito os termos de uso e política de privacidade
          </label>
          <Button type="submit" className="w-full">Criar conta</Button>
        </form>
        <p className="text-center text-sm text-text-secondary mt-6">
          Já tem conta? <Link to="/auth/login" className="text-verde-discreto hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
