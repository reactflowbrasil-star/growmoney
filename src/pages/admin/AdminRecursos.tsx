import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, Search, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { AdminResourceService, type AdminResourceRecord, type AdminResourceTable } from '@/services/admin-resource-service';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { criarLinkArquivo, uploadArquivo } from '@/services/file-storage';
import { AdminAccordionList } from '@/components/admin/AdminAccordionList';
import { useAdminHiddenRecords } from '@/hooks/useAdminHiddenRecords';

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
      { name: 'user_id', label: 'ID do usuário proprietário', required: true }, { name: 'numero', label: 'Número', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ['rascunho', 'enviado', 'assinado', 'cancelado'].map((value) => ({ value, label: value })) },
      { name: 'cliente_nome', label: 'Nome do cliente', required: true }, { name: 'cliente_documento', label: 'CPF/CNPJ do cliente' },
      { name: 'cliente_email', label: 'E-mail do cliente', type: 'email' }, { name: 'cliente_telefone', label: 'Telefone do cliente' },
      { name: 'valor', label: 'Valor total (R$)', type: 'number', required: true }, { name: 'entrada_valor', label: 'Entrada (R$)', type: 'number' },
      { name: 'parcelas', label: 'Quantidade de parcelas', type: 'number' }, { name: 'valor_parcela', label: 'Valor da parcela (R$)', type: 'number' },
      { name: 'forma_pagamento', label: 'Forma de pagamento', required: true }, { name: 'data_inicio', label: 'Início da vigência', type: 'date', required: true },
      { name: 'data_termino', label: 'Término da vigência', type: 'date' }, { name: 'pdf_path', label: 'Caminho PDF' },
      { name: 'observacoes', label: 'Observações do contrato', type: 'textarea' },
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
  const { isAdmin } = useAdminAuth();
  const definition = definitions[resource];
  const [rows, setRows] = useState<AdminResourceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminResourceRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [contractPdfUrl, setContractPdfUrl] = useState('');
  const [viewing, setViewing] = useState<AdminResourceRecord | null>(null);
  const { hiddenIds, hiddenCount, showHidden, setShowHidden, toggleHidden } = useAdminHiddenRecords(resource);

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
    return rows.filter((row) => (showHidden ? hiddenIds.has(row.id) : !hiddenIds.has(row.id))
      && definition.visible.some((key) => displayValue(row[key]).toLowerCase().includes(term)));
  }, [definition, rows, search, showHidden, hiddenIds]);

  const openCreate = () => {
    setEditing(null);
    const initial = Object.fromEntries(definition.fields.map((field) => [field.name, '']));
    if (resource === 'contratos') {
      initial.status = 'rascunho';
      initial.parcelas = '1';
      initial.entrada_valor = '0';
      initial.data_inicio = new Date().toISOString().slice(0, 10);
    }
    setForm(initial);
    setError(''); setOpen(true);
    setContractPdfUrl('');
  };

  const openEdit = (row: AdminResourceRecord) => {
    setEditing(row);
    const valueFor = (field: Field) => {
      const value = resource === 'contratos' && ['cliente_nome', 'cliente_documento', 'cliente_email', 'cliente_telefone', 'valor', 'entrada_valor', 'parcelas', 'valor_parcela', 'forma_pagamento', 'data_inicio', 'data_termino', 'pdf_path', 'observacoes'].includes(field.name)
        ? (row.payload as Record<string, unknown> | null)?.[field.name]
        : row[field.name];
      return displayValue(value) === '—' ? '' : displayValue(value);
    };
    setForm(Object.fromEntries(definition.fields.map((field) => [field.name, valueFor(field)])));
    setContractPdfUrl('');
    setError(''); setOpen(true);
    if (resource === 'contratos' && typeof (row.payload as Record<string, unknown> | null)?.pdf_path === 'string') {
      void criarLinkArquivo(String((row.payload as Record<string, unknown>).pdf_path), 60 * 60)
        .then(setContractPdfUrl)
        .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o PDF vinculado.'));
    }
  };

  const uploadContractPdf = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF.');
      return;
    }
    const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
    if (header !== '%PDF-') {
      setError('O arquivo não contém um cabeçalho PDF válido.');
      return;
    }
    setPdfBusy(true); setError('');
    try {
      const uploaded = await uploadArquivo(file, 'contratos');
      setForm((current) => ({ ...current, pdf_path: uploaded.caminho }));
      setContractPdfUrl(uploaded.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o PDF.');
    } finally { setPdfBusy(false); }
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
    if (resource === 'contratos') {
      const previousPayload = (editing?.payload as Record<string, unknown> | undefined) || {};
      const contractFields = ['cliente_nome', 'cliente_documento', 'cliente_email', 'cliente_telefone', 'valor', 'entrada_valor', 'parcelas', 'valor_parcela', 'forma_pagamento', 'data_inicio', 'data_termino', 'pdf_path', 'observacoes'];
      const contractPayload: Record<string, unknown> = editing ? { ...previousPayload } : {
        client_id: '', itens: [], unidades: 1, desconto_valor: 0, desconto_percentual: 0,
        bonus_total: 0, economia_total: 0, prazo_meses: 12, periodicidade: null,
        plano_recorrente: false, created_at: new Date().toISOString(),
      };
      contractFields.forEach((field) => {
        const value = form[field]?.trim() || '';
        if (['valor', 'entrada_valor', 'parcelas', 'valor_parcela'].includes(field)) contractPayload[field] = value ? Number(value) : 0;
        else if (value) contractPayload[field] = value;
        else if (editing && Object.prototype.hasOwnProperty.call(contractPayload, field)) delete contractPayload[field];
      });
      if (!editing) {
        const total = Number(form.valor || 0);
        const entrada = Number(form.entrada_valor || 0);
        const parcelas = Math.max(1, Number(form.parcelas || 1));
        contractPayload.valor_bruto = total;
        contractPayload.valor = total;
        contractPayload.valor_parcela = form.valor_parcela ? Number(form.valor_parcela) : Math.round(((total - entrada) / parcelas) * 100) / 100;
        contractPayload.entrada_valor = entrada;
        contractPayload.parcelas = parcelas;
        contractPayload.status = form.status;
        contractPayload.numero = form.numero ? Number(form.numero) : 0;
      }
      payload.payload = contractPayload;
      delete payload.cliente_nome; delete payload.cliente_documento; delete payload.cliente_email;
      delete payload.cliente_telefone; delete payload.valor; delete payload.entrada_valor;
      delete payload.parcelas; delete payload.valor_parcela; delete payload.forma_pagamento;
      delete payload.data_inicio; delete payload.data_termino; delete payload.pdf_path; delete payload.observacoes;
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
          {isAdmin && !definition.readOnly && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Novo</Button>}
        </div>
      } />
      {error && !open && <div className="rounded-xl border border-erro/30 bg-erro/10 p-4 text-sm text-erro" role="alert"><div className="flex items-start gap-2"><ShieldAlert className="h-4 w-4 mt-0.5" />{error}</div></div>}
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-color p-4"><div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" /><Input aria-label={`Buscar ${definition.title.toLowerCase()}`} placeholder="Buscar..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" /></div><Button type="button" variant="outline" size="sm" onClick={() => setShowHidden((value) => !value)}>{showHidden ? 'Exibir itens ativos' : `Exibir ocultos (${hiddenCount})`}</Button><p className="w-full text-xs text-text-secondary">Ocultar afeta somente esta lista neste navegador; o registro continua salvo.</p></div>
        {loading ? <p className="p-8 text-center text-sm text-text-secondary">Carregando…</p> : filtered.length === 0 ? <div className="p-8"><EmptyState title="Nenhum registro" description="Os registros disponíveis aparecerão aqui." /></div> : (
          <>
            <AdminAccordionList items={filtered.map((row) => ({
              id: row.id,
              title: displayValue(row[definition.visible[0]]),
              subtitle: definition.visible[1] ? displayValue(row[definition.visible[1]]) : undefined,
              details: definition.visible.slice(2).map((key) => ({
                label: definition.fields.find((field) => field.name === key)?.label || key.replace(/_/g, ' '),
                value: displayValue(row[key]),
              })),
              actions: <>
                {(resource !== 'empresas' || isAdmin) && <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />} aria-label={resource === 'empresas' ? 'Visualizar cadastro da empresa' : 'Visualizar registro'} onClick={() => setViewing(row)}>{resource === 'empresas' ? 'Visualizar cadastro' : 'Visualizar'}</Button>}
                <Button variant="ghost" size="sm" leftIcon={<EyeOff className="h-4 w-4" />} aria-label={showHidden ? 'Reexibir registro' : 'Ocultar registro'} onClick={() => toggleHidden(row.id)}>{showHidden ? 'Reexibir' : 'Ocultar'}</Button>
                {isAdmin && !definition.readOnly && <><Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} aria-label={resource === 'empresas' ? 'Editar cadastro da empresa' : 'Editar registro'} onClick={() => openEdit(row)}>{resource === 'empresas' ? 'Editar cadastro' : 'Editar'}</Button><Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4 text-erro" />} aria-label="Excluir registro" onClick={() => void remove(row)}>Excluir</Button></>}
              </>,
            }))} />
          </>
        )}
      </Card>
      {isAdmin && <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? `Editar ${definition.title.toLowerCase()}` : `Novo registro · ${definition.title.toLowerCase()}`} size="xl" footer={<><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button form="admin-resource-form" type="submit" loading={saving}>{editing ? 'Salvar alterações' : 'Criar registro'}</Button></>}>
        <form id="admin-resource-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">{error && <div className="sm:col-span-2 rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</div>}
          {definition.fields.filter((field) => !(resource === 'contratos' && field.name === 'pdf_path')).map((field) => <div key={field.name} className={field.type === 'textarea' || field.type === 'json' ? 'sm:col-span-2' : ''}>{field.type === 'select' ? <div><label htmlFor={`admin-${field.name}`} className="mb-1.5 block text-sm font-medium">{field.label}</label><select id={`admin-${field.name}`} required={field.required} className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form[field.name] || ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}><option value="">Selecione…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div> : field.type === 'textarea' || field.type === 'json' ? <div><label htmlFor={`admin-${field.name}`} className="mb-1.5 block text-sm font-medium">{field.label}</label><textarea id={`admin-${field.name}`} rows={field.type === 'json' ? 10 : 3} required={field.required} spellCheck={field.type !== 'json'} className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 font-mono text-sm" value={form[field.name] || ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} /></div> : <Input id={`admin-${field.name}`} label={field.label} type={field.type || 'text'} required={field.required} hint={field.hint} value={form[field.name] || ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />}</div>)}
          {resource === 'contratos' && <div className="space-y-2 sm:col-span-2"><label htmlFor="contract-pdf-upload" className="block text-sm font-medium">PDF do contrato</label><input id="contract-pdf-upload" type="file" accept="application/pdf,.pdf" disabled={pdfBusy} onChange={(event) => { void uploadContractPdf(event.target.files?.[0]); event.target.value = ''; }} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:font-medium file:text-brand" />{pdfBusy && <p className="text-xs text-text-secondary">Enviando PDF ao armazenamento privado…</p>}{form.pdf_path && <p className="break-all text-xs text-text-secondary">Arquivo vinculado: {form.pdf_path}</p>}{contractPdfUrl && <a href={contractPdfUrl} target="_blank" rel="noreferrer" className="text-sm text-brand underline">Visualizar PDF enviado</a>}<p className="text-xs text-text-secondary">O PDF é enviado ao armazenamento privado e seu caminho fica no registro do contrato.</p></div>}
        </form>
      </Modal>}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Visualizar · ${definition.title.toLowerCase()}`} footer={<Button variant="outline" onClick={() => setViewing(null)}>Fechar</Button>}>
        {viewing && <dl className="grid gap-3 sm:grid-cols-2">{[...new Set(['id', ...definition.visible, ...Object.keys(viewing).filter((key) => key !== 'id')])].map((key) => <div key={key} className="min-w-0 rounded-lg bg-bg-secondary p-3"><dt className="text-xs font-medium uppercase text-text-secondary">{definition.fields.find((field) => field.name === key)?.label || key.replace(/_/g, ' ')}</dt><dd className="mt-1 break-all text-sm text-text-primary">{displayValue(viewing[key])}</dd></div>)}</dl>}
      </Modal>
    </div>
  );
}
