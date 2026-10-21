import { useMemo, useState } from 'react';
import { Plus, Search, Download, Briefcase, Trash2 } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, PageHeader } from '@/components/ui';
import { exportCsv, formatBRL } from '@/lib/export';

type Servico = { id: string; codigo: string; nome: string; categoria: string; valor: number; status: 'ativo' | 'inativo' };

export default function Servicos() {
  const [rows, setRows] = useState<Servico[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ codigo: '', nome: '', categoria: 'Geral', valor: '' });

  const filtered = useMemo(() => rows.filter((r) => r.nome.toLowerCase().includes(busca.toLowerCase()) || r.codigo.toLowerCase().includes(busca.toLowerCase())), [rows, busca]);

  const salvar = () => {
    if (!form.nome.trim()) return;
    setRows((p) => [{ id: crypto.randomUUID(), codigo: form.codigo || `SRV-${p.length + 1}`, nome: form.nome, categoria: form.categoria, valor: Number(form.valor) || 0, status: 'ativo' }, ...p]);
    setForm({ codigo: '', nome: '', categoria: 'Geral', valor: '' });
    setOpen(false);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Serviços" description="Catálogo de produtos e serviços" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportCsv('servicos', filtered.map((r) => ({ Código: r.codigo, Nome: r.nome, Categoria: r.categoria, Valor: r.valor })))}>CSV</Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Novo</Button>
        </>
      } />
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input placeholder="Buscar serviço..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhum serviço" description="Cadastre serviços para usar nos contratos." icon={<Briefcase className="w-6 h-6" />} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                <th className="px-4 py-3 font-medium">Código</th><th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Categoria</th><th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                    <td className="px-4 py-3 font-mono text-xs">{r.codigo}</td>
                    <td className="px-4 py-3 font-medium">{r.nome}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-text-secondary">{r.categoria}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(r.valor)}</td>
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
      <Modal open={open} onClose={() => setOpen(false)} title="Novo serviço" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar}>Salvar</Button></>}>
        <div className="space-y-4">
          <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <Input label="Valor base (R$)" type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
