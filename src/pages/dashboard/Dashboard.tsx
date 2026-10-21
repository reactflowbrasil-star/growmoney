import { Card, Button, LoadingSpinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Users, FileText, DollarSign, Wallet } from 'lucide-react';

export default function Dashboard() {
  const kpis = [
    { label: 'Total Clientes', value: '120', icon: Users },
    { label: 'Contratos Ativos', value: '45', icon: FileText },
    { label: 'Valor Total', value: 'R$ 120.000', icon: DollarSign },
    { label: 'A Receber', value: 'R$ 30.000', icon: Wallet },
  ];
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <h1 className="text-2xl font-bold text-preto">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className={cn('p-4')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grafite">{k.label}</p>
                <p className="text-2xl font-bold text-preto">{k.value}</p>
              </div>
              <k.icon className="w-8 h-8 text-verde-discreto" />
            </div>
          </Card>
        ))}
      </div>
      <Card className={cn('p-4')}>
        <h2 className="font-semibold text-preto mb-3">Contratos recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="text-grafite"><th className="py-2">Cliente</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td className="py-2 text-preto">Empresa A</td><td>R$ 5.000</td><td>Ativo</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
      <LoadingSpinner size="sm" />
    </div>
  );
}