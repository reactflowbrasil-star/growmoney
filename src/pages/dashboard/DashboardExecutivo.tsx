import { Card, Button, LoadingSpinner, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export default function DashboardExecutivo() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <h1 className="text-2xl font-bold text-preto">Dashboard Executivo</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn('p-4')}><p className="text-grafite">KPI 1</p><p className="text-xl font-bold text-preto">0</p></Card>
        <Card className={cn('p-4')}><p className="text-grafite">KPI 2</p><p className="text-xl font-bold text-preto">0</p></Card>
        <Card className={cn('p-4')}><p className="text-grafite">KPI 3</p><p className="text-xl font-bold text-preto">0</p></Card>
        <Card className={cn('p-4')}><p className="text-grafite">KPI 4</p><p className="text-xl font-bold text-preto">0</p></Card>
      </div>
      <Card className={cn('p-4')}><EmptyState title="Sem dados" description="Graficos aparecerao aqui." icon={<BarChart3 className="w-6 h-6" />} /></Card>
      <LoadingSpinner size="sm" />
    </div>
  );
}