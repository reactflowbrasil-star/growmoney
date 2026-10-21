import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { Card, PageHeader, Badge, EmptyState } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';

type AuditEvent = {
  id: string;
  email: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export default function AdminAuditoria() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.rpc('admin_list_audit', { p_limit: 200 }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError(queryError.message);
      else setLogs((data || []) as AuditEvent[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Auditoria" description="Eventos administrativos da plataforma" />
      {error && <Card className="p-4 text-sm text-aviso">Falha ao carregar a auditoria: {error}</Card>}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-text-secondary">Carregando eventos…</p>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState title="Sem eventos" description="Ações do admin aparecerão aqui." icon={<Shield className="w-6 h-6" />} />
          </div>
        ) : (
          <ul className="divide-y divide-border-color">
            {logs.map((log) => (
              <li key={log.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Badge variant="info">{log.action}</Badge>
                <div className="text-sm flex-1 min-w-0">
                  <p>{log.email || 'Administrador'}{Object.keys(log.details || {}).length > 0 ? ` · ${JSON.stringify(log.details)}` : ''}</p>
                </div>
                <span className="text-xs text-text-secondary">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
