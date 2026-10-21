import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { formatValorCobranca, type ServicoCatalogo } from '@/lib/contratos-store';
import { deleteServicoEmpresa, loadServicosEmpresa, saveServicoEmpresa } from '@/services/servico-catalogo-persistente';
import { useAuth } from '@/contexts/AuthContext';

const blank = { nome: '', categoria: '', descricao: '', texto_contrato: '', valor: 0, tipo_cobranca: 'unico' as 'unico' | 'mensal', ordem: 0, ativo: true, bonus_automatico: false, bonus_gatilhos: '' };

export default function Servicos() {
  const { empresaAtiva, hasPermission } = useAuth();
  const [rows, setRows] = useState<ServicoCatalogo[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServicoCatalogo | null>(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!empresaAtiva?.id) { setRows([]); setLoading(false); return; }
    setLoading(true);
    try { setRows(await loadServicosEmpresa(empresaAtiva.id)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Falha ao carregar serviços.'); }
    finally { setLoading(false); }
  }, [empresaAtiva?.id]);
  useEffect(() => { void reload(); }, [reload]);

  const filtered = useMemo(() => {
    const query = busca.trim().toLocaleLowerCase('pt-BR');
    return rows.filter((row) => !query || `${row.nome} ${row.categoria} ${row.descricao || ''}`.toLocaleLowerCase('pt-BR').includes(query));
  }, [rows, busca]);

  const openNew = () => { setEditing(null); setForm({ ...blank, ordem: rows.length + 1 }); setError(''); setOpen(true); };
  const openEdit = (service: ServicoCatalogo) => {
    setEditing(service);
    setForm({ nome: service.nome, categoria: service.categoria || '', descricao: service.descricao || '', texto_contrato: service.texto_contrato || '', valor: service.valor, tipo_cobranca: service.tipo_cobranca || service.tipo || 'unico', ordem: service.ordem, ativo: service.ativo, bonus_automatico: !!service.bonus_automatico, bonus_gatilhos: (service.bonus_gatilhos || []).join(', ') });
    setError(''); setOpen(true);
  };
  const salvar = async () => {
    if (!empresaAtiva?.id) { setError('Selecione uma empresa antes de salvar serviços.'); return; }
    if (!form.nome.trim()) { setError('Informe o nome do serviço.'); return; }
    setSaving(true); setError('');
    try {
      await saveServicoEmpresa(empresaAtiva.id, {
        id: editing?.id, codigo: editing?.codigo,
        nome: form.nome.trim(), categoria: form.categoria.trim() || 'geral', descricao: form.descricao.trim(),
        texto_contrato: form.texto_contrato.trim(), valor: Number(form.valor) || 0,
        tipo: form.tipo_cobranca, tipo_cobranca: form.tipo_cobranca,
        ordem: Number(form.ordem) || 0, ativo: form.ativo,
        bonus_automatico: form.bonus_automatico,
        bonus_gatilhos: form.bonus_gatilhos.split(',').map((value) => value.trim()).filter(Boolean),
        bonus_permitido: true, contratacao_permitida: true, exclusaoGrupo: editing?.exclusaoGrupo,
      });
      await reload(); setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao salvar o serviço.'); }
    finally { setSaving(false); }
  };
  const excluir = async (id: string) => {
    if (!empresaAtiva?.id || !confirm('Excluir este serviço do catálogo?')) return;
    try { await deleteServicoEmpresa(empresaAtiva.id, id); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Falha ao excluir o serviço.'); }
  };
  const canWrite = hasPermission('servicos:write');

  return <div className="max-w-7xl space-y-4">
    <PageHeader title="Serviços" description="O catálogo fica salvo na empresa e é usado na criação de contratos." actions={canWrite && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>Novo serviço</Button>} />
    {error && !open && <p className="rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</p>}
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border-color p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" /><Input className="pl-9" placeholder="Buscar serviço ou categoria..." value={busca} onChange={(e) => setBusca(e.target.value)} /></div></div>
      {loading ? <p className="p-8 text-center text-sm text-text-secondary">Carregando catálogo…</p> : filtered.length === 0 ? <div className="p-8"><EmptyState icon={<Briefcase className="h-8 w-8" />} title="Nenhum serviço" description="Cadastre os serviços que serão oferecidos nos contratos." action={canWrite && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>Novo serviço</Button>} /></div> :
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border-color text-left text-text-secondary"><th className="px-4 py-3 font-medium">Serviço</th><th className="hidden px-4 py-3 font-medium sm:table-cell">Categoria</th><th className="px-4 py-3 font-medium">Valor</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Ações</th></tr></thead><tbody>{filtered.map((service) => <tr key={service.id} className="border-b border-border-color/60 hover:bg-bg-tertiary/40"><td className="px-4 py-3"><div className="font-medium">{service.nome}</div><p className="line-clamp-1 max-w-md text-xs text-text-secondary">{service.texto_contrato || service.descricao || '—'}</p>{service.bonus_automatico && <span className="mt-1 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-brand">Bônus automático</span>}</td><td className="hidden px-4 py-3 sm:table-cell">{service.categoria || '—'}</td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{service.valor > 0 ? formatValorCobranca(service.valor, service.tipo_cobranca || service.tipo) : '—'}</td><td className="px-4 py-3"><Badge variant={service.ativo ? 'success' : 'neutral'}>{service.ativo ? 'Ativo' : 'Inativo'}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-right">{canWrite && <button type="button" aria-label={`Editar ${service.nome}`} className="rounded-lg p-2 hover:bg-bg-tertiary" onClick={() => openEdit(service)}><Pencil className="h-4 w-4 text-text-secondary" /></button>}{hasPermission('servicos:delete') && <button type="button" aria-label={`Excluir ${service.nome}`} className="rounded-lg p-2 hover:bg-erro/10" onClick={() => void excluir(service.id)}><Trash2 className="h-4 w-4 text-erro" /></button>}</td></tr>)}</tbody></table></div>}
    </Card>
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar serviço' : 'Novo serviço'} size="lg" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={saving} onClick={() => void salvar()}>{editing ? 'Salvar alterações' : 'Cadastrar serviço'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Nome do serviço" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
        <Input label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
        <div><label className="text-sm font-medium">Tipo de cobrança</label><select className="mt-1 h-10 w-full rounded-xl border border-border-color bg-bg-primary px-3 text-sm" value={form.tipo_cobranca} onChange={(e) => setForm({ ...form, tipo_cobranca: e.target.value as 'unico' | 'mensal' })}><option value="unico">Pagamento único</option><option value="mensal">Mensal</option></select></div>
        <Input label="Valor (R$)" type="number" min={0} step="0.01" value={String(form.valor)} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) || 0 })} />
        <Input label="Ordem de exibição" type="number" min={0} value={String(form.ordem)} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) || 0 })} />
        <div className="sm:col-span-2"><label className="text-sm font-medium">Descrição interna</label><textarea className="mt-1 min-h-16 w-full rounded-xl border border-border-color bg-bg-primary px-3 py-2 text-sm" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="text-sm font-medium">Texto no contrato</label><textarea className="mt-1 min-h-16 w-full rounded-xl border border-border-color bg-bg-primary px-3 py-2 text-sm" value={form.texto_contrato} onChange={(e) => setForm({ ...form, texto_contrato: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="accent-brand" checked={form.bonus_automatico} onChange={(e) => setForm({ ...form, bonus_automatico: e.target.checked })} />Conceder automaticamente como bônus</label>
        {form.bonus_automatico && <div className="sm:col-span-2"><Input label="Serviços que liberam o bônus (IDs separados por vírgula)" value={form.bonus_gatilhos} onChange={(e) => setForm({ ...form, bonus_gatilhos: e.target.value })} /></div>}
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="accent-brand" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />Serviço ativo</label>
        {error && <p className="text-sm text-erro sm:col-span-2" role="alert">{error}</p>}
      </div>
    </Modal>
  </div>;
}
