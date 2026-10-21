import { Card, Button, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Building2, Plus } from 'lucide-react';

export default function Empresas() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-preto">Empresas</h1>
        <Button className="bg-verde-discreto text-branco"><Plus className="w-4 h-4 mr-1" /> Nova</Button>
      </div>
      <Card className={cn('p-4')}>
        <Input placeholder="Buscar empresa..." className="max-w-sm mb-4" />
        <EmptyState title="Nenhuma empresa" description="Cadastre uma empresa." icon={<Building2 className="w-6 h-6" />} />
      </Card>
    </div>
  );
}