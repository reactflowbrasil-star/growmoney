import { useEffect, useMemo, useState } from 'react';
import { Building2, Download, FileText, Pencil, Plus, Search } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { exportCsv, exportPdf } from '@/lib/export';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Empresas() {
  const { empresas, empresaAtiva, switchEmpresa, refreshEmpresas, hasPermission } = useAuth();
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    void Promise.all(empresas.map(async (company) => {
      const { count } = await supabase.from('empresa_members').select('id', { count: 'exact', head: true }).eq('empresa_id', company.id).eq('status', 'aceito');
      return [company.id, count || 0] as const;
    })).then((counts) => { if (active) setMemberCounts(Object.fromEntries(counts)); });
    return () => { active = false; };
  }, [empresas]);

  const filtered = useMemo(() => empresas.filter((company) => `${company.nome} ${company.cnpj || ''}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))), [empresas, busca]);
  const novo = () => { setEditingId(null); setNome(''); setCnpj(''); setError(''); setOpen(true); };
  const editar = (id: string) => {
    const company = empresas.find((item) => item.id === id);
    if (!company) return;
    setEditingId(id); setNome(company.nome); setCnpj(company.cnpj || ''); setError(''); setOpen(true);
  };

  const salvar = async () => {
    if (!nome.trim()) { setError('Informe o nome da empresa.'); return; }
    setSaving(true); setError('');
    if (editingId) {
      const { data, error: saveError } = await supabase.from('empresas').update({ nome: nome.trim(), cnpj: cnpj.trim() || null, atualizado_em: new Date().toISOString() }).eq('id', editingId).select('id').maybeSingle();
      if (saveError || !data) { setError(`Não foi possível atualizar a empresa: ${saveError?.message || 'sem permissão ou empresa não encontrada'}`); setSaving(false); return; }
      await refreshEmpresas();
      setNotice('Empresa atualizada no servidor.');
    } else {
      const { data: id, error: createError } = await supabase.rpc('create_empresa_with_admin', { p_nome: nome.trim(), p_cnpj: cnpj.trim() || null, p_configuracoes: {} });
      if (createError || !id) { setError(`Não foi possível criar a empresa: ${createError?.message || 'a empresa não foi retornada'}`); setSaving(false); return; }
      await refreshEmpresas();
      switchEmpresa(id as string);
      setNotice('Empresa criada no servidor e selecionada.');
    }
    setSaving(false); setOpen(false);
  };

  const canWrite = hasPermission('empresas:write');
  return <div className="max-w-7xl space-y-4">
    <PageHeader title="Empresas" description="Unidades e organizações do seu workspace" actions={<>
      <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => exportCsv('empresas', filtered.map((row) => ({ Nome: row.nome, CNPJ: row.cnpj || '', Membros: memberCounts[row.id] || 0 })))}>CSV</Button>
      <Button variant="outline" size="sm" leftIcon={<FileText className="h-4 w-4" />} onClick={() => exportPdf('Empresas - Grow Money', `<table><thead><tr><th>Nome</th><th>CNPJ</th><th>Membros</th></tr></thead><tbody>${filtered.map((row) => `<tr><td>${row.nome}</td><td>${row.cnpj || ''}</td><td>${memberCounts[row.id] || 0}</td></tr>`).join('')}</tbody></table>`)}>PDF</Button>
      {canWrite && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={novo}>Nova</Button>}
    </>} />
    {error && !open && <p className="rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</p>}{notice && <p className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand" role="status">{notice}</p>}
    <Card className="overflow-hidden" padding="none">
      <div className="border-b border-border-color p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" /><Input placeholder="Buscar empresa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" /></div></div>
      {filtered.length === 0 ? <div className="p-8"><EmptyState title="Nenhuma empresa" description="Crie uma empresa para começar a operar." icon={<Building2 className="h-6 w-6" />} /></div> :
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border-color bg-bg-secondary/50 text-text-secondary"><th className="px-4 py-3 font-medium">Nome</th><th className="hidden px-4 py-3 font-medium sm:table-cell">CNPJ</th><th className="px-4 py-3 font-medium">Situação</th><th className="hidden px-4 py-3 font-medium md:table-cell">Membros</th><th className="px-4 py-3 text-right font-medium">Ações</th></tr></thead>
          <tbody>{filtered.map((company) => <tr key={company.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40"><td className="px-4 py-3 font-medium">{company.nome}</td><td className="hidden px-4 py-3 text-text-secondary sm:table-cell">{company.cnpj || '—'}</td><td className="px-4 py-3"><Badge variant="success">{company.id === empresaAtiva?.id ? 'Ativa' : 'Disponível'}</Badge></td><td className="hidden px-4 py-3 md:table-cell">{memberCounts[company.id] ?? '—'}</td><td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => switchEmpresa(company.id)}>{company.id === empresaAtiva?.id ? 'Selecionada' : 'Selecionar'}</Button>{canWrite && <button type="button" aria-label={`Editar ${company.nome}`} className="rounded-lg p-2 hover:bg-bg-tertiary" onClick={() => editar(company.id)}><Pencil className="h-4 w-4 text-text-secondary" /></button>}</td></tr>)}</tbody>
        </table></div>}
    </Card>
    <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Editar empresa' : 'Nova empresa'} footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button loading={saving} onClick={() => void salvar()}>{editingId ? 'Salvar alterações' : 'Criar empresa'}</Button></>}>
      <div className="space-y-4"><Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required /><Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />{error && <p className="text-sm text-erro" role="alert">{error}</p>}</div>
    </Modal>
  </div>;
}
