import { useMemo, useState } from 'react';
import { Plus, Search, Download, FileText, Pencil, Trash2, Send } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, FileUpload, PageHeader } from '@/components/ui';
import { exportCsv, exportPdf, formatBRL } from '@/lib/export';

type Contrato = { id: string; numero: string; cliente: string; valor: number; status: 'rascunho' | 'enviado' | 'assinado' | 'cancelado'; vencimento: string };
const statusVariant: Record<Contrato['status'], 'neutral' | 'info' | 'success' | 'danger'> = { rascunho: 'neutral', enviado: 'info', assinado: 'success', cancelado: 'danger' };

export default function Contratos() {
  const [rows, setRows] = useState<Contrato[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', valor: '', vencimento: '', observacoes: '' });

  const filtered = useMemo(() => rows.filter((r) => r.cliente.toLowerCase().includes(busca.toLowerCase()) || r.numero.includes(busca)), [rows, busca]);

  const salvar = () => {
    if (!form.cliente.trim()) return;
    const n = rows.length + 1;
    setRows((p) => [{ id: crypto.randomUUID(), numero: `CT-${String(n).padStart(4, '0')}`, cliente: form.cliente.trim(), valor: Number(form.valor) || 0, status: 'rascunho', vencimento: form.vencimento || '—' }, ...p]);
    setForm({ cliente: '', valor: '', vencimento: '', observacoes: '' });
    setOpen(false);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Contratos" description="Criação, envio e assinatura" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportCsv('contratos', filtered.map((r) => ({ Número: r.numero, Cliente: r.cliente, Valor: r.valor, Status: r.status })))}>CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={() => exportPdf('Contratos', `<table><thead><tr><th>Nº</th><th>Cliente</th><th>Valor</th><th>Status</th></tr></thead><tbody>${filtered.map((r) => `<tr><td>${r.numero}</td><td>${r.cliente}</td><td>${formatBRL(r.valor)}</td><td>${r.status}</td></tr>`).join('')}</tbody></table>`)}>PDF</Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Novo</Button>
        </>
      } />
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input placeholder="Buscar contrato..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhum contrato" description="Crie um contrato e anexe documentos." icon={<FileText className="w-6 h-6" />} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                <th className="px-4 py-3 font-medium">Nº</th><th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Valor</th><th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Vencimento</th><th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                    <td className="px-4 py-3 font-mono text-xs">{r.numero}</td>
                    <td className="px-4 py-3 font-medium">{r.cliente}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(r.valor)}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant[r.status]}>{r.status}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell text-text-secondary">{r.vencimento}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex" title="Enviar" onClick={() => setRows((p) => p.map((x) => x.id === r.id ? { ...x, status: 'enviado' } : x))}><Send className="w-4 h-4 text-brand" /></button>
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
      <Modal open={open} onClose={() => setOpen(false)} title="Novo contrato" size="lg" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar}>Salvar rascunho</Button></>}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Cliente" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} required />
          <Input label="Valor (R$)" type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
          <Input label="Vencimento" type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
          <Input label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          <div className="sm:col-span-2"><p className="text-sm font-medium mb-2">Anexos</p><FileUpload multiple accept=".pdf,image/*,.doc,.docx" /></div>
        </div>
      </Modal>
    </div>
  );
}
