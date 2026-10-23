import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Search, ShieldAlert } from 'lucide-react';
import { Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { AdminResourceService, type AdminResourceRecord, type AdminResourceTable } from '@/services/admin-resource-service';

type Field = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'select' | 'textarea' | 'json';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  hint?: string;
};

type ResourceDefinition = {
  table: AdminResourceTable;
  title: string;
  description: string;
  columns: string;
  orderBy: string;
  visible: string[];
  fields: Field[];
  deleteWarning?: string;
  readOnly?: boolean;
};

const definitions: Record<string, ResourceDefinition> = {
  empresas: {
    table: 'empresas', title: 'Empresas', description: 'Gestão global das empresas cadastradas',
    columns: 'id,nome,cnpj,responsavel_id,criado_em', orderBy: 'criado_em', visible: ['nome', 'cnpj', 'responsavel_id', 'criado_em'],
    fields: [
      { name: 'nome', label: 'Nome', required: true },
      { name: 'cnpj', label: 'CNPJ' },
      { name: 'responsavel_id', label: 'ID do responsável', hint: 'UUID de uma conta existente; pode ficar em branco.' },
    ],
    deleteWarning: 'Excluir uma empresa remove em cascata os dados vinculados a ela. Esta ação não pode ser desfeita.',
  },
  clientes: {
    table: 'clients', title: 'Clientes', description: 'Clientes de todas as empresas',
    columns: 'id,empresa_id,nome,razao_social,tipo,documento,email,telefone,whatsapp,cep,responsavel,status,observacoes,endereco,criado_em,atualizado_em', orderBy: 'criado_em',
    visible: ['nome', 'documento', 'email', 'empresa_id', 'status', 'criado_em'],
    fields: [
      { name: 'empresa_id', label: 'ID da empresa', required: true },
      { name: 'nome', label: 'Nome', required: true }, { name: 'razao_social', label: 'Razão social' },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'pessoa_fisica', label: 'Pessoa física' }, { value: 'pessoa_juridica', label: 'Pessoa jurídica' }] },
      { name: 'documento', label: 'CPF/CNPJ', required: true }, { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'telefone', label: 'Telefone' }, { name: 'whatsapp', label: 'WhatsApp' }, { name: 'cep', label: 'CEP' },
      { name: 'responsavel', label: 'Responsável' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ['ativo', 'inativo', 'arquivado', 'suspenso', 'prospecto'].map((value) => ({ value, label: value })) },
      { name: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
  },
  contratos: {
    table: 'gm_contracts', title: 'Contratos', description: 'Contratos persistidos na plataforma',
    columns: 'id,user_id,numero,status,payload,created_at,updated_at', orderBy: 'created_at',
    visible: ['numero', 'user_id', 'status', 'created_at'],
    fields: [
      { name: 'user_id', label: 'ID do usuário proprietário', required: true }, { name: 'numero', label: 'Número', required: true },
      { name: 'status', label: 'Status', type: 'text', required: true },
      { name: 'payload', label: 'Dados do contrato (JSON)', type: 'json', required: true },
    ],
  },
  assinaturas: {
    table: 'signature_envelopes', title: 'Assinaturas', description: 'Envelopes de assinatura digital',
    columns: 'id,owner_id,payload,created_at,updated_at', orderBy: 'created_at',
    visible: ['owner_id', 'payload', 'created_at'],
    fields: [
      { name: 'owner_id', label: 'ID do usuário proprietário', required: true },
      { name: 'payload', label: 'Dados da assinatura (JSON)', type: 'json', required: true },
    ],
  },
  financeiro: {
    table: 'gm_financial_entries', title: 'Financeiro', description: 'Lançamentos financeiros persistidos',
    columns: 'id,empresa_id,cliente,valor,vencimento,status,comprovante_path,criado_por', orderBy: 'vencimento',
    visible: ['cliente', 'empresa_id', 'valor', 'vencimento', 'status'],
    fields: [
      { name: 'empresa_id', label: 'ID da empresa', required: true }, { name: 'cliente', label: 'Cliente', required: true },
      { name: 'valor', label: 'Valor', type: 'number', required: true }, { name: 'vencimento', label: 'Vencimento', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'text', required: true },
    ],
  },
};

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default function AdminRecursos({ resource }: { resource: keyof typeof definitions }) {
  const definition = definitions[resource];
  const [rows, setRows] = useState<AdminResourceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminResourceRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await AdminResourceService.list(definition.table, definition.columns, definition.orderBy));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar os registros.');
    } finally {
      setLoading(false);
    }
  }, [definition]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => definition.visible.some((key) => displayValue(row[key]).toLowerCase().includes(term)));
  }, [definition, rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(Object.fromEntries(definition.fields.map((field) => [field.name, ''])));
    setError(''); setOpen(true);
  };

  const openEdit = (row: AdminResourceRecord) => {
    setEditing(row);
    setForm(Object.fromEntries(definition.fields.map((field) => [field.name, displayValue(row[field.name]) === '—' ? '' : displayValue(row[field.name])])));
    setError(''); setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    const payload: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const value = form[field.name]?.trim() || '';
      if (!value) {
        if (editing && !field.required) payload[field.name] = null;
        continue;
      }
      try {
        payload[field.name] = field.type === 'number' ? Number(value) : field.type === 'json' ? JSON.parse(value) : value;
      } catch {
        setError(`${field.label} precisa conter um JSON válido.`);
        setSaving(false);
        return;
      }
    }
    try {
      if (editing) await AdminResourceService.update(definition.table, editing.id, payload);
      else await AdminResourceService.create(definition.table, payload);
      setOpen(false); await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar o registro.');
    } finally { setSaving(false); }
  };

  const remove = async (row: AdminResourceRecord) => {
    const name = displayValue(row[definition.visible[0]]);
    const prompt = definition.deleteWarning ? `${definition.deleteWarning}\n\n${name}` : `Excluir o registro “${name}”? Esta ação não pode ser desfeita.`;
    if (!window.confirm(prompt)) return;
    setError('');
    try { await AdminResourceService.delete(definition.table, row.id); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao excluir o registro.'); }
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title={definition.title} description={definition.description} actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Atualizar</Button>
          {!definition.readOnly && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Novo</Button>}
        </div>
      } />
      {error && !open && <div className="rounded-xl border border-erro/30 bg-erro/10 p-4 text-sm text-erro" role="alert"><div className="flex items-start gap-2"><ShieldAlert className="h-4 w-4 mt-0.5" />{error}</div></div>}
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-border-color p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" /><Input aria-label={`Buscar ${definition.title.toLowerCase()}`} placeholder="Buscar..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" /></div></div>
        {loading ? <p className="p-8 text-center text-sm text-text-secondary">Carregando…</p> : filtered.length === 0 ? <div className="p-8"><EmptyState title="Nenhum registro" description="Os registros disponíveis aparecerão aqui." /></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-border-color bg-bg-secondary/50 text-text-secondary">{definition.visible.map((key) => <th key={key} className="px-4 py-3 font-medium">{definition.fields.find((field) => field.name === key)?.label || key.replace(/_/g, ' ')}</th>)}<th className="px-4 py-3 text-right font-medium">Ações</th></tr></thead>
            <tbody>{filtered.map((row) => <tr key={row.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">{definition.visible.map((key) => <td key={key} className="max-w-64 truncate px-4 py-3" title={displayValue(row[key])}>{displayValue(row[key])}</td>)}<td className="whitespace-nowrap px-4 py-3 text-right">{!definition.readOnly && <><Button variant="ghost" size="sm" aria-label="Editar registro" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" aria-label="Excluir registro" onClick={() => void remove(row)}><Trash2 className="h-4 w-4 text-erro" /></Button></>}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? `Editar ${definition.title.toLowerCase()}` : `Novo registro · ${definition.title.toLowerCase()}`} size="xl" footer={<><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button form="admin-resource-form" type="submit" loading={saving}>{editing ? 'Salvar alterações' : 'Criar registro'}</Button></>}>
        <form id="admin-resource-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">{error && <div className="sm:col-span-2 rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</div>}
          {definition.fields.map((field) => <div key={field.name} className={field.type === 'textarea' || field.type === 'json' ? 'sm:col-span-2' : ''}>{field.type === 'select' ? <div><label htmlFor={`admin-${field.name}`} className="mb-1.5 block text-sm font-medium">{field.label}</label><select id={`admin-${field.name}`} required={field.required} className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form[field.name] || ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}><option value="">Selecione…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div> : field.type === 'textarea' || field.type === 'json' ? <div><label htmlFor={`admin-${field.name}`} className="mb-1.5 block text-sm font-medium">{field.label}</label><textarea id={`admin-${field.name}`} rows={field.type === 'json' ? 10 : 3} required={field.required} spellCheck={field.type !== 'json'} className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 font-mono text-sm" value={form[field.name] || ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} /></div> : <Input id={`admin-${field.name}`} label={field.label} type={field.type || 'text'} required={field.required} hint={field.hint} value={form[field.name] || ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />}</div>)}
        </form>
      </Modal>
    </div>
  );
}
