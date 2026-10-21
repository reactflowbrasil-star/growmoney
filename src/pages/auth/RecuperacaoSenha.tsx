import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function RecuperacaoSenha() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md bg-bg-secondary border border-border-color rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Recuperar senha</h1>
          <p className="text-sm text-text-secondary mt-1">Enviaremos instruções para seu email</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="w-4 h-4" />} />
          <Button type="submit" className="w-full">Enviar instruções</Button>
        </form>
        <p className="text-center text-sm text-text-secondary mt-6">
          <Link to="/auth/login" className="text-verde-discreto hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
