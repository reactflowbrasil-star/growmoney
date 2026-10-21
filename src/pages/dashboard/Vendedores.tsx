import { Card, Button, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Users, Plus } from 'lucide-react';

export default function Vendedores() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-preto">Vendedores</h1>
        <Button className="bg-verde-discreto text-branco"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
      </div>
      <Card className={cn('p-4')}>
        <Input placeholder="Buscar vendedor..." className="max-w-sm mb-4" />
        <EmptyState title="Nenhum vendedor" description="Cadastre um vendedor." icon={<Users className="w-6 h-6" />} />
      </Card>
    </div>
  );
}