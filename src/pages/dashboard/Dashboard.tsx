import { Users, FileText, DollarSign, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const chartData = [
  { mes: 'Jan', recebido: 42000, previsto: 48000 },
  { mes: 'Fev', recebido: 51000, previsto: 52000 },
  { mes: 'Mar', recebido: 48000, previsto: 55000 },
  { mes: 'Abr', recebido: 62000, previsto: 60000 },
  { mes: 'Mai', recebido: 58000, previsto: 65000 },
  { mes: 'Jun', recebido: 71000, previsto: 70000 },
];

const statusData = [
  { name: 'Assinados', value: 42, color: 'var(--brand)' },
  { name: 'Pendentes', value: 18, color: '#f59e0b' },
  { name: 'Enviados', value: 12, color: '#3b82f6' },
  { name: 'Cancelados', value: 5, color: '#ef4444' },
];

function KPI({ title, value, change, icon: Icon, delay }: {
  title: string; value: string; change: number; icon: typeof Users; delay: number;
}) {
  const up = change >= 0;
  return (
    <div className="card-premium p-5 relative overflow-hidden group animate-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-brand/5 group-hover:bg-brand/10 transition-colors" />
      <div className="flex justify-between relative">
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums">{value}</p>
          <span className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            up ? 'bg-brand/10 text-brand-dark' : 'bg-erro/10 text-erro'
          )}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? '+' : ''}{change}% vs mês
          </span>
        </div>
        <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="animate-in">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Visão geral da operação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI title="Total clientes" value="128" change={12} icon={Users} delay={0} />
        <KPI title="Contratos ativos" value="47" change={8} icon={FileText} delay={60} />
        <KPI title="Valor contratado" value="R$ 248k" change={15} icon={DollarSign} delay={120} />
        <KPI title="A receber" value="R$ 42,3k" change={-3} icon={Wallet} delay={180} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card-premium p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-4">Recebimentos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12 }}
                  formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
                />
                <Area type="monotone" dataKey="recebido" stroke="var(--brand)" strokeWidth={2.5} fill="url(#gR)" animationDuration={1200} name="Recebido" />
                <Area type="monotone" dataKey="previsto" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 4" fill="transparent" animationDuration={1400} name="Previsto" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 card-premium p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-4">Status contratos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value" animationDuration={1000}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden" padding="none">
        <div className="px-5 py-4 border-b border-border-color">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Contratos recentes</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Empresa Alpha Ltda', 'R$ 12.500', 'Assinado', 'bg-brand/15 text-brand-dark'],
              ['Beta Comércio', 'R$ 4.800', 'Pendente', 'bg-aviso/15 text-aviso'],
              ['Gamma Serviços', 'R$ 9.200', 'Enviado', 'bg-informacao/15 text-informacao'],
              ['Delta Tech', 'R$ 15.000', 'Assinado', 'bg-brand/15 text-brand-dark'],
            ].map(([c, v, s, cls]) => (
              <tr key={c as string} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40">
                <td className="px-5 py-3.5 font-medium">{c}</td>
                <td className="px-5 py-3.5 tabular-nums text-text-secondary">{v}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{s}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

