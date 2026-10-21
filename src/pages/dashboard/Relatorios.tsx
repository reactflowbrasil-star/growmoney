import { Card, Button, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export default function Relatorios() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <h1 className="text-2xl font-bold text-preto">Relatorios</h1>
      <Card className={cn('p-4')}>
        <Input placeholder="Tipo de relatorio..." className="max-w-sm mb-4" />
        <EmptyState title="Nenhum relatorio" description="Selecione um tipo." icon={<BarChart3 className="w-6 h-6" />} />
      </Card>
    </div>
  );
}