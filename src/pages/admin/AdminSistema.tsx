import { Card, PageHeader, Badge } from "@/components/ui";
import { ChevronDown } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function AdminSistema() {
  const envOk = Boolean(import.meta.env.VITE_SUPABASE_URL);

  return (
    <div className="min-w-0 max-w-3xl space-y-4">
      <PageHeader
        title="Sistema"
        description="Configura��o e sa�de da plataforma"
      />
      <Card className="space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold">Identidade</h2>
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <img
            src={BRAND.logo}
            alt=""
            className="h-12 w-auto max-w-full object-contain sm:h-14"
          />
          <div className="min-w-0 break-words text-sm">
            <p className="font-medium">{BRAND.name}</p>
            <p className="text-text-secondary">{BRAND.product}</p>
            <p className="text-text-secondary text-xs mt-1">{BRAND.site}</p>
          </div>
        </div>
      </Card>
      <Card className="space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold">Integra��es</h2>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Supabase</span>
          <Badge variant={envOk ? "success" : "danger"}>
            {envOk ? "Configurado" : "Ausente"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Ambiente</span>
          <Badge variant="info">{import.meta.env.MODE}</Badge>
        </div>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-text-primary sm:px-5 [&::-webkit-details-marker]:hidden">
            <span>Notas de opera��o</span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="border-t border-border-color p-4 text-sm text-text-secondary sm:p-5">
            Em produ��o, o painel admin deve usar autentica��o server-side e
            service role do Supabase. As listagens de empresas/usu�rios
            respeitam as pol�ticas RLS atuais.
          </p>
        </details>
      </Card>
    </div>
  );
}

