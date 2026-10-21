import { Card, Button, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Filter, Plus } from 'lucide-react';

export default function Contratos() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-preto">Contratos</h1>
        <Button className="bg-verde-discreto text-branco"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
      </div>
      <Card className={cn('p-4')}>
        <div className="flex gap-2 mb-4"><Input placeholder="Filtrar..." className="max-w-sm" /><Filter className="w-5 h-5 text-grafite" /></div>
        <EmptyState title="Nenhum contrato" description="Crie um contrato." />
      </Card>
    </div>
  );
}