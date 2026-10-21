import { Card, Button, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Calendar, Plus } from 'lucide-react';

export default function Agenda() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-preto">Agenda</h1>
        <Button className="bg-verde-discreto text-branco"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
      </div>
      <Card className={cn('p-4')}>
        <Input placeholder="Buscar..." className="max-w-sm mb-4" />
        <EmptyState title="Nenhum agendamento" description="Adicione um compromisso." icon={<Calendar className="w-6 h-6" />} />
      </Card>
    </div>
  );
}