import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Trash2, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { exportCsv, formatBRL } from '@/lib/export';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

type Vendedor = { id: string; nome: string; email: string; meta_mensal: number | null; status: 'ativo' | 'inativo' | 'suspenso'; identificador_interno: string };
const emptyForm = { nome: '', email: '', meta: '', password: '' };

export default function Vendedores() {
  const { user, empresaAtiva, hasPermission } = useAuth();
  const { isAdmin } = useAdminAuth();
  const canManage = isAdmin || empresaAtiva?.role === 'admin';
  const [rows, setRows] = useState<Vendedor[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!empresaAtiva?.id) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: loadError } = await supabase.from('vendedores')
      .select('id, nome, email, meta_mensal, status, identificador_interno')
      .eq('empresa_id', empresaAtiva.id).order('nome', { ascending: true });
    if (loadError) setError(`Não foi possível carregar vendedores: ${loadError.message}`);
    else { setRows((data || []) as Vendedor[]); setError(''); }
    setLoading(false);
  }, [empresaAtiva?.id]);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => rows.filter((row) => `${row.nome} ${row.email}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))), [rows, busca]);

  const salvar = async () => {
    if (!empresaAtiva?.id || !user?.id) { setError('Selecione uma empresa para cadastrar vendedores.'); return; }
    if (!form.nome.trim() || !form.email.trim() || form.password.length < 8) { setError('Informe nome, e-mail e uma senha inicial com pelo menos 8 caracteres.'); return; }
    setSaving(true); setError('');
    const { data, error: saveError } = await supabase.functions.invoke('admin-users', {
      body: {
        action: 'create', empresaId: empresaAtiva.id,
        nome: form.nome.trim(), email: form.email.trim().toLowerCase(),
        password: form.password, metaMensal: Number(form.meta) || 0,
      },
    });
    setSaving(false);
    if (saveError) {
      const context = (saveError as Error & { context?: unknown }).context;
      const payload = context instanceof Response
        ? await context.clone().json().catch(() => null) as { error?: unknown } | null
        : null;
      setError(typeof payload?.error === 'string' ? payload.error : `Não foi possível salvar o vendedor: ${saveError.message}`);
      return;
    }
    setOpen(false); setForm(emptyForm); await load();
    if (data?.emailSent === false) setError(data.message || 'O vendedor foi cadastrado, mas o e-mail de ativação não foi enviado.');
  };
  const excluir = async (row: Vendedor) => {
    if (!empresaAtiva?.id || !confirm(`Excluir ${row.nome} da equipe?`)) return;
    const { error: deleteError } = await supabase.from('vendedores').delete().eq('id', row.id).eq('empresa_id', empresaAtiva.id);
    if (deleteError) setError(`Não foi possível excluir o vendedor: ${deleteError.message}`);
    else await load();
  };

  return <div className="max-w-7xl space-y-4">
    <PageHeader title="Vendedores" description="Equipe comercial e metas" actions={<>
      <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportCsv('vendedores', filtered.map((r) => ({ Nome: r.nome, Email: r.email, Meta: r.meta_mensal || 0 })))}>CSV</Button>
      {canManage && hasPermission('vendedores:write') && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setError(''); setOpen(true); }}>Novo</Button>}
    </>} />
    {error && !open && <p className="rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</p>}
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border-color p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" /><Input placeholder="Buscar vendedor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" /></div></div>
      {loading ? <p className="p-8 text-center text-sm text-text-secondary">Carregando equipe…</p> : filtered.length === 0 ? <div className="p-8"><EmptyState title="Nenhum vendedor" description="Adicione sua equipe comercial." icon={<Users className="h-6 w-6" />} /></div> :
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border-color bg-bg-secondary/50 text-text-secondary"><th className="px-4 py-3 font-medium">Nome</th><th className="hidden px-4 py-3 font-medium sm:table-cell">E-mail</th><th className="px-4 py-3 font-medium">Meta mensal</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Ações</th></tr></thead>
          <tbody>{filtered.map((row) => <tr key={row.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40"><td className="px-4 py-3 font-medium">{row.nome}</td><td className="hidden px-4 py-3 text-text-secondary sm:table-cell">{row.email}</td><td className="px-4 py-3 tabular-nums">{formatBRL(row.meta_mensal || 0)}</td><td className="px-4 py-3"><Badge variant={row.status === 'ativo' ? 'success' : 'neutral'}>{row.status === 'inativo' ? 'Aguardando ativação' : row.status}</Badge></td>{canManage && <td className="px-4 py-3 text-right"><button type="button" aria-label={`Excluir ${row.nome}`} className="rounded-lg p-2 hover:bg-erro/10" onClick={() => void excluir(row)}><Trash2 className="h-4 w-4 text-erro" /></button></td>}</tr>)}</tbody>
        </table></div>}
    </Card>
    {canManage && hasPermission('vendedores:write') && <Modal open={open} onClose={() => setOpen(false)} title="Novo vendedor" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={saving} onClick={() => void salvar()}>Salvar vendedor</Button></>}>
      <div className="space-y-4"><Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /><Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><Input label="Senha inicial" type="password" minLength={8} hint="O vendedor poderá entrar após confirmar o e-mail enviado." value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><Input label="Meta mensal (R$)" type="number" min="0" step="0.01" value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} />{error && <p className="text-sm text-erro" role="alert">{error}</p>}</div>
    </Modal>}
  </div>;
}
