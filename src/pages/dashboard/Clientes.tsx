import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState, FileUpload, Input, Modal, PageHeader } from '@/components/ui';
import { exportCsv, exportPdf } from '@/lib/export';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Cliente = {
  id: string;
  empresa_id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  tipo: 'pf' | 'pj';
  status: 'ativo' | 'inativo' | 'arquivado' | 'suspenso' | 'prospecto';
};

const emptyForm = { nome: '', documento: '', email: '', telefone: '', tipo: 'pj' as 'pf' | 'pj', status: 'ativo' as Cliente['status'] };

export default function Clientes() {
  const { user, empresaAtiva, hasPermission } = useAuth();
  const [rows, setRows] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!empresaAtiva?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('clients')
      .select('id, empresa_id, nome, documento, email, telefone, tipo, status')
      .eq('empresa_id', empresaAtiva.id)
      .order('criado_em', { ascending: false });
    if (queryError) setError(`Não foi possível carregar os clientes: ${queryError.message}`);
    else setRows((data || []) as Cliente[]);
    setLoading(false);
  }, [empresaAtiva?.id]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const query = busca.trim().toLocaleLowerCase('pt-BR');
    if (!query) return rows;
    return rows.filter((row) => [row.nome, row.documento, row.email].some((value) => value?.toLocaleLowerCase('pt-BR').includes(query)));
  }, [rows, busca]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  };

  const openEdit = (cliente: Cliente) => {
    setEditing(cliente);
    setForm({ nome: cliente.nome, documento: cliente.documento, email: cliente.email || '', telefone: cliente.telefone || '', tipo: cliente.tipo === 'pf' || cliente.tipo === 'pessoa_fisica' as never ? 'pf' : 'pj', status: cliente.status });
    setError('');
    setOpen(true);
  };

  const salvar = async () => {
    if (!empresaAtiva?.id || !user?.id) {
      setError('Sua conta precisa estar vinculada a uma empresa antes de cadastrar clientes.');
      return;
    }
    if (!form.nome.trim() || !form.documento.trim()) {
      setError('Preencha o nome e o CPF/CNPJ.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      nome: form.nome.trim(),
      razao_social: form.nome.trim(),
      documento: form.documento.trim(),
      tipo: form.tipo,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      status: form.status,
      atualizado_por: user.id,
      atualizado_em: new Date().toISOString(),
    };
    const result = editing
      ? await supabase.from('clients').update(payload).eq('id', editing.id).eq('empresa_id', empresaAtiva.id).select('id').maybeSingle()
      : await supabase.from('clients').insert({ ...payload, empresa_id: empresaAtiva.id, criado_por: user.id }).select('id').maybeSingle();

    if (result.error) {
      setError(`Não foi possível salvar o cliente: ${result.error.message}`);
      setSaving(false);
      return;
    }
    if (!result.data) {
      setError('Nenhum registro foi salvo. Confira o acesso da sua conta à empresa.');
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    setNotice(editing ? 'Cliente atualizado no servidor.' : 'Cliente salvo no servidor.');
    await load();
  };

  const excluir = async (cliente: Cliente) => {
    if (!empresaAtiva?.id || !confirm(`Excluir o cliente ${cliente.nome}?`)) return;
    setError('');
    const { error: deleteError, count } = await supabase.from('clients').delete({ count: 'exact' }).eq('id', cliente.id).eq('empresa_id', empresaAtiva.id);
    if (deleteError) setError(`Não foi possível excluir ${cliente.nome}: ${deleteError.message}`);
    else if (count === 0) setError('O cliente não foi excluído. Confira as permissões ou vínculos de contrato.');
    else {
      setNotice('Cliente excluído do servidor.');
      await load();
    }
  };

  const allowedWrite = hasPermission('clients:write');
  const allowedDelete = hasPermission('clients:delete');

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Clientes" description="Base comercial e contatos" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportCsv('clientes', filtered.map((r) => ({ Nome: r.nome, Documento: r.documento, Email: r.email, Tipo: r.tipo, Status: r.status })))}>CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="h-4 w-4" />} onClick={() => exportPdf('Clientes', `<table><thead><tr><th>Nome</th><th>Documento</th><th>E-mail</th><th>Tipo</th></tr></thead><tbody>${filtered.map((r) => `<tr><td>${r.nome}</td><td>${r.documento}</td><td>${r.email}</td><td>${r.tipo}</td></tr>`).join('')}</tbody></table>`)}>PDF</Button>
          {allowedWrite && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>Novo</Button>}
        </>
      } />
      {error && !open && <p className="rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</p>}
      {notice && <p className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand" role="status">{notice}</p>}
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-border-color p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input placeholder="Buscar cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </div>
        {loading ? <p className="p-8 text-center text-sm text-text-secondary">Carregando clientes salvos…</p> : filtered.length === 0 ? (
          <div className="p-8"><EmptyState title={rows.length ? 'Nenhum resultado' : 'Nenhum cliente'} description={rows.length ? 'Tente outra busca.' : 'Cadastre seu primeiro cliente.'} icon={<Users className="h-6 w-6" />} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-border-color bg-bg-secondary/50 text-text-secondary">
                <th className="px-4 py-3 font-medium">Nome</th><th className="hidden px-4 py-3 font-medium sm:table-cell">Documento</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">E-mail</th><th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr></thead>
              <tbody>{filtered.map((row) => (
                <tr key={row.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{row.nome}</td>
                  <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">{row.documento}</td>
                  <td className="hidden px-4 py-3 text-text-secondary md:table-cell">{row.email || '—'}</td>
                  <td className="px-4 py-3"><Badge variant="info">{row.tipo === 'pf' || (row.tipo as string) === 'pessoa_fisica' ? 'PF' : 'PJ'}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={row.status === 'ativo' ? 'success' : 'neutral'}>{row.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {allowedWrite && <button type="button" aria-label={`Editar ${row.nome}`} className="inline-flex rounded-lg p-2 hover:bg-bg-tertiary" onClick={() => openEdit(row)}><Pencil className="h-4 w-4 text-text-secondary" /></button>}
                    {allowedDelete && <button type="button" aria-label={`Excluir ${row.nome}`} className="inline-flex rounded-lg p-2 hover:bg-erro/10" onClick={() => void excluir(row)}><Trash2 className="h-4 w-4 text-erro" /></button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar cliente' : 'Novo cliente'} size="lg" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={saving} onClick={() => void salvar()}>{editing ? 'Salvar alterações' : 'Salvar cliente'}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome / Razão social" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input label="CPF/CNPJ" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <div><label className="mb-1.5 block text-sm font-medium">Tipo</label><select className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'pf' | 'pj' })}><option value="pj">Pessoa jurídica</option><option value="pf">Pessoa física</option></select></div>
          <div><label className="mb-1.5 block text-sm font-medium">Status</label><select className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Cliente['status'] })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="prospecto">Prospecto</option></select></div>
          <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium">Documentos</p><FileUpload multiple categoria="arquivos" /></div>
          {error && <p className="text-sm text-erro sm:col-span-2" role="alert">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
