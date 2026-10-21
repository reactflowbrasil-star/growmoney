import { useMemo, useState } from 'react';
import { Plus, Download, FileText, Wallet } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, PageHeader, FileUpload } from '@/components/ui';
import { exportCsv, exportPdf, formatBRL } from '@/lib/export';

type Parcela = { id: string; cliente: string; valor: number; vencimento: string; status: 'pendente' | 'pago' | 'atrasado' };

export default function Financeiro() {
  const [rows, setRows] = useState<Parcela[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', valor: '', vencimento: '' });

  const totais = useMemo(() => {
    const previsto = rows.reduce((s, r) => s + r.valor, 0);
    const pago = rows.filter((r) => r.status === 'pago').reduce((s, r) => s + r.valor, 0);
    const atrasado = rows.filter((r) => r.status === 'atrasado').reduce((s, r) => s + r.valor, 0);
    return { previsto, pago, atrasado, saldo: previsto - pago };
  }, [rows]);

  const salvar = () => {
    if (!form.cliente.trim()) return;
    setRows((p) => [{ id: crypto.randomUUID(), cliente: form.cliente, valor: Number(form.valor) || 0, vencimento: form.vencimento || '—', status: 'pendente' }, ...p]);
    setForm({ cliente: '', valor: '', vencimento: '' });
    setOpen(false);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Financeiro" description="Parcelas, recebimentos e comprovantes" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportCsv('financeiro', rows.map((r) => ({ Cliente: r.cliente, Valor: r.valor, Vencimento: r.vencimento, Status: r.status })))}>CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={() => exportPdf('Financeiro', `<table><thead><tr><th>Cliente</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.cliente}</td><td>${formatBRL(r.valor)}</td><td>${r.vencimento}</td><td>${r.status}</td></tr>`).join('')}</tbody></table>`)}>PDF</Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Lançar</Button>
        </>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{ label: 'Previsto', value: totais.previsto }, { label: 'Recebido', value: totais.pago }, { label: 'Atrasado', value: totais.atrasado }, { label: 'Saldo', value: totais.saldo }].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs text-text-secondary font-medium">{k.label}</p>
            <p className="text-xl font-bold tabular-nums mt-1">{formatBRL(k.value)}</p>
          </Card>
        ))}
      </div>
      <Card padding="none" className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8"><EmptyState title="Sem lançamentos" description="Registre parcelas e anexe comprovantes." icon={<Wallet className="w-6 h-6" />} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                <th className="px-4 py-3 font-medium">Cliente</th><th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Vencimento</th><th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{r.cliente}</td>
                    <td className="px-4 py-3 tabular-nums">{formatBRL(r.valor)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-text-secondary">{r.vencimento}</td>
                    <td className="px-4 py-3"><Badge variant={r.status === 'pago' ? 'success' : r.status === 'atrasado' ? 'danger' : 'warning'}>{r.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setRows((p) => p.map((x) => x.id === r.id ? { ...x, status: 'pago' } : x))}>Marcar pago</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo lançamento" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar}>Salvar</Button></>}>
        <div className="space-y-4">
          <Input label="Cliente" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} required />
          <Input label="Valor (R$)" type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
          <Input label="Vencimento" type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
          <div><p className="text-sm font-medium mb-2">Comprovante</p><FileUpload accept="image/*,.pdf" /></div>
        </div>
      </Modal>
    </div>
  );
}
