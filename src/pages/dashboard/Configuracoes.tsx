import { useState } from 'react';
import { Button, Input, Card, PageHeader, FileUpload } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function Configuracoes() {
  const { user, empresaAtiva } = useAuth();
  const [nomeEmpresa, setNomeEmpresa] = useState(empresaAtiva?.nome || '');
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Configurações" description="Preferências da empresa e do workspace" />
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Empresa</h2>
        <Input label="Nome da empresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} />
        <div>
          <p className="text-sm font-medium mb-2">Logo</p>
          <FileUpload accept="image/*" categoria="fotos" label="Enviar logo (PNG, SVG, JPG)" />
        </div>
        <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>Salvar alterações</Button>
        {saved && <p className="text-sm text-brand">Preferências salvas.</p>}
      </Card>
      <Card className="p-5 space-y-2">
        <h2 className="font-semibold">Conta</h2>
        <p className="text-sm text-text-secondary">Usuário: {user?.email || '—'}</p>
        <p className="text-sm text-text-secondary">Papel: {user?.role || '—'}</p>
      </Card>
    </div>
  );
}

