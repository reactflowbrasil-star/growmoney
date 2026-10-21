import { useMemo, useState } from 'react';
import { Building2, Plus, Search, Download, FileText, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, FileUpload, PageHeader } from '@/components/ui';
import { exportCsv, exportPdf } from '@/lib/export';
import { useAuth } from '@/contexts/AuthContext';

type EmpresaRow = {
  id: string;
  nome: string;
  cnpj: string;
  status: 'ativa' | 'inativa';
  membros: number;
  criadaEm: string;
};

export default function Empresas() {
  const { empresas } = useAuth();
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [rows, setRows] = useState<EmpresaRow[]>(() =>
    (empresas || []).map((e) => ({
      id: e.id,
      nome: e.nome,
      cnpj: e.cnpj || '—',
      status: 'ativa' as const,
      membros: 1,
      criadaEm: new Date().toLocaleDateString('pt-BR'),
    }))
  );

  const filtered = useMemo(
    () => rows.filter((r) => r.nome.toLowerCase().includes(busca.toLowerCase()) || r.cnpj.includes(busca)),
    [rows, busca]
  );

  const salvar = () => {
    if (!nome.trim()) return;
    setRows((prev) => [
      { id: crypto.randomUUID(), nome: nome.trim(), cnpj: cnpj || '—', status: 'ativa', membros: 1, criadaEm: new Date().toLocaleDateString('pt-BR') },
      ...prev,
    ]);
    setNome('');
    setCnpj('');
    setOpen(false);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Empresas" description="Unidades e organizações do seu workspace" actions={
        <>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportCsv('empresas', filtered.map((r) => ({ Nome: r.nome, CNPJ: r.cnpj, Status: r.status, Membros: r.membros })))}>CSV</Button>
          <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />} onClick={() => exportPdf('Empresas — Grow Money', `<table><thead><tr><th>Nome</th><th>CNPJ</th><th>Status</th><th>Membros</th></tr></thead><tbody>${filtered.map((r) => `<tr><td>${r.nome}</td><td>${r.cnpj}</td><td>${r.status}</td><td>${r.membros}</td></tr>`).join('')}</tbody></table>`)}>PDF</Button>
          <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Nova</Button>
        </>
      } />
      <Card className="overflow-hidden" padding="none">
        <div className="p-4 border-b border-border-color">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input placeholder="Buscar empresa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Nenhuma empresa" description="Cadastre uma empresa para começar a operar." icon={<Building2 className="w-6 h-6" />} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                <th className="px-4 py-3 font-medium">Nome</th><th className="px-4 py-3 font-medium hidden sm:table-cell">CNPJ</th>
                <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium hidden md:table-cell">Membros</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{r.nome}</td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{r.cnpj}</td>
                    <td className="px-4 py-3"><Badge variant={r.status === 'ativa' ? 'success' : 'neutral'}>{r.status}</Badge></td>
                    <td className="px-4 py-3 hidden md:table-cell">{r.membros}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-2 rounded-lg hover:bg-bg-tertiary inline-flex" aria-label="Editar"><Pencil className="w-4 h-4 text-text-secondary" /></button>
                      <button className="p-2 rounded-lg hover:bg-erro/10 inline-flex" onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))} aria-label="Excluir"><Trash2 className="w-4 h-4 text-erro" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova empresa" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar}>Salvar</Button></>}>
        <div className="space-y-4">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          <div><p className="text-sm font-medium mb-2">Logo / documentos</p><FileUpload accept="image/*,.pdf" categoria="auto" /></div>
        </div>
      </Modal>
    </div>
  );
}

