import { useMemo, useState } from 'react';
import { Plus, Search, Download, FileText, Pencil, Trash2, Users } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, FileUpload, PageHeader } from '@/components/ui';
import { exportCsv, exportPdf } from '@/lib/export';

type Cliente = { id: string; nome: string; documento: string; email: string; telefone: string; tipo: 'PF' | 'PJ'; status: 'ativo' | 'inativo' | 'prospecto' };

export default function Clientes() {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', documento: '', email: '', telefone: '', tipo: 'PJ' as 'PF' | 'PJ' });

  const filtered = useMemo(() => rows.filter((r) => r.nome.toLowerCase().includes(busca.toLowerCase()) || r.documento.includes(busca) || r.email.toLowerCase().includes(busca.toLowerCase())), [rows, busca]);

  const salvar = () => {
    if (!form.nome.trim() || !form.documento.trim()) return;
    setRows((p) => [{ id: crypto.randomUUID(), ...form, nome: form.nome.trim(), status: 'ativo' }, ...p]);
    setForm({ nome: '', documento: '', email: '', telefone: '', tipo: 'PJ' });
    setOpen(false);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Clientes" description="Base comercial e contatos" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportCsv('clientes', filtered.map((r) => ({ Nome: r.nome, Documento: r.documento, Email: r.email, Tipo: r.tipo, Status: r.status })))}>CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={() => exportPdf('Clientes', `<table><thead><tr><th>Nome</th><th>Documento</th><th>E-mail</th><th>Tipo</th></tr></thead><tbody>${filtered.map((r) => `<tr><td>${r.nome}</td><td>${r.documento}</td><td>${r.email}</td><td>${r.tipo}</td></tr>`).join('')}</tbody></table>`)}>PDF</Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Novo</Button>
        </>
      } />
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input placeholder="Buscar cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhum cliente" description="Cadastre seu primeiro cliente." icon={<Users className="w-6 h-6" />} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium">Nome</th><th className="px-4 py-3 font-medium hidden sm:table-cell">Documento</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">E-mail</th><th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{r.nome}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-text-secondary">{r.documento}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-text-secondary">{r.email || '—'}</td>
                    <td className="px-4 py-3"><Badge variant="info">{r.tipo}</Badge></td>
                    <td className="px-4 py-3"><Badge variant="success">{r.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex"><Pencil className="w-4 h-4 text-text-secondary" /></button>
                      <button className="p-2 rounded-lg hover:bg-erro/10 inline-flex" onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))}><Trash2 className="w-4 h-4 text-erro" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo cliente" size="lg" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar}>Salvar</Button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Nome / Razão social" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input label="CPF/CNPJ" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <div>
            <label className="text-sm font-medium block mb-1.5">Tipo</label>
            <select className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'PF' | 'PJ' })}>
              <option value="PJ">Pessoa jurídica</option>
              <option value="PF">Pessoa física</option>
            </select>
          </div>
          <div className="sm:col-span-2"><p className="text-sm font-medium mb-2">Documentos</p><FileUpload multiple categoria="arquivos" /></div>
        </div>
      </Modal>
    </div>
  );
}

