import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { Button, Card, PageHeader } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getRecentDashboardActivity, type DashboardActivity } from '@/services/dashboard-activity-service';

const entityLabels: Record<string, string> = {
  clients: 'cliente', client_historico: 'histórico de cliente',
  contratos: 'contrato', gm_contracts: 'contrato', contrato_historico: 'histórico de contrato',
  signature_envelopes: 'envelope de assinatura', signature_signers: 'signatário',
  gm_financial_entries: 'lançamento financeiro', parcelas: 'parcela', lancamentos: 'lançamento',
  empresas: 'empresa', services: 'serviço', vendedores: 'vendedor', agenda: 'compromisso',
};

const actionLabels: Record<DashboardActivity['action'], string> = {
  created: 'criou', updated: 'alterou', deleted: 'excluiu',
};

const formatExactTime = (value: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full', timeStyle: 'medium', timeZone: 'America/Sao_Paulo',
}).format(new Date(value));

export default function Dashboard() {
  const { empresaAtiva } = useAuth();
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setActivity(await getRecentDashboardActivity(empresaAtiva?.id || null, 20));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as alterações recentes.');
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva?.id]);

  useEffect(() => { void loadActivity(); }, [loadActivity]);

  return (
    <div className="max-w-7xl space-y-5">
      <PageHeader
        title="Dashboard"
        description={empresaAtiva ? `Alterações recentes em ${empresaAtiva.nome} e registros pessoais disponíveis para sua conta.` : 'Alterações pessoais disponíveis para sua conta.'}
        actions={<Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} disabled={loading} onClick={() => void loadActivity()}>Atualizar</Button>}
      />

      <Card className="overflow-hidden" padding="none">
        <div className="border-b border-border-color px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Últimas alterações</h2>
          <p className="mt-1 text-xs text-text-secondary">Eventos registrados para clientes, contratos, assinaturas, financeiro e outros dados disponíveis.</p>
        </div>
        {error ? (
          <p className="m-4 rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</p>
        ) : loading ? (
          <p className="p-8 text-center text-sm text-text-secondary" role="status">Carregando atividade…</p>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <Activity className="h-6 w-6 text-text-secondary" aria-hidden="true" />
            <p className="text-sm font-medium">Nenhuma alteração registrada</p>
            <p className="text-xs text-text-secondary">Quando houver alterações registradas, elas aparecerão aqui.</p>
          </div>
        ) : (
          <ol className="divide-y divide-border-color">
            {activity.map((item) => {
              const entity = entityLabels[item.entity] || item.entity.replace(/[_-]+/g, ' ');
              return (
                <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm"><span className="font-semibold">{item.actorName || 'Usuário'}</span> {actionLabels[item.action]} <span className="font-medium">{entity}</span></p>
                    {item.entityId && <p className="mt-1 text-xs text-text-secondary">ID: <span className="break-all font-mono">{item.entityId}</span></p>}
                    {item.changedFields.length > 0 && <p className="mt-1 text-xs text-text-secondary">Campos alterados: {item.changedFields.map((field) => field.replace(/[_-]+/g, ' ')).join(', ')}</p>}
                    <p className="mt-1 text-xs text-text-secondary">Escopo: {item.scope === 'company' ? 'empresa ativa' : 'pessoal'}</p>
                  </div>
                  <time className="shrink-0 text-xs text-text-secondary sm:text-right" dateTime={item.occurredAt} title={item.occurredAt}>
                    {formatExactTime(item.occurredAt)} (horário de Brasília)
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
