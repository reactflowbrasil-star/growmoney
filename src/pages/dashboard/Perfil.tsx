import { useState } from 'react';
import { Button, Input, Card, PageHeader, FileUpload } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function Perfil() {
  const { user } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [msg, setMsg] = useState('');

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Meu perfil" description="Dados pessoais e avatar" />
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand/15 text-brand flex items-center justify-center text-xl font-bold">
            {(nome || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{nome || user?.nome}</p>
            <p className="text-sm text-text-secondary">{user?.email}</p>
          </div>
        </div>
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <div>
          <p className="text-sm font-medium mb-2">Foto de perfil</p>
          <FileUpload accept="image/*" />
        </div>
        <Button onClick={() => { setMsg('Perfil atualizado.'); setTimeout(() => setMsg(''), 2000); }}>Salvar</Button>
        {msg && <p className="text-sm text-brand">{msg}</p>}
      </Card>
    </div>
  );
}
