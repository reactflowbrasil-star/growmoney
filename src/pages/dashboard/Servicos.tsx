import { Card, Button, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { LayoutGrid, Plus } from 'lucide-react';

export default function Servicos() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-preto">Servicos</h1>
        <Button className="bg-verde-discreto text-branco"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
      </div>
      <Card className={cn('p-4')}>
        <Input placeholder="Buscar servico..." className="max-w-sm mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EmptyState title="Nenhum servico" description="Cadastre um servico." />
        </div>
      </Card>
    </div>
  );
}