import { Shield } from 'lucide-react';
import { Card, PageHeader, Badge, EmptyState } from '@/components/ui';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminAuditoria() {
  const { session } = useAdminAuth();
  const logs = session
    ? [
        {
          id: '1',
          acao: 'Login admin',
          detalhe: `Sessão iniciada por ${session.username}`,
          quando: session.loggedAt,
        },
      ]
    : [];

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Auditoria" description="Eventos administrativos da plataforma" />
      <Card padding="none" className="overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Sem eventos"
              description="Ações do admin aparecerão aqui."
              icon={<Shield className="w-6 h-6" />}
            />
          </div>
        ) : (
          <ul className="divide-y divide-border-color">
            {logs.map((l) => (
              <li
                key={l.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <Badge variant="info">{l.acao}</Badge>
                <p className="text-sm flex-1">{l.detalhe}</p>
                <span className="text-xs text-text-secondary">
                  {new Date(l.quando).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
