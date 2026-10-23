import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Download, FileText, Pencil, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, PageHeader } from '@/components/ui';
import { AdminAccordionList } from '@/components/admin/AdminAccordionList';
import { useAdminHiddenRecords } from '@/hooks/useAdminHiddenRecords';
import { exportCsv, exportPdf } from '@/lib/export';
import { ClientService } from '@/services/client-service';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import type { Cliente, ClientStatus, ClientType, CreateClienteData } from '@/lib/client-types';

type FormState = {
  nome: string;
  razao_social: string;
  documento: string;
  email: string;
  telefone: string;
  tipo: ClientType;
  status: ClientStatus;
};

const emptyForm: FormState = {
  nome: '', razao_social: '', documento: '', email: '', telefone: '',
  tipo: 'pessoa_juridica', status: 'ativo',
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] || char));

export default function Clientes() {
  const { user, empresaAtiva } = useAuth();
  const { isAdmin: isPlatformAdmin } = useAdminAuth();
  const canManage = isPlatformAdmin || empresaAtiva?.role === 'admin';
  const [rows, setRows] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [viewing, setViewing] = useState<Cliente | null>(null);
  const { hiddenIds, hiddenCount, showHidden, setShowHidden, toggleHidden } = useAdminHiddenRecords('clientes-operacional');

  const role = empresaAtiva?.role || user?.role || '';
  const loadClients = useCallback(async () => {
    if (!empresaAtiva?.id || !role) return;
    setLoading(true);
    setError('');
    try {
      const result = await ClientService.findMany({ empresa_id: empresaAtiva.id, busca, limit: 100, order_by: 'nome', order_dir: 'asc' }, role);
      setRows(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva?.id, role, busca]);

  useEffect(() => { void loadClients(); }, [loadClients, reload]);

  const abrirNovo = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    setEditing(cliente);
    setForm({
      nome: cliente.nome,
      razao_social: cliente.razao_social || '',
      documento: cliente.documento,
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      tipo: cliente.tipo === 'pf' ? 'pessoa_fisica' : cliente.tipo === 'pj' ? 'pessoa_juridica' : cliente.tipo,
      status: cliente.status,
    });
    setError('');
    setOpen(true);
  };

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !empresaAtiva?.id || !role) return;
    setSaving(true);
    setError('');
    const data = {
      nome: form.nome.trim(),
      razao_social: form.razao_social.trim() || undefined,
      documento: form.documento.trim(),
      email: form.email.trim() || undefined,
      telefone: form.telefone.trim() || undefined,
      tipo: form.tipo,
      status: form.status,
    };
    try {
      if (editing) {
        await ClientService.update(editing.id, empresaAtiva.id, data, user.id, role);
      } else {
        await ClientService.create({ ...data, empresa_id: empresaAtiva.id } satisfies CreateClienteData, user.id, role);
      }
      setOpen(false);
      setReload((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (cliente: Cliente) => {
    if (!user?.id || !empresaAtiva?.id || !role || !window.confirm(`Excluir ${cliente.nome}?`)) return;
    setError('');
    try {
      await ClientService.delete(cliente.id, empresaAtiva.id, role);
      setReload((value) => value + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Falha ao excluir cliente');
    }
  };

  const filtered = useMemo(() => rows.filter((row) => showHidden ? hiddenIds.has(row.id) : !hiddenIds.has(row.id)), [rows, showHidden, hiddenIds]);
  const tipoLabel = (tipo: ClientType) => tipo === 'pessoa_fisica' || tipo === 'pf' ? 'Pessoa física' : 'Pessoa jurídica';

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Clientes" description="Base comercial e contatos" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportCsv('clientes', filtered.map((r) => ({ Nome: r.nome, Documento: r.documento, Email: r.email || '', Tipo: tipoLabel(r.tipo), Status: r.status })))}>CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={() => exportPdf('Clientes', `<table><thead><tr><th>Nome</th><th>Documento</th><th>E-mail</th><th>Tipo</th></tr></thead><tbody>${filtered.map((r) => `<tr><td>${escapeHtml(r.nome)}</td><td>${escapeHtml(r.documento)}</td><td>${escapeHtml(r.email || '')}</td><td>${tipoLabel(r.tipo)}</td></tr>`).join('')}</tbody></table>`)}>PDF</Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={abrirNovo}>Novo</Button>
        </>
      } />
      {error && !open && <div role="alert" className="rounded-lg border border-erro/30 bg-erro/10 px-4 py-3 text-sm text-erro">{error}</div>}
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input aria-label="Buscar cliente" placeholder="Buscar cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowHidden((value) => !value)}>{showHidden ? 'Exibir ativos' : `Exibir ocultos (${hiddenCount})`}</Button>
        </div>
        {loading ? <div className="p-8 text-center text-sm text-text-secondary">Carregando clientes…</div> : filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhum cliente" description="Cadastre seu primeiro cliente." icon={<Users className="w-6 h-6" />} /></div>
        ) : (
          <AdminAccordionList items={filtered.map((r) => ({
            id: r.id, title: r.nome, subtitle: r.documento,
            details: [
              { label: 'E-mail', value: r.email }, { label: 'Telefone', value: r.telefone },
              { label: 'Tipo', value: tipoLabel(r.tipo) }, { label: 'Status', value: r.status },
              { label: 'Razão social', value: r.razao_social },
            ],
            actions: <>
              <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setViewing(r)}>Visualizar</Button>
              <Button variant="ghost" size="sm" leftIcon={<EyeOff className="h-4 w-4" />} onClick={() => toggleHidden(r.id)}>{showHidden ? 'Reexibir' : 'Ocultar'}</Button>
              {canManage && <><Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => abrirEdicao(r)}>Editar</Button><Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4 text-erro" />} onClick={() => void excluir(r)}>Excluir</Button></>}
            </>,
          }))} />
        )}
      </Card>
      {(canManage || (!editing && open)) && <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar cliente' : 'Novo cliente'} size="lg" footer={<><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button form="cliente-form" type="submit" loading={saving}>{editing ? 'Salvar alterações' : 'Salvar'}</Button></>}>
        <form id="cliente-form" onSubmit={salvar} className="grid sm:grid-cols-2 gap-4">
          {error && <div role="alert" className="sm:col-span-2 rounded-lg border border-erro/30 bg-erro/10 px-4 py-3 text-sm text-erro">{error}</div>}
          <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input label="Razão social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
          <Input label="CPF/CNPJ" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Telefone" type="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <div>
            <label htmlFor="cliente-tipo" className="text-sm font-medium block mb-1.5">Tipo</label>
            <select id="cliente-tipo" className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as ClientType })}>
              <option value="pessoa_juridica">Pessoa jurídica</option>
              <option value="pessoa_fisica">Pessoa física</option>
            </select>
          </div>
          <div>
            <label htmlFor="cliente-status" className="text-sm font-medium block mb-1.5">Status</label>
            <select id="cliente-status" className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
              <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="suspenso">Suspenso</option><option value="prospecto">Prospecto</option><option value="arquivado">Arquivado</option>
            </select>
          </div>
        </form>
      </Modal>}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Visualizar cliente" footer={<Button variant="outline" onClick={() => setViewing(null)}>Fechar</Button>}>
        {viewing && <dl className="grid gap-3 sm:grid-cols-2">{[['Nome', viewing.nome], ['Razão social', viewing.razao_social], ['CPF/CNPJ', viewing.documento], ['E-mail', viewing.email], ['Telefone', viewing.telefone], ['Tipo', tipoLabel(viewing.tipo)], ['Status', viewing.status]].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg bg-bg-secondary p-3"><dt className="text-xs font-medium uppercase text-text-secondary">{label}</dt><dd className="mt-1 break-all text-sm text-text-primary">{value || '—'}</dd></div>)}</dl>}
      </Modal>
    </div>
  );
}
