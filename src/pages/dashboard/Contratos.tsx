import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Download, FileText, Trash2, Send, Eye, Pencil } from 'lucide-react';
import { Button, Input, Card, EmptyState, Badge, PageHeader, Modal } from '@/components/ui';
import { exportCsv, exportPdf } from '@/lib/export';
import {
  listContratosRemotos,
  updateContratoStatus,
  updateContrato,
  deleteContrato,
  formatBRL,
  type ContratoLocal,
} from '@/lib/contratos-store';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useAuth } from '@/contexts/AuthContext';

const statusVariant: Record<ContratoLocal['status'], 'neutral' | 'info' | 'success' | 'danger'> = {
  rascunho: 'neutral',
  enviado: 'info',
  assinado: 'success',
  cancelado: 'danger',
};

export default function Contratos() {
  const { isAdmin: isPlatformAdmin } = useAdminAuth();
  const { empresaAtiva } = useAuth();
  const canManage = isPlatformAdmin || empresaAtiva?.role === 'admin';
  const [rows, setRows] = useState<ContratoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [editing, setEditing] = useState<ContratoLocal | null>(null);
  const [editError, setEditError] = useState('');
  const canEdit = canManage;
  const [params] = useSearchParams();
  const criado = params.get('criado');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listContratosRemotos());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os contratos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload, criado]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
          String(r.numero).includes(busca) ||
          r.status.includes(busca.toLowerCase())
      ),
    [rows, busca]
  );

  const runAction = async (action: () => Promise<unknown>) => {
    setError('');
    try {
      await action();
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a alteração.');
    }
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const total = Math.max(0, Number(String(form.get('valor')).replace(',', '.')) || 0);
    const entrada = Math.max(0, Number(String(form.get('entrada')).replace(',', '.')) || 0);
    const quantidade = Math.max(1, Number(form.get('parcelas')) || 1);
    const centavos = Math.round(Math.max(0, total - entrada) * 100);
    const parcela = Math.floor(centavos / quantidade) / 100;
    const ultima = (centavos - parcela * 100 * (quantidade - 1)) / 100;
    try {
      await updateContrato(editing.id, {
      cliente_nome: String(form.get('cliente_nome') || '').trim(),
      cliente_documento: String(form.get('cliente_documento') || '').trim(),
      valor: total,
      entrada_valor: entrada,
      parcelas: quantidade,
      valor_parcela: parcela,
      valor_ultima_parcela: ultima,
      data_inicio: String(form.get('data_inicio') || ''),
      pagamento_observacao: String(form.get('pagamento_observacao') || '').trim(),
      observacoes: String(form.get('observacoes') || '').trim(),
      });
      setEditing(null);
      setEditError('');
      await reload();
    } catch (cause) {
      setEditError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o contrato.');
    }
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader
        title="Contratos"
        description="Crie, edite, cobre e envie o contrato para assinatura eletrônica."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() =>
          exportCsv(
                  'contratos',
                  filtered.map((r) => ({
                    Número: `CT-${String(r.numero).padStart(4, '0')}`,
                    Cliente: r.cliente_nome,
                    Valor: r.valor,
                    Parcelas: `${r.parcelas}x ${formatBRL(r.valor_parcela)}`,
                    Status: r.status,
                    Início: r.data_inicio,
                  }))
                )
              }
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() =>
                exportPdf(
                  'Contratos',
                  `<table><thead><tr><th>Nº</th><th>Cliente</th><th>Valor</th><th>Parcelas</th><th>Status</th></tr></thead><tbody>${filtered
                    .map(
                      (r) =>
                        `<tr><td>CT-${String(r.numero).padStart(4, '0')}</td><td>${r.cliente_nome}</td><td>${formatBRL(
                          r.valor
                        )}</td><td>${r.parcelas}x ${formatBRL(r.valor_parcela)}${r.valor_ultima_parcela && r.valor_ultima_parcela !== r.valor_parcela ? ` (última ${formatBRL(r.valor_ultima_parcela)})` : ''}</td><td>${r.status}</td></tr>`
                    )
                    .join('')}</tbody></table>`
                )
              }
            >
              PDF
            </Button>
            <Link to="/contratos/novo">
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Novo contrato
              </Button>
            </Link>
          </>
        }
      />

      {criado && (
        <div className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
          Contrato criado com sucesso. Você pode enviá-lo para assinatura quando estiver pronto.
        </div>
      )}

      {error && <p className="rounded-lg border border-erro/30 bg-erro/10 px-4 py-3 text-sm text-erro" role="alert">{error}</p>}

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              className="pl-9"
              placeholder="Buscar por cliente, número ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {loading ? <p className="p-8 text-center text-sm text-text-secondary">Carregando contratos…</p> : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum contrato"
            description="Crie o primeiro contrato em poucos passos: cliente, serviços, condições e revisão."
            action={(
              <Link to="/contratos/novo">
                <Button leftIcon={<Plus className="w-4 h-4" />}>Novo contrato</Button>
              </Link>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-color text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Nº</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Parcelas</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Vigência</th>
                  {canManage && <th className="px-4 py-3 font-medium text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color/60 hover:bg-bg-tertiary/40">
                    <td className="px-4 py-3 font-mono text-xs">CT-{String(r.numero).padStart(4, '0')}</td>
                    <td className="px-4 py-3 font-medium">{r.cliente_nome}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(r.valor)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-text-secondary tabular-nums">
                      {r.parcelas}x {formatBRL(r.valor_parcela)}
                      {r.valor_ultima_parcela && r.valor_ultima_parcela !== r.valor_parcela && <span className="block text-xs">Última: {formatBRL(r.valor_ultima_parcela)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-text-secondary text-xs">
                      {r.data_inicio}
                      {r.data_termino ? ` → ${r.data_termino}` : ''}
                    </td>
                    {canManage && <td className="px-4 py-3 text-right whitespace-nowrap">
                      {canEdit && <button
                        className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"
                        title="Editar contrato"
                        aria-label={`Editar contrato ${r.numero}`}
                        onClick={() => { setEditing(r); setEditError(''); }}
                      ><Pencil className="w-4 h-4 text-text-secondary" /></button>}
                      <button
                        className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"
                        title="Enviar"
                        onClick={() => void runAction(() => updateContratoStatus(r.id, 'enviado'))}
                      >
                        <Send className="w-4 h-4 text-brand" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"
                        title="Marcar assinado"
                        onClick={() => void runAction(() => updateContratoStatus(r.id, 'assinado'))}
                      >
                        <Eye className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-erro/10 inline-flex"
                        title="Excluir"
                        onClick={() => void runAction(() => deleteContrato(r.id))}
                      >
                        <Trash2 className="w-4 h-4 text-erro" />
                      </button>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {canManage && <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar contrato" size="lg">
        {editing && <form onSubmit={saveEdit} className="space-y-4">
          {editError && <p className="text-sm text-erro" role="alert">{editError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="cliente_nome" label="Cliente" defaultValue={editing.cliente_nome} required />
            <Input name="cliente_documento" label="CPF/CNPJ" defaultValue={editing.cliente_documento || ''} />
            <Input name="valor" label="Valor total (R$)" type="number" min="0" step="0.01" defaultValue={editing.valor} required />
            <Input name="entrada" label="Entrada (R$)" type="number" min="0" step="0.01" defaultValue={editing.entrada_valor} />
            <Input name="parcelas" label="Quantidade de parcelas" type="number" min="1" max="99" defaultValue={editing.parcelas} required />
            <Input name="data_inicio" label="Data de início" type="date" defaultValue={editing.data_inicio} />
            <Input name="pagamento_observacao" label="Condições de pagamento" defaultValue={editing.pagamento_observacao || ''} />
            <label className="text-sm font-medium sm:col-span-2">Observações internas<textarea name="observacoes" rows={3} defaultValue={editing.observacoes || ''} className="mt-1 w-full rounded-lg border border-border-color bg-bg-secondary px-3 py-2 text-sm" /></label>
          </div>
          <p className="text-xs text-text-secondary">O valor unitário será recalculado e exibido na lista e na exportação do contrato.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>}
      </Modal>}
    </div>
  );
}
