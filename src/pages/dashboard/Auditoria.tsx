import { Card, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';

export default function Auditoria() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <h1 className="text-2xl font-bold text-preto">Auditoria</h1>
      <Card className={cn('p-4')}>
        <Input placeholder="Buscar log..." className="max-w-sm mb-4" />
        <EmptyState title="Nenhum log" description="Sem registros." icon={<ClipboardList className="w-6 h-6" />} />
      </Card>
    </div>
  );
}