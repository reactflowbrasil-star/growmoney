import { Card, PageHeader, Badge } from '@/components/ui';
import { BRAND } from '@/lib/brand';

export default function AdminSistema() {
  const envOk = Boolean(import.meta.env.VITE_SUPABASE_URL);

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="Sistema" description="Configuração e saúde da plataforma" />
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Identidade</h2>
        <div className="flex items-center gap-4">
          <img src={BRAND.logo} alt="" className="h-14 w-auto max-w-[180px] object-contain" />
          <div className="text-sm">
            <p className="font-medium">{BRAND.name}</p>
            <p className="text-text-secondary">{BRAND.product}</p>
            <p className="text-text-secondary text-xs mt-1">{BRAND.site}</p>
          </div>
        </div>
      </Card>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Integrações</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Supabase</span>
          <Badge variant={envOk ? 'success' : 'danger'}>{envOk ? 'Configurado' : 'Ausente'}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Ambiente</span>
          <Badge variant="info">{import.meta.env.MODE}</Badge>
        </div>
      </Card>
      <Card className="p-5 space-y-2 text-sm text-text-secondary">
        <h2 className="font-semibold text-text-primary">Notas</h2>
        <p>
          Em produção, o painel admin deve usar autenticação server-side e service role do Supabase.
          As listagens de empresas/usuários respeitam as políticas RLS atuais.
        </p>
      </Card>
    </div>
  );
}

