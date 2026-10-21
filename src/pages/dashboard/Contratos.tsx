import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Download, FileText, Trash2, Send, Eye } from 'lucide-react';
import { Button, Input, Card, EmptyState, Badge, PageHeader } from '@/components/ui';
import { exportCsv, exportPdf } from '@/lib/export';
import { gerarContratoHtml } from '@/lib/contrato-template';
import {
  listContratosRemotos,
  updateContratoStatus,
  deleteContrato,
  formatBRL,
  type ContratoLocal,
} from '@/lib/contratos-store';

const statusVariant: Record<ContratoLocal['status'], 'neutral' | 'info' | 'success' | 'danger'> = {
  rascunho: 'neutral',
  enviado: 'info',
  assinado: 'success',
  cancelado: 'danger',
};

export default function Contratos() {
  const [rows, setRows] = useState<ContratoLocal[]>([]);
  const [loadError, setLoadError] = useState('');
  const [busca, setBusca] = useState('');
  const [params] = useSearchParams();
  const criado = params.get('criado');

  const reload = useCallback(async () => {
    try {
      setRows(await listContratosRemotos());
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar os contratos.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, criado]);

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

  const executarAcao = async (acao: () => Promise<void>) => {
    try {
      await acao();
      await reload();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível salvar as alterações do contrato.');
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
                  `<table><thead><tr><th>Nº</th><th>Cliente</th><th>Valor</th><th>Status</th></tr></thead><tbody>${filtered
                    .map(
                      (r) =>
                        `<tr><td>CT-${String(r.numero).padStart(4, '0')}</td><td>${r.cliente_nome}</td><td>${formatBRL(
                          r.valor
                        )}</td><td>${r.status}</td></tr>`
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
      {loadError && <div className="rounded-xl border border-erro/40 bg-erro/10 px-4 py-3 text-sm text-erro">{loadError}</div>}

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

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum contrato"
            description="Crie o primeiro contrato em poucos passos: cliente, serviços, condições e revisão."
            action={
              <Link to="/contratos/novo">
                <Button leftIcon={<Plus className="w-4 h-4" />}>Novo contrato</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-color text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Nº</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Vigência</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color/60 hover:bg-bg-tertiary/40">
                    <td className="px-4 py-3 font-mono text-xs">CT-{String(r.numero).padStart(4, '0')}</td>
                    <td className="px-4 py-3 font-medium">{r.cliente_nome}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(r.valor)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-text-secondary text-xs">
                      {r.data_inicio}
                      {r.data_termino ? ` → ${r.data_termino}` : ''}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"
                        title="Imprimir contrato completo"
                        aria-label={`Imprimir contrato CT-${String(r.numero).padStart(4, '0')}`}
                        onClick={() => exportPdf(`Contrato CT-${String(r.numero).padStart(4, '0')}`, gerarContratoHtml(r))}
                      >
                        <FileText className="w-4 h-4 text-brand" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"
                        title="Enviar"
                        onClick={() => executarAcao(() => updateContratoStatus(r.id, 'enviado'))}
                      >
                        <Send className="w-4 h-4 text-brand" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"
                        title="Marcar assinado"
                        onClick={() => executarAcao(() => updateContratoStatus(r.id, 'assinado'))}
                      >
                        <Eye className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-erro/10 inline-flex"
                        title="Excluir"
                        onClick={() => executarAcao(() => deleteContrato(r.id))}
                      >
                        <Trash2 className="w-4 h-4 text-erro" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

