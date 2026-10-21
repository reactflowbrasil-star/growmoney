import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Briefcase } from 'lucide-react';
import { Button, Input, Card, EmptyState, Badge, PageHeader, Modal } from '@/components/ui';
import {
  listServicosCatalogo,
  saveServico,
  deleteServico,
  formatValorCobranca,
  type ServicoCatalogo,
} from '@/lib/contratos-store';

const emptyForm = {
  nome: '',
  categoria: '',
  descricao: '',
  texto_contrato: '',
  valor: 0,
  tipo_cobranca: 'unico' as 'unico' | 'mensal',
  ordem: 0,
  ativo: true,
  bonus_automatico: false,
  bonus_gatilhos: '',
};

export default function Servicos() {
  const [rows, setRows] = useState<ServicoCatalogo[]>(() => listServicosCatalogo());
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServicoCatalogo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const reload = () => setRows(listServicosCatalogo());

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.nome.toLowerCase().includes(q) ||
        r.categoria.toLowerCase().includes(q) ||
        (r.descricao || '').toLowerCase().includes(q)
    );
  }, [rows, busca]);

  const openNovo = () => {
    setEditing(null);
    setForm({ ...emptyForm, ordem: rows.length + 1 });
    setError('');
    setOpen(true);
  };

  const openEdit = (s: ServicoCatalogo) => {
    setEditing(s);
    setForm({
      nome: s.nome,
      categoria: s.categoria || '',
      descricao: s.descricao || '',
      texto_contrato: s.texto_contrato || '',
      valor: s.valor,
      tipo_cobranca: (s.tipo_cobranca || s.tipo || 'unico') as 'unico' | 'mensal',
      ordem: s.ordem,
      ativo: s.ativo,
      bonus_automatico: !!s.bonus_automatico,
      bonus_gatilhos: (s.bonus_gatilhos || []).join(', '),
    });
    setError('');
    setOpen(true);
  };

  const salvar = () => {
    setError('');
    if (!form.nome.trim()) {
      setError('Informe o nome do serviço.');
      return;
    }
    saveServico({
      id: editing?.id,
      nome: form.nome.trim(),
      categoria: form.categoria.trim(),
      descricao: form.descricao.trim(),
      texto_contrato: form.texto_contrato.trim(),
      valor: Number(form.valor) || 0,
      tipo: form.tipo_cobranca,
      tipo_cobranca: form.tipo_cobranca,
      ordem: Number(form.ordem) || 0,
      ativo: form.ativo,
      bonus_automatico: form.bonus_automatico,
      bonus_gatilhos: form.bonus_gatilhos
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      bonus_permitido: true,
      contratacao_permitida: true,
      exclusaoGrupo: editing?.exclusaoGrupo,
    });
    reload();
    setOpen(false);
  };

  const excluir = (id: string) => {
    if (!confirm('Excluir este serviço? Ele deixará de aparecer na criação de contratos.')) return;
    deleteServico(id);
    reload();
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader
        title="Serviços"
        description="Os serviços ativos aparecem automaticamente na criação de contratos."
        actions={
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openNovo}>
            Novo serviço
          </Button>
        }
      />

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              className="pl-9"
              placeholder="Buscar serviço ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-8 h-8" />}
            title="Nenhum serviço"
            description="Cadastre os serviços que aparecerão no wizard de contratos."
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openNovo}>
                Novo serviço
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-color text-left text-text-secondary">
                  <th className="px-4 py-3 font-medium">Serviço</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border-color/60 hover:bg-bg-tertiary/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{s.nome}</div>
                      <p className="text-xs text-text-secondary line-clamp-1 max-w-md">
                        {s.texto_contrato || s.descricao || '—'}
                      </p>
                      {s.bonus_automatico && (
                        <span className="mt-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">
                          Bônus automático
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {s.categoria ? (
                        <span className="rounded-full bg-bg-tertiary px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
                          {s.categoria}
                        </span>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                      {s.valor > 0 ? formatValorCobranca(s.valor, s.tipo_cobranca || s.tipo) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.ativo ? 'success' : 'neutral'}>{s.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"
                        aria-label="Editar serviço"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-erro/10 inline-flex"
                        aria-label="Excluir serviço"
                        onClick={() => excluir(s.id)}
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar serviço' : 'Novo serviço'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar}>{editing ? 'Salvar alterações' : 'Cadastrar serviço'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome do serviço"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <Input
            label="Categoria"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            placeholder="Ex.: Marketing, Digital"
          />
          <div>
            <label className="text-sm font-medium">Tipo de cobrança</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-border-color bg-bg-primary px-3 text-sm"
              value={form.tipo_cobranca}
              onChange={(e) => setForm({ ...form, tipo_cobranca: e.target.value as 'unico' | 'mensal' })}
            >
              <option value="unico">Pagamento único</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>
          <Input
            label="Valor (R$)"
            type="number"
            min={0}
            step="0.01"
            value={String(form.valor)}
            onChange={(e) => setForm({ ...form, valor: Number(e.target.value) || 0 })}
          />
          <Input
            label="Ordem de exibição"
            type="number"
            min={0}
            value={String(form.ordem)}
            onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) || 0 })}
          />
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Descrição interna</label>
            <textarea
              className="mt-1 w-full min-h-[64px] rounded-xl border border-border-color bg-bg-primary px-3 py-2 text-sm"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Uso interno da equipe"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Texto que aparece no contrato</label>
            <textarea
              className="mt-1 w-full min-h-[64px] rounded-xl border border-border-color bg-bg-primary px-3 py-2 text-sm"
              value={form.texto_contrato}
              onChange={(e) => setForm({ ...form, texto_contrato: e.target.value })}
              placeholder="Cláusula / descrição comercial no PDF"
            />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="accent-brand"
              checked={form.bonus_automatico}
              onChange={(e) => setForm({ ...form, bonus_automatico: e.target.checked })}
            />
            Conceder automaticamente como bônus
          </label>

          {form.bonus_automatico && (
            <div className="sm:col-span-2">
              <Input
                label="Serviços que liberam o bônus"
                value={form.bonus_gatilhos}
                onChange={(e) => setForm({ ...form, bonus_gatilhos: e.target.value })}
                placeholder="Ex.: Site institucional, Landing Page"
              />
              <p className="mt-1 text-xs text-text-secondary">Escreva os nomes exatos, separados por vírgula.</p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="accent-brand"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            Serviço ativo
          </label>

          {error && (
            <p className="sm:col-span-2 text-sm text-erro" role="alert">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
