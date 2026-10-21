import { Card, Button, Input, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Wallet, Plus } from 'lucide-react';

export default function Financeiro() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <h1 className="text-2xl font-bold text-preto">Financeiro</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn('p-4')}><p className="text-grafite">Total</p><p className="text-xl font-bold text-preto">R$ 0</p></Card>
        <Card className={cn('p-4')}><p className="text-grafite">Recebido</p><p className="text-xl font-bold text-preto">R$ 0</p></Card>
        <Card className={cn('p-4')}><p className="text-grafite">A Receber</p><p className="text-xl font-bold text-preto">R$ 0</p></Card>
      </div>
      <Card className={cn('p-4')}>
        <Input placeholder="Filtrar parcelas..." className="max-w-sm mb-4" />
        <EmptyState title="Nenhuma parcela" description="Sem parcelas." icon={<Wallet className="w-6 h-6" />} />
      </Card>
    </div>
  );
}