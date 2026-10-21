import { useMemo, useState } from 'react';
import { Plus, Calendar as CalIcon, Trash2 } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, PageHeader } from '@/components/ui';

type Evento = { id: string; titulo: string; data: string; hora: string; tipo: string; status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' };

export default function Agenda() {
  const [rows, setRows] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: '', data: '', hora: '09:00', tipo: 'reuniao' });

  const sorted = useMemo(() => [...rows].sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`)), [rows]);

  const salvar = () => {
    if (!form.titulo.trim() || !form.data) return;
    setRows((p) => [{ id: crypto.randomUUID(), titulo: form.titulo, data: form.data, hora: form.hora, tipo: form.tipo, status: 'agendado' }, ...p]);
    setForm({ titulo: '', data: '', hora: '09:00', tipo: 'reuniao' });
    setOpen(false);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Agenda" description="Compromissos da equipe" actions={<Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Novo</Button>} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padding="none">
          {sorted.length === 0 ? (
            <div className="p-8"><EmptyState title="Agenda vazia" description="Agende reuniões, visitas e ligações." icon={<CalIcon className="w-6 h-6" />} /></div>
          ) : (
            <ul className="divide-y divide-border-color">
              {sorted.map((e) => (
                <li key={e.id} className="flex items-center gap-4 px-4 py-3 hover:bg-bg-secondary/40">
                  <div className="w-14 text-center shrink-0">
                    <p className="text-xs text-text-secondary">{e.data.slice(5)}</p>
                    <p className="text-sm font-semibold">{e.hora}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.titulo}</p>
                    <p className="text-xs text-text-secondary capitalize">{e.tipo}</p>
                  </div>
                  <Badge variant={e.status === 'confirmado' ? 'success' : e.status === 'cancelado' ? 'danger' : 'info'}>{e.status}</Badge>
                  <button className="p-2 rounded-lg hover:bg-erro/10" onClick={() => setRows((p) => p.filter((x) => x.id !== e.id))}><Trash2 className="w-4 h-4 text-erro" /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">Resumo</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Total</span><span className="font-semibold">{rows.length}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Agendados</span><span className="font-semibold">{rows.filter((r) => r.status === 'agendado').length}</span></div>
          </div>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo compromisso" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={salvar}>Agendar</Button></>}>
        <div className="space-y-4">
          <Input label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
            <Input label="Hora" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Tipo</label>
            <select className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="reuniao">Reunião</option>
              <option value="ligacao">Ligação</option>
              <option value="visita">Visita</option>
              <option value="videoconferencia">Videoconferência</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
