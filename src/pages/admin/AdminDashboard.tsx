import { useEffect, useState } from 'react';
import { Building2, Users, FileText, Activity } from 'lucide-react';
import { Card, PageHeader, Badge } from '@/components/ui';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase/client';

type Counts = { companies: number; users: number; contracts: number };

export default function AdminDashboard() {
  const { session } = useAdminAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.rpc('admin_dashboard_counts').then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError(queryError.message);
      else setCounts(data as Counts);
    });
    return () => { active = false; };
  }, []);

  const kpis = [
    { label: 'Empresas', value: counts?.companies ?? '—', icon: Building2, hint: 'Contas na plataforma' },
    { label: 'Usuários', value: counts?.users ?? '—', icon: Users, hint: 'Perfis cadastrados' },
    { label: 'Contratos', value: counts?.contracts ?? '—', icon: FileText, hint: 'Volume global' },
    { label: 'Saúde', value: error ? 'Falha' : counts ? 'OK' : '…', icon: Activity, hint: 'Conexão com o banco' },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title="Visao geral"
        description={`Bem-vindo, ${session?.username}. Acesso administrativo autorizado.`}
      />

      {error && <Card className="p-4 text-sm text-aviso">Não foi possível carregar os indicadores: {error}</Card>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 card-premium">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-text-secondary font-medium">{k.label}</p>
                <p className="text-2xl font-bold mt-1">{k.value}</p>
                <p className="text-xs text-text-secondary mt-1">{k.hint}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <k.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Acoes rapidas</h2>
          <ul className="text-sm text-text-secondary space-y-2">
            <li>Gerencie empresas em <strong className="text-text-primary">Empresas</strong></li>
            <li>Veja contas em <strong className="text-text-primary">Usuarios</strong></li>
            <li>Altere senha em <strong className="text-text-primary">Seguranca</strong></li>
            <li>Monitore eventos em <strong className="text-text-primary">Auditoria</strong></li>
          </ul>
        </Card>
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Status da sessao</h2>
          <div className="flex items-center gap-2">
            <Badge variant="success">Admin autenticado</Badge>
          </div>
          <p className="text-sm text-text-secondary">
            Login em{' '}
            {session?.loggedAt ? new Date(session.loggedAt).toLocaleString('pt-BR') : '-'}
          </p>
          <p className="text-xs text-text-secondary">
            A conta administrativa e autenticada pelo Supabase e autorizada pela lista de administradores da plataforma.
          </p>
        </Card>
      </div>
    </div>
  );
}
