import { useMemo, useState } from 'react';
import { Plus, Search, Download, Users, Trash2 } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, PageHeader } from '@/components/ui';
import { exportCsv, formatBRL } from '@/lib/export';

type Vendedor = { id: string; nome: string; email: string; meta: number; status: 'ativo' | 'inativo' };

export default function Vendedores() {
  const [rows, setRows] = useState<Vendedor[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', meta: '' });

  const filtered = useMemo(() => rows.filter((r) => r.nome.toLowerCase().includes(busca.toLowerCase()) || r.email.toLowerCase().includes(busca.toLowerCase())), [rows, busca]);

  const salvar = () => {
    if (!form.nome.trim()) return;
    setRows((p) => [{ id: crypto.randomUUID(), nome: form.nome, email: form.email, meta: Number(form.meta) || 0, status: 'ativo' }, ...p]);
    setForm({ nome: '', email: '', meta: '' });
    setOpen(false);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Vendedores" description="Equipe comercial e metas" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportCsv('vendedores', filtered.map((r) => ({ Nome: r.nome, Email: r.email, Meta: r.meta })))}>CSV</Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Novo</Button>
        </>
      } />
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input placeholder="Buscar vendedor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhum vendedor" description="Adicione a equipe comercial." icon={<Users className="w-6 h-6" />} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                <th className="px-4 py-3 font-medium">Nome</th><th className="px-4 py-3 font-medium hidden sm:table-cell">E-mail</th>
                <th className="px-4 py-3 font-medium">Meta mensal</th><th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{r.nome}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-text-secondary">{r.email}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(r.meta)}</td>
                    <td className="px-4 py-3"><Badge variant="success">{r.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-2 rounded-lg hover:bg-erro/10" onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))}><Trash2 className="w-4 h-4 text-erro" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo vendedor" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar}>Salvar</Button></>}>
        <div className="space-y-4">
          <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Meta mensal (R$)" type="number" value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

